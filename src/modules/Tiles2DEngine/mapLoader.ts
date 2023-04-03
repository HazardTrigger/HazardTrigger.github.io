import { Matrix3, Vector3 } from 'three';
import WebMercator from './webMercator';
import MapEvent from './mapEvent';

export type MapEventOptions = {
    enableTranslate?: boolean; // 开启平移拖拽控制
    enableWheelZoom?: boolean; // 开启鼠标滚轮放缩控制
    enableClickRotate?: boolean; // 开启点击旋转控制
    enableDragRotate?: boolean; // 开启右键长按拖动旋转控制
};

export type MapLoaderOptions = {
    id: string; // 容器id
    minZoomLevel: number; // 最小放缩等级
    maxZoomLevel: number; // 最大放缩等级
    defaultZoomLevel: number; // 默认放缩等级
    perTileSize: number; // 瓦片大小
    lon: number; // 经度
    lat: number; // 纬度
    baseUrl: string; // 地图瓦片请求地址
    mapKey: string; // 地图瓦片请求key
} & MapEventOptions;

export type TileInfo = {
    tx: number; // 瓦片横向索引
    ty: number; // 瓦片纵向索引
    key: string; // 瓦片xyz
    url: string; // 瓦片对应的url
    dx: number; // 像素横轴坐标
    dy: number; // 像素纵轴坐标
    width: number; // 瓦片绘制宽度
    height: number; // 瓦片绘制高度
    status: number; // 0: 未加载 1: 加载中 2: 加载成功 3: 加载失败
    image: null | HTMLImageElement; // ctx.drawImage的图像源
    distance: number; // 优先级，目前为瓦片中心距离地图中心的距离的倒数
    visible: boolean; // 瓦片的可见性
};

export default class MapLoader {
    viewerContainer: HTMLElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    width: number;
    height: number;
    origin: Vector3[];
    originCanvas: Vector3[];
    curr: Vector3[];
    currCanvas: Vector3[];
    minZoomLevel: number;
    maxZoomLevel: number;
    defaultZoomLevel: number;
    curZoomLevel: number;
    perTileSize: number;
    padding: number;
    wm: WebMercator;
    defaultResolution: number;
    resolution: number;
    canvasToMercatorMatrix: Matrix3;
    matrix: Matrix3;
    rotationAngle: number;
    centerLon: number;
    centerLat: number;
    baseUrl: string;
    mapKey: string;
    frameCount: number;
    frameId: number;
    cache: Map<string, TileInfo>;
    visibleTileSets: Set<TileInfo>[];
    cacheTileLists: TileInfo[][];
    usedSets: Set<TileInfo>[];
    activeTileSets: Set<TileInfo>[];
    event: MapEvent;

