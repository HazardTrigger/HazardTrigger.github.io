import { Matrix3 } from 'three';
import MapLoader, { MapEventOptions } from './mapLoader';

export default class MapEvent {
    private viewerCanvas: HTMLDivElement = document.getElementById(
        'xmapCanvasContainer',
    ) as HTMLDivElement;
    map: MapLoader;
    panStartX: number = 0;
    panStartY: number = 0;
    isPanning: boolean = false;
    panStartMatrix: Matrix3 = new Matrix3().identity();

    // 缩放事件相关参数
    // 缩放跳级的操作次数
    scaleCount: number = 1;

    private isRotating: boolean = false; // 是否可以旋转
    // 旋转起始坐标
    private rotateStartX: number = 0;
    private rotateStartY: number = 0;
    //旋转起始矩阵
    private rotateStartMatrix: Matrix3 = new Matrix3().identity();

    constructor(map: MapLoader, opts: MapEventOptions) {
        this.map = map;

        if (opts.enableTranslate) {
            this.translateEventBind();
        }

        if (opts.enableWheelZoom) {
            this.scaleEventBind();
        }

        if (opts.enableClickRotate) {
            this.rotatePointEventBind();
        }

        if (opts.enableDragRotate) {
            this.rotateEventBind();
        }
    }

    /**
     * 平移控制绑定
     */
    translateEventBind() {
        const { viewerCanvas } = this;

        viewerCanvas.addEventListener('mousedown', (e) => {
            // 平移开始前
            if (e.button === 0) {
                // 按下鼠标左键时
                e.stopPropagation(); // 禁止默认事件
                const { offsetX, offsetY } = e;
                // 记录平移起始坐标
                this.panStartX = offsetX;
                this.panStartY = offsetY;
                this.isPanning = true; // 平移开启
                this.panStartMatrix = this.map.matrix.clone(); // 将地图坐标系矩阵作为平移矩阵的初始值
            }
        });

        viewerCanvas.addEventListener('mousemove', (e) => {
            // 平移进行中
            e.stopPropagation(); //禁止默认事件

            if (this.isPanning && e.button === 0) {
                // 允许平移且长按鼠标左键时
                const { offsetX, offsetY } = e;
                const { panStartX, panStartY, panStartMatrix } = this;

                // 计算当前鼠标坐标与起始坐标的偏移量
                let diffX = offsetX - panStartX;
                let diffY = offsetY - panStartY;

                // 根据偏移量更新地图坐标系的矩阵实现平移效果
                this.map.updateMatrix(
                    panStartMatrix
                        .clone()
                        .premultiply(
                            new Matrix3().fromArray([
                                1,
                                0,
                                0,

                                0,
                                1,
                                0,

                                diffX,
                                diffY,
                                1,
                            ]),
                        ),
                );
            }
        });

        viewerCanvas.addEventListener('mouseup', (e) => {
            // 平移结束后
            if (e.button === 0) {
                // 松开鼠标左键时
                e.stopPropagation();
                this.isPanning = false; // 关闭平移控制
            }
        });
    }

    /**
     * 放缩控制绑定
     */
    scaleEventBind() {
        const { viewerCanvas } = this;

        viewerCanvas.addEventListener('wheel', (e) => {
            // 放缩中
            e.preventDefault(); // 禁止默认事件
            e.stopPropagation(); // 禁止事件传播

            let { map, scaleCount } = this;
            if (
                // 确认当前放缩等级处在最大最小放缩等级范围内且鼠标滚轮方向正确
                (map.curZoomLevel < map.maxZoomLevel && e.deltaY < 0) ||
                (map.curZoomLevel > map.minZoomLevel && e.deltaY > 0)
            ) {
                const { offsetX, offsetY } = e;
                let scaleStartMatrix = map.matrix.clone(); // 初始化放缩矩阵
                // 以当前鼠标坐标为放缩原点，把当前地图坐标系移动到画布原点,
                // 使得坐标系的第三列的平移量tx与ty变为0便于放缩的同时避免坐标系放缩后错误的位移
                let tMatrix1 = new Matrix3().fromArray([
                    1,
                    0,
                    0,

                    0,
                    1,
                    0,

                    -offsetX,
                    -offsetY,
                    1,
                ]);

                let scale = // 计算放缩量
                    e.deltaY < 0 // deltaY大于0为下滚,deltaY小于0为上滚
                        ? (Math.pow(2, 1 / scaleCount) as number) // 放大
                        : (Math.pow(0.5, 1 / scaleCount) as number); // 缩小

                let sMatrix = new Matrix3().fromArray([
                    scale,
                    0,
                    0,

                    0,
                    scale,
                    0,

                    0,
                    0,
                    1,
                ]);

                let tMatrix2 = new Matrix3().fromArray([
                    1,
                    0,
                    0,

                    0,
                    1,
                    0,

                    offsetX,
                    offsetY,
                    1,
                ]);

                let temp = new Matrix3().identity();
                temp = temp.premultiply(scaleStartMatrix);
                temp = temp.premultiply(tMatrix1);
                temp = temp.premultiply(sMatrix);
                temp = temp.premultiply(tMatrix2);

                map.updateMatrix(temp); // 更新map坐标系矩阵
                map.scale(scale); // 更新地图zoom等级
            } else if (map.curZoomLevel === map.maxZoomLevel && e.deltaY < 0) {
                console.log('已经放缩到最高层级');
            } else if (map.curZoomLevel === map.minZoomLevel && e.deltaY > 0) {
                console.log('已经放缩到最低层级');
            }
        });
    }

