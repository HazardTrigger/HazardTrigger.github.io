// ref: https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#3/15.00/50.00
export const earthRadius = 6378137.0; // 地球半径

export type TileIndex = {
    tx: number;
    ty: number;
};

export default class WebMercator {
    tileSize: number;
    initialResolution: number;
    originShift: number;

    constructor(tileSize: number = 256) {
        this.tileSize = tileSize; // 单位瓦片大小256x256

        this.initialResolution = (2 * Math.PI * earthRadius) / this.tileSize; // 初始化分辨率为2𝛑R / 2^0 * 256

        this.originShift = (2 * Math.PI * earthRadius) / 2.0; // 将坐标点移动到以原点在屏幕中心的世界坐标系所需要的偏移量
    }

    /**
     *  计算当前像素坐标系与世界坐标系之间对应的分辨率 单位 m/px
     * 公式为 2𝛑R = 2^zoomlevel * 256, 即地球周长除以图片的长度获得分辨率
     * @param zoomLevel
     * @returns
     */
    resolution(zoomLevel: number) {
        return this.initialResolution / Math.pow(2, zoomLevel);
    }

    /**
     *  经纬度转换世界坐标
     * @param lng 经度
     * @param lat 纬度
     * @returns mecator投影转换后的世界坐标
     */
    lngLatToMeters(lng: number, lat: number) {
        let mx = (lng * this.originShift) / 180.0;
        let my =
            Math.log(Math.tan(((90 + lat) * Math.PI) / 360.0)) /
            (Math.PI / 180.0);
        my = (my * this.originShift) / 180.0;
        return {
            mx,
            my,
        };
    }

    /**
     * 世界坐标转换经纬度
     * @param mx
     * @param my
     * @returns
     */
    metersToLngLat(mx: number, my: number) {
        let lng = (mx / this.originShift) * 180.0;
        let lat = (my / this.originShift) * 180.0;

        lat =
            (180 / Math.PI) *
            (2 * Math.atan(Math.exp((lat * Math.PI) / 180.0)) - Math.PI / 2.0);

        return {
            lng,
            lat,
        };
    }

    /**
     * 图片的像素坐标转换世界坐标
     * @param px
     * @param py
     * @param zoomLevel
     * @returns
     */
    pixelsToMeters(px: number, py: number, zoomLevel: number) {
        let res = this.resolution(zoomLevel);
        let mx = px * res - this.originShift;
        let my = py * res - this.originShift;
        return {
            mx,
            my,
        };
    }

    /**
     *  世界坐标转换像素坐标
     * @param mx
     * @param my
     * @param zoomLevel
     * @returns
     */
    metersToPixels(mx: number, my: number, zoomLevel: number) {
        let res = this.resolution(zoomLevel);
        let px = (mx + this.originShift) / res;
        let py = (my + this.originShift) / res;
        return { px, py };
    }

    /**
     *  像素坐标转换瓦片索引
     * @param px
     * @param py
     * @returns
     */
    pixelsToTile(px: number, py: number) {
        let tx = parseInt(
            `${Math.ceil(px / parseFloat(`${this.tileSize}`)) - 1}`,
        );
        let ty = parseInt(
            `${Math.ceil(py / parseFloat(`${this.tileSize}`)) - 1}`,
        );
        return { tx, ty };
    }

    /**
     * 像素坐标y轴翻转
     * @param px
     * @param py
     * @param zoomLevel
     * @returns
     */
    pixelsToRaster(px: number, py: number, zoomLevel: number) {
        let mapSize = this.tileSize * Math.pow(2, zoomLevel);
        py = mapSize - py;
        return { px, py };
    }

    /**
     * 世界坐标转换瓦片索引
     * @param mx
     * @param my
     * @param zoomLevel
     * @returns
     */
    metersToTile(mx: number, my: number, zoomLevel: number) {
        let { px, py } = this.metersToPixels(mx, my, zoomLevel);
        let { tx, ty } = this.pixelsToTile(px, py);
        let maxTileIndex = Math.pow(2, zoomLevel) - 1;
        tx = tx < 0 ? 0 : tx;
        tx = tx > maxTileIndex ? maxTileIndex : tx;
        ty = ty < 0 ? 0 : ty;
        ty = ty > maxTileIndex ? maxTileIndex : ty;

        return {
            tx,
            ty,
        };
    }

    /**
     *  瓦片索引获取瓦片世界坐标边界
     * @param tx
     * @param ty
     * @param zoomLevel
     * @returns
     */
    tileMeterBounds(tx: number, ty: number, zoomLevel: number) {
        let coord0 = this.pixelsToMeters(
            tx * this.tileSize,
            ty * this.tileSize,
            zoomLevel,
        );
        let coord1 = this.pixelsToMeters(
            (tx + 1) * this.tileSize,
            (ty + 1) * this.tileSize,
            zoomLevel,
        );

        return {
            xMin: coord0.mx,
            yMin: coord0.my,
            xMax: coord1.mx,
            yMax: coord1.my,
        };
    }

    /**
     * 瓦片索引获取经纬度坐标边界
     * @param tx
     * @param ty
     * @param zoomLevel
     * @returns
     */
    tileLngLatBounds(tx: number, ty: number, zoomLevel: number) {
        let bounds = this.tileMeterBounds(tx, ty, zoomLevel);

        let coordMin = this.metersToLngLat(bounds.xMin, bounds.yMin);
        let coordMax = this.metersToLngLat(bounds.xMax, bounds.yMax);

        let lngMin = coordMin.lng;
        let latMin = coordMin.lat;

        let lngMax = coordMax.lng;
        let latMax = coordMax.lat;

        return {
            lngMin,
            latMin,

            lngMax,
            latMax,
        };
    }

    /**
     *  TMS 的 瓦片索引 转为 google 的瓦片索引
     * @param tx
     * @param ty
     * @param zoomLevel
     * @returns
     */
    googleTile(tx: number, ty: number, zoomLevel: number) {
        let googleTx = tx;
        let googleTy = Math.pow(2, zoomLevel) - 1 - ty;

        return {
            tx: googleTx,
            ty: googleTy,
        };
    }

    /**
     * 根据给定分辨率计算当前放缩层级
     * 计算公式为 2𝛑R / 2^0 * 256 (初始化分辨率) = 2𝛑R / 2^z * 256 求解方程获取z的值即为当前放缩层级
     * @param resolution
     * @param minZ
     * @param maxZ
     * @returns
     */
    getZoom(resolution: number, minZ: number, maxZ: number) {
        let zoom = Math.floor(Math.log2(this.initialResolution / resolution));
        zoom = Math.max(minZ, zoom);
        zoom = Math.min(maxZ, zoom);
        return zoom;
    }

    /**
     * 经纬度转换像素坐标
     * @param lon
     * @param lat
     * @param zoomLevel
     * @returns
     */
    lngLatToPixel(lon: number, lat: number, zoomLevel: number) {
        // 根据经纬度计算世界坐标
        let { mx, my } = this.lngLatToMeters(lon, lat);
        // 计算像素坐标
        let { px, py } = this.metersToPixels(mx, my, zoomLevel);
        let pos = this.pixelsToRaster(px, py, zoomLevel);
        return pos;
    }
}