    constructor(options: MapLoaderOptions) {
        this.viewerContainer = document.getElementById(options.id)!;

        let viewerCanvas = document.createElement('div');
        viewerCanvas.id = 'xmapCanvasContainer';

        let canvas = document.createElement('canvas');
        canvas.width = this.viewerContainer.clientWidth;
        canvas.height = this.viewerContainer.clientHeight;
        viewerCanvas.appendChild(canvas);
        this.viewerContainer.appendChild(viewerCanvas);

        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.fillStyle = 'hsla(0, 5%, 5%, 0.025)';
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        let {
            minZoomLevel,
            maxZoomLevel,
            defaultZoomLevel,
            perTileSize,
            lon,
            lat,
            baseUrl,
            mapKey,
        } = options;

        this.origin = new Array<Vector3>(5);
        this.originCanvas = [
            new Vector3(0, 0, 1), // left top
            new Vector3(this.width, 0, 1), // right top
            new Vector3(this.width, this.height, 1), // right bottom
            new Vector3(0, this.height, 1), // left bottom
            new Vector3(this.width / 2, this.height / 2, 1), // center
        ];

        this.curr = new Array<Vector3>(5);
        this.currCanvas = [
            new Vector3(0, 0, 1), // left top
            new Vector3(this.width, 0, 1), // right top
            new Vector3(this.width, this.height, 1), // right bottom
            new Vector3(0, this.height, 1), // left bottom
            new Vector3(this.width / 2, this.height / 2, 1), // center
        ];

        // 缩放层级
        this.minZoomLevel = minZoomLevel || 0;
        this.maxZoomLevel = maxZoomLevel || 24;
        this.defaultZoomLevel = defaultZoomLevel || 0;
        this.curZoomLevel = defaultZoomLevel || 0;

        // 瓦片大小
        this.perTileSize = perTileSize || 256;

        // 引入padding，以缓存可视区域边缘处的瓦片
        this.padding = 2;

        // 像素分辨率 m/px
        this.wm = new WebMercator(this.perTileSize);
        this.defaultResolution = this.wm.resolution(this.defaultZoomLevel);
        this.resolution = this.wm.resolution(this.curZoomLevel);

        // 从canvas坐标转换到mercator坐标的映射矩阵
        this.canvasToMercatorMatrix = new Matrix3().fromArray([
            this.resolution,
            0,
            0,

            0,
            -this.resolution,
            0,

            -this.wm.originShift,
            this.wm.originShift,
            1,
        ]);

        // 用于平移、缩放、旋转等鼠标交互操作的变换矩阵
        this.matrix = new Matrix3().identity();

        // 旋转角度
        this.rotationAngle = 0;

        // 中心经纬度
        this.centerLon = lon || 0;
        this.centerLat = lat || 0;

        // 地图请求地址
        this.baseUrl = baseUrl || '';
        this.mapKey = mapKey || '';

        // 用于记录帧数，控制更新帧率
        this.frameCount = 0;
        // 记录动画帧ID
        this.frameId = 0;

        let zoomCount = maxZoomLevel - minZoomLevel + 1;

        // 用于缓存tiles，key='z/x/y'
        this.cache = new Map<string, TileInfo>();

        // 用于记录可视区域内的tile，其中visibleTileSets[i]=new Set()存放第zoomLevel = minZoomLevel + i 层级的可见瓦片
        // 当前可视区域内的
        this.visibleTileSets = new Array(zoomCount)
            .fill(0)
            .map(() => new Set<TileInfo>());

        // 用于缓存可视区域的tile，Array便于排序，Set便于查询
        // 在缓存中的可视tile（现在不一定在可视区域内）
        this.cacheTileLists = new Array(zoomCount)
            .fill(0)
            .map(() => new Array<TileInfo>());
        this.usedSets = new Array(zoomCount)
            .fill(0)
            .map(() => new Set<TileInfo>());

        // 用于存放可视区域内加载好的tile
        // 在缓存中+在可视区域内+已经加载成功的
        this.activeTileSets = new Array(zoomCount)
            .fill(0)
            .map(() => new Set<TileInfo>());

        this.setViewportSize({});
        this.updateVisiblePort();
        this.flyTo(this.centerLon, this.centerLat);

        // 添加绑定事件
        this.event = new MapEvent(this, {
            enableTranslate: options.enableTranslate || true,
            enableWheelZoom: options.enableWheelZoom || true,
            enableClickRotate: options.enableClickRotate || false,
            enableDragRotate: options.enableDragRotate || true,
        });

        this.frameId = requestAnimationFrame(this.update.bind(this));
    }

    setViewportSize({ width, height }: { width?: number; height?: number }) {
        // 更新窗口大小
        if (typeof width === 'number' && width > 0) {
            this.width = width;
        }
        if (typeof height === 'number' && height > 0) {
            this.height = height;
        }

        // 更新初始窗口顶点的canvas坐标
        this.originCanvas = [
            new Vector3(0, 0, 1), // left top
            new Vector3(this.width, 0, 1), // right top
            new Vector3(this.width, this.height, 1), // right bottom
            new Vector3(0, this.height, 1), // left bottom
            new Vector3(this.width / 2, this.height / 2, 1), // center
        ];

        for (let i = 0; i < 5; i++) {
            let temp = this.originCanvas[i].clone();
            this.origin[i] = temp.applyMatrix3(this.canvasToMercatorMatrix);
        }
    }

    updateVisiblePort() {
        // 求变换矩阵的逆矩阵
        let { matrix, canvasToMercatorMatrix, originCanvas } = this;
        let inverseMatrix = matrix.clone().invert(); // 交互产生的变换矩阵的逆矩阵

        originCanvas.forEach((vec, i) => {
            let temp = vec.clone();
            this.currCanvas[i] = temp.applyMatrix3(inverseMatrix);
            let temp1 = this.currCanvas[i].clone();
            this.curr[i] = temp1.applyMatrix3(canvasToMercatorMatrix);
        });
    }