    /**
     * 旋转控制绑定
     */
    rotateEventBind() {
        const { viewerCanvas } = this;

        viewerCanvas.addEventListener('contextmenu', (e) => {
            // 禁用鼠标右键菜单事件
            e.preventDefault();
        });

        viewerCanvas.addEventListener('mousedown', (e) => {
            // 旋转开始前
            if (e.button === 2) {
                // 点击鼠标右键时
                e.preventDefault();
                const { offsetX, offsetY } = e;
                // 记录鼠标的起始位置
                this.rotateStartX = offsetX;
                this.rotateStartY = offsetY;
                // 设置旋转控制状态
                this.isRotating = true;
                // 初始化旋转矩阵
                this.rotateStartMatrix = this.map.matrix.clone()!;
            }
        });

        viewerCanvas.addEventListener('mousemove', (e) => {
            // 旋转中
            e.stopPropagation();

            if (this.isRotating) {
                const { offsetX, offsetY } = e;
                const { rotateStartX, rotateStartY, rotateStartMatrix } = this;

                // 获取地图中心坐标
                let x0 = this.map.width! / 2;
                let y0 = this.map.height! / 2;

                // https://stackoverflow.com/questions/14066933/direct-way-of-computing-clockwise-angle-between-2-vectors/16544330
                // 获取旋转起始点与地图中心点两点构成的向量
                let vec1 = [rotateStartX - x0, rotateStartY - y0];
                // 获取旋转中的鼠标坐标点与地图中心两点构成的向量
                let vec2 = [offsetX - x0, offsetY - y0];
                let dotProduct = vec1[0] * vec1[0] + vec1[1] * vec1[1]; // 计算两个向量之间的点积 公式 |vec1| * |vec2| * cos𝛉为几何计算公式, 代码为线性代数的计算公式，几何计算公式便于理解角度如何计算
                let crossProduct = vec1[0] * vec2[1] - vec1[1] * vec2[0]; // 计算两个向量之间的叉积 公式 |vec1| * |vec2| * sin𝛉为几何计算公式, 代码为线性代数的计算公式，几何计算公式便于理解角度如何计算
                /**
                 * 反正切计算角度
                 * (|vec1| * |vec2| * sin𝛉) / (|vec1| * |vec2| * cos𝛉) = sin𝛉 / cos𝛉 = tan𝛉
                 * angle = tan𝛉 ^ -1
                 */
                let angle = Math.atan2(crossProduct, dotProduct);

                // 先将地图的世界坐标矩阵移动到左上角将矩阵中平移的变量变为0便于旋转
                let tMatrix1 = new Matrix3().fromArray([
                    1,
                    0,
                    0,
                    0,
                    1,
                    0,
                    -x0,
                    -y0,
                    1,
                ]);

                // 计算旋转矩阵，绕z轴旋转
                let c = Math.cos(angle);
                let s = Math.sin(angle);
                let rMatrix = new Matrix3().fromArray([
                    c,
                    s,
                    0,
                    -s,
                    c,
                    0,
                    0,
                    0,
                    1,
                ]);

                // 旋转完成后将地图坐标系移动到起始位置
                let tMatrix2 = new Matrix3().fromArray([
                    1,
                    0,
                    0,
                    0,
                    1,
                    0,
                    x0,
                    y0,
                    1,
                ]);

                // 计算新的变换矩阵
                let temp = new Matrix3().identity();
                temp = temp.premultiply(rotateStartMatrix);
                temp = temp.premultiply(tMatrix1);
                temp = temp.premultiply(rMatrix);
                temp = temp.premultiply(tMatrix2);

                this.map.updateMatrix(temp);
            }
        });

        viewerCanvas.addEventListener('mouseup', (e) => {
            // 旋转结束
            if (e.button === 2) {
                // 松开鼠标右键时
                e.stopPropagation();
                this.isRotating = false; //关闭旋转状态
            }
        });
    }

    rotatePointEventBind() {
        const { viewerCanvas } = this;

        viewerCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const { offsetX, offsetY } = e;

            let rotateStartMatrix = this.map.matrix.clone();

            let tMatrix1 = new Matrix3().fromArray([
                1,
                0,
                0,
                0,
                1,
                0,
                -offsetX,
                -offsetY,
                1,
            ]);

            let c = Math.cos(-Math.PI / 12);
            let s = Math.sin(-Math.PI / 12);
            let rMatrix = new Matrix3().fromArray([c, s, 0, -s, c, 0, 0, 0, 1]);

            let tMatrix2 = new Matrix3().fromArray([
                1,
                0,
                0,
                0,
                1,
                0,
                offsetX,
                offsetY,
                1,
            ]);

            let temp = new Matrix3().identity();
            temp = temp.premultiply(rotateStartMatrix);
            temp = temp.premultiply(tMatrix1);
            temp = temp.premultiply(rMatrix);
            temp = temp.premultiply(tMatrix2);

            this.map.updateMatrix(temp);
        });
    }
}