    updateMatrix(m: Matrix3) {
        let { matrix } = this;
        matrix.copy(m);

        let cos = matrix.elements[0];
        let sin = matrix.elements[1];
        this.rotationAngle = Math.atan2(sin, cos);

        this.updateVisiblePort(); // matrix变了s所以需要更新一下场景坐标
    }

    flyTo(centerLon: number, centerLat: number) {
        let { resolution, wm, curr, matrix } = this;
        // 计算目标中心点的web墨卡托坐标
        let { mx, my } = wm?.lngLatToMeters(centerLon, centerLat)!;

        // 获取当前中心点的web墨卡托坐标
        let curMx = curr[4].x;
        let curMy = curr[4].y;

        // 计算把目标中心点移到画布中心的canvas平移量
        let dx = (mx - curMx) / resolution;
        let dy = (my - curMy) / resolution;

        this.updateMatrix(
            matrix.premultiply(
                new Matrix3().fromArray([1, 0, 0, 0, 1, 0, -dx, dy, 1]),
            ),
        );
    }

    scale(s: number) {
        let { wm, minZoomLevel, maxZoomLevel } = this;

        // 更新分辨率
        this.resolution = this.resolution / s;

        // 更新缩放层级
        this.curZoomLevel = wm?.getZoom(
            this.resolution,
            minZoomLevel,
            maxZoomLevel,
        )!;
    }

    // // 绕画面中心旋转
    // rotate(angle: number) {
    //     let { width, height, matrix } = this;
    //     // 获取canvas中心点的坐标
    //     let xCenter = width / 2;
    //     let yCenter = height / 2;

    //     // 以当前画面中心为旋转中心
    //     // 1.把中心点平移到原点位置
    //     let tMatrix1 = math.matrix([
    //         [1, 0, -xCenter],
    //         [0, 1, -yCenter],
    //         [0, 0, 1],
    //     ]);

    //     // 2.旋转
    //     let c = Math.cos(angle);
    //     let s = Math.sin(angle);
    //     let rMatrix = math.matrix([
    //         [c, -s, 0],
    //         [s, c, 0],
    //         [0, 0, 1],
    //     ]);

    //     // 3.还原原点
    //     let tMatrix2 = math.matrix([
    //         [1, 0, xCenter],
    //         [0, 1, yCenter],
    //         [0, 0, 1],
    //     ]);

    //     // 4.计算新的变换矩阵
    //     let tempMatrix1 = multiplyMatrix(rMatrix, tMatrix1);
    //     let tempMatrix2 = multiplyMatrix(tMatrix2, tempMatrix1);
    //     let newMatrix = multiplyMatrix(tempMatrix2, matrix!);
    //     // 5.更新变换矩阵
    //     this.updateMatrix(newMatrix);
    // }

    // // 绕画面中心放大/缩小
    // zoom(s: number) {
    //     let {
    //         width,
    //         height,
    //         matrix,
    //         curZoomLevel,
    //         minZoomLevel,
    //         maxZoomLevel,
    //         wm,
    //         resolution,
    //     } = this;
    //     if (
    //         (curZoomLevel <= maxZoomLevel && s > 1) ||
    //         (curZoomLevel >= minZoomLevel && s < 1)
    //     ) {
    //         // 由于鼠标操作的单次缩放倍数和当前缩放倍数可能不统一，因此需边界处理
    //         let s_correct =
    //             s > 1
    //                 ? Math.min(s, resolution / wm?.resolution(maxZoomLevel)!)
    //                 : Math.max(s, resolution / wm?.resolution(minZoomLevel)!);
    //         if (s_correct === 1) {
    //             console.log(
    //                 s > 1 ? '已经放大到最高层级！' : '已经缩小到最低层级！',
    //             );
    //         }

    //         // 获取canvas中心点的坐标
    //         let xCenter = width / 2;
    //         let yCenter = height / 2;

    //         // 以当前画面中心为缩放不动点进行放大
    //         // 1.把中心点变成原点
    //         let tMatrix1 = math.matrix([
    //             [1, 0, -xCenter],
    //             [0, 1, -yCenter],
    //             [0, 0, 1],
    //         ]);

    //         // 2.缩放
    //         let sMatrix = math.matrix([
    //             [s_correct, 0, 0],
    //             [0, s_correct, 0],
    //             [0, 0, 1],
    //         ]);

    //         //3.还原原点
    //         let tMatrix2 = math.matrix([
    //             [1, 0, xCenter],
    //             [0, 1, yCenter],
    //             [0, 0, 1],
    //         ]);
    //         // 4.计算新的变换矩阵
    //         let tempMatrix1 = multiplyMatrix(sMatrix, tMatrix1);
    //         let tempMatrix2 = multiplyMatrix(tMatrix2, tempMatrix1);
    //         let newMatrix = multiplyMatrix(tempMatrix2, matrix!);
    //         // 5.更新变换矩阵、分辨率和层级
    //         this.updateMatrix(newMatrix);
    //         this.scale(s_correct);
    //     }
    // }

    // // 重置地图位置
    // reload() {
    //     // 重置缩放层级
    //     this.curZoomLevel = this.defaultZoomLevel;
    //     // 重置像素分辨率
    //     this.resolution = this.defaultResolution;

    //     // 重置变换矩阵
    //     this.matrix = math.identity(3) as Matrix;

    //     // 重新计算初始窗口顶点
    //     this.width = this.viewerContainer!.clientWidth;
    //     this.height = this.viewerContainer!.clientHeight;
    //     this.setViewportSize({});
    //     this.updateVisiblePort();
    //     this.flyTo(this.centerLon, this.centerLat);
    // }

    update() {
        let frameControl = 4;
        // 每frameControl帧数筛选一下瓦片数据
        if (this.frameCount % frameControl === 0) {
            let { minZoomLevel, curZoomLevel, width, height, ctx } = this;

            ctx!.clearRect(0, 0, width, height);

            // 加载[z-2, z]共三个层级的瓦片
            // 层级范围需要通过minZoomLevel进行校验，避免对低层级瓦片的超限请求
            for (
                let z = Math.max(minZoomLevel, curZoomLevel - 2);
                z <= curZoomLevel;
                z++
            ) {
                this.updateTiles(z, this);
            }

            // this.navigator!.updateCompassFromMap();

            // this.overlays.update();
        }

        // 更新帧数
        this.frameCount++;
        this.frameId = requestAnimationFrame(this.update.bind(this));
    }

    // 用于每帧层级z下的瓦片更新
    updateTiles(z: number, map: MapLoader) {
        // 由于排序和请求加载时间过长，因此将对tiles的处理放入微任务中
        // 检索当前可视区域内的瓦片

        queueMicrotask(() => {
            this.getVisibleTiles(z, map);
        });

        // 按照瓦片到canvas中心的距离进行优先级排序
        queueMicrotask(() => {
            this.sortTiles(z, map);
        });

        // 请求加载可视区域内的瓦片
        queueMicrotask(() => {
            this.downloadTiles(z, map);
        });

        // 获取可用瓦片
        queueMicrotask(() => {
            this.setActiveTiles(z, map);
        });

        // 绘制可用瓦片
        queueMicrotask(() => {
            this.drawActiveTiles(z, map);
        });
    }

    // 1.获取层级z下可视区域内的瓦片集合
    getVisibleTiles(z: number, map: MapLoader) {
        let {
            wm,
            curr,
            perTileSize,
            minZoomLevel,
            padding,
            cache,
            baseUrl,
            mapKey,
            visibleTileSets,
            defaultZoomLevel,
        } = map;

        // 清空原来的可视区域数据集，重新计算可视瓦片
        const curVTS = visibleTileSets![z - minZoomLevel];
        curVTS!.clear();

        // 计算可视区域顶点和中心点的行列号 LT-RT-RB-LB-C
        let tileIndex = new Array(5);
        curr.forEach((val, i) => {
            let mx = val.x;
            let my = val.y;
            // 获取tms的瓦片索引
            let { tx, ty } = wm?.metersToTile(mx, my, z)!;
            // 获取google瓦片索引
            tileIndex[i] = wm?.googleTile(tx, ty, z);
        });

        // 计算可视范围内行列方向的瓦片数量
        let xCount = tileIndex[2].tx - tileIndex[0].tx + 3;
        let yCount = tileIndex[2].ty - tileIndex[0].ty + 3;

        // canvas左上角顶点的行列号
        let tx0 = tileIndex[0].tx;
        let ty0 = tileIndex[0].ty;

        // 计算给定层级下的行列号最大值
        let maxT = Math.pow(2, z) - 1;
        // 计算给定层级在defaultZoomLevel下的显示尺寸
        let size = perTileSize * Math.pow(2, defaultZoomLevel - z);

        // 遍历可视区域内的瓦片
        for (let i = -padding; i < xCount + padding; i++) {
            let tx = tx0 + i;
            for (let j = -padding; j < yCount + padding; j++) {
                let ty = ty0 + j;
                // 由于引入了padding，计算出来的边缘行列号可能超限，因此需要对行列号范围进行校验，避免无效请求
                if (ty >= 0 && ty <= maxT && tx >= 0 && tx <= maxT) {
                    let key = `&x=${tx}&y=${ty}&z=${z}&s=Galile`;

                    // 计算该瓦片左上角在屏幕上绘制的坐标
                    let dx = tx * size;
                    let dy = ty * size;

                    // 获取屏幕中心的mercator坐标
                    // let xCenter = curr[4].x;
                    // let yCenter = curr[4].y;
                    // 获取瓦片中心的mercator坐标
                    let x =
                        (dx + perTileSize / 2) * wm!.resolution(z) -
                        wm!.originShift;
                    let y =
                        wm!.originShift -
                        (dy + perTileSize / 2) * wm!.resolution(z);

                    let distance = this.calPriority(x, y, z);

                    // 设置该瓦片信息
                    if (!cache!.has(key)) {
                        // 如果缓存中没有该瓦片，则新建瓦片信息
                        cache!.set(key, {
                            tx: tx, // 行号
                            ty: ty, // 列号
                            key: key,
                            url: baseUrl + key, // 请求地址
                            dx: dx, //左上角在目标canvas上的x坐标
                            dy: dy, // 左上角在目标canvas上的y坐标
                            width: size, // 在目标canvas上绘制的宽度
                            height: size, // 在目标canvas上绘制的高度
                            status: 0, //加载状态: 0 未加载  1 加载中  2 加载成功  3 加载失败
                            image: null, // 图片对象
                            distance: distance,
                            visible: true, // 标记是否可见
                        });
                    } else {
                        // 否则，仅修改到canvas中心的距离和可见状态
                        const curTile = cache!.get(key);
                        curTile!.visible = true;
                        curTile!.distance = distance;
                    }

                    // 在可视集合中添加该瓦片
                    curVTS!.add(cache!.get(key)!);
                }
            }
        }
    }

    // 1.1 计算瓦片优先级
    calPriority(mx: number, my: number, z: number) {
        const { maxZoomLevel, curr } = this;
        const C = maxZoomLevel;
        const x_c = curr[4].x;
        const y_c = curr[4].y;
        const delta_x = 0.6;
        const delta_y = 0.6;

        let ratio =
            Math.exp(
                -0.5 *
                    (Math.pow(mx - x_c, 2.0) / Math.pow(delta_x, 2.0) +
                        Math.pow(my - y_c, 2.0) / Math.pow(delta_y, 2.0)),
            ) /
            (2.0 * Math.PI * delta_x * delta_y);

        let distanceWeight =
            1 / Math.sqrt(Math.pow(mx - x_c, 2) + Math.pow(my - y_c, 2));

        let zoomWeight = C / z;

        return zoomWeight + distanceWeight * ratio;
    }

    // 2.对层级z下的瓦片缓存进行优先级排序
    sortTiles(z: number, map: MapLoader) {
        let { visibleTileSets, cacheTileLists, usedSets, minZoomLevel, cache } =
            map;

        let curZ = z - minZoomLevel;
        // 取当前层级z的可视区域集合
        const curVTS = visibleTileSets![curZ];

        // 取当前的可视缓存集合
        const curCacheList = cacheTileLists![curZ];
        const curUsedSet = usedSets![curZ];

        // 将可视区域内的瓦片放到cacheTileLists(z)和usedSets(z)中
        curVTS!.forEach((tile) => {
            if (!curUsedSet!.has(tile)) {
                curUsedSet!.add(tile);
                curCacheList!!.push(tile);
            }
        });

        curCacheList!!.sort((tile1, tile2) => {
            return tile2.distance - tile1.distance;
        });

        // 计算层级z下瓦片最大容纳量
        let maxCacheSize = this.calcMaxCacheSize(z);

        // 把超出缓存范围、离canvas中心最远的瓦片删掉
        if (curUsedSet!.size > maxCacheSize) {
            let len = curCacheList!.length;
            for (let i = len - 1; i >= maxCacheSize; i--) {
                // 从可视缓存区中删除
                let tile = curCacheList!.pop();
                curUsedSet!.delete(tile!);

                let { key, image } = tile!;
                // 从缓存中删除
                cache!.delete(key);
                // 回收图片内存，将图片设置为未加载状态
                if (!!image) {
                    image = null;
                    tile!.status = 0;
                }
            }
        }

        // 将可视区域范围外的tile标记为不可见
        let len = curCacheList!.length;
        for (let i = len - 1; i >= 0; i--) {
            let tile = curCacheList![i];
            if (curVTS!.has(tile)) {
                break;
            } else {
                tile.visible = false;
            }
        }
    }

    // 2.1 计算可视区域内层级z下瓦片的最大容纳量
    calcMaxCacheSize(z: number) {
        let { defaultZoomLevel, perTileSize, padding, width, height } = this;
        // 计算当前层级单张瓦片的最小显示尺寸
        let size = perTileSize * Math.pow(2, defaultZoomLevel - z);

        let col = Math.floor(width / size) + padding * 2 + 2;
        let row = Math.floor(height / size) + padding * 2 + 2;

        return Math.min(row * col, Math.pow(4, z));
    }

    // 3.请求加载层级z下的可视瓦片
    downloadTiles(z: number, map: MapLoader) {
        let { cacheTileLists, minZoomLevel } = map;

        // 取已排序的层级z下可视瓦片缓存
        let curZ = z - minZoomLevel;
        const curCacheList = cacheTileLists![curZ];

        curCacheList!.forEach((tile) => {
            let { status, url } = tile;
            if (status === 0 || status === 3) {
                // 如果未加载或加载失败则发起加载请求
                let img = new Image();
                tile.image = img;

                // 请求成功
                img.onload = () => {
                    // 修改加载状态为加载成功
                    tile.status = 2;
                    // // 把请求成功的可用资源存起来
                    // curATS.add(tile);
                };
                // 请求失败
                img.onerror = () => {
                    // 修改加载状态为加载失败
                    tile.status = 3;
                };

                //请求加载
                // 修改加载状态为加载中
                tile.status = 1;
                img.src = url;
            }
        });
    }

    // 4.将在cacheTileLists(z)中处于可视区域切加载好的瓦片放进activeTileSets(z)
    setActiveTiles(z: number, map: MapLoader) {
        let { cacheTileLists, activeTileSets, minZoomLevel } = map;

        // 取当前层级z下的缓存
        let curZ = z - minZoomLevel;
        const curCacheList = cacheTileLists![curZ];
        const curATS = activeTileSets![curZ];

        // 重置清空
        curATS!.clear();

        // 遍历可视缓存内的每张瓦片
        curCacheList!.forEach((tile) => {
            let { status, visible } = tile;
            if (status === 2 && visible) {
                // 添加可视的且加载好的瓦片
                curATS!.add(tile);
            }
        });
    }

    // 绘制层级z下可视区域内已经加载好的瓦片
    drawActiveTiles(z: number, map: MapLoader) {
        let { activeTileSets, ctx, perTileSize, minZoomLevel, matrix } = map;

        ctx!.save();
        ctx!.setTransform(
            matrix.elements[0],
            matrix.elements[1],
            matrix.elements[3],
            matrix.elements[4],
            matrix.elements[6],
            matrix.elements[7],
        );

        // 取出层级z的可用瓦片
        const curATS = activeTileSets![z - minZoomLevel];

        // 遍历当前层级下所有可用瓦片
        curATS!.forEach((tile) => {
            let { image, dx, dy, width, height } = tile;
            // 绘制
            ctx!.drawImage(
                image!,
                0,
                0,
                perTileSize,
                perTileSize,
                dx,
                dy,
                width,
                height,
            );
        });

        ctx!.restore();
    }
}
