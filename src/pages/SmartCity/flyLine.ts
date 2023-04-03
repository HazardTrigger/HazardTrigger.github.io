import * as THREE from 'three';
import output_fragment from './shader/flyline.frag';

export const createFlyLine = (data: THREE.Vector3[]) => {
    let model = new THREE.Group();

    // 轨道线部分
    let geometry = new THREE.BufferGeometry();
    let curve = new THREE.CatmullRomCurve3(data);
    let points = curve.getSpacedPoints(100); //分段数100，返回101个顶点
    geometry.setFromPoints(points);
    let material = new THREE.LineBasicMaterial({
        color: 0xffffff, //轨迹颜色
        linewidth: 50,
    });
    //线条模型对象
    let line = new THREE.Line(geometry, material);
    model.add(line);

    // 飞线部分
    let index = 20; //取点索引位置
    let num = 15; //从曲线上获取点数量
    let points2 = points.slice(index, index + num); //从曲线上获取一段
    let curve2 = new THREE.CatmullRomCurve3(points2);
    let newPoints2 = curve2.getSpacedPoints(100); //获取更多的点数
    let geometry2 = new THREE.BufferGeometry();
    geometry2.setFromPoints(newPoints2);
    let percentArr = newPoints2.map((p, i) => {
        return i / newPoints2.length;
    });
    let percentAttribute = new THREE.Float32BufferAttribute(percentArr, 1);
    geometry2.setAttribute('percent', percentAttribute);

    // 批量计算所有顶点颜色数据
    let colorArr: number[] = [];
    for (let i = 0; i < newPoints2.length; i++) {
        let color1 = new THREE.Color(0x006666); //轨迹线颜色 青色
        let color2 = new THREE.Color(0xffff00); //黄色
        let color = color1.lerp(color2, i / newPoints2.length);
        colorArr.push(color.r, color.g, color.b);
    }
    geometry2.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colorArr, 3),
    );

    // 点模型渲染几何体每个顶点
    let PointsMaterial = new THREE.PointsMaterial({
        size: 100, //点大小
        vertexColors: true, //使用顶点颜色渲染
        transparent: true, //开启透明计算
        depthTest: false,
    });

    let flyPoints = new THREE.Points(geometry2, PointsMaterial);
    model.add(flyPoints);
    PointsMaterial.onBeforeCompile = function (shader) {
        // 顶点着色器中声明一个attribute变量:百分比
        shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            [
                'attribute float percent;', //顶点大小百分比变量，控制点渲染大小
                'void main() {',
            ].join('\n'), // .join()把数组元素合成字符串
        );
        // 调整点渲染大小计算方式
        shader.vertexShader = shader.vertexShader.replace(
            'gl_PointSize = size;',
            ['gl_PointSize = percent * size;'].join('\n'), // .join()把数组元素合成字符串
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <output_fragment>',
            output_fragment,
        );
    };

    // 飞线动画
    let indexMax = points.length - num; //飞线取点索引范围
    const animation = () => {
        if (index > indexMax) index = 0;
        index += 1;
        points2 = points.slice(index, index + num); //从曲线上获取一段
        let curve = new THREE.CatmullRomCurve3(points2);
        let newPoints2 = curve.getSpacedPoints(100); //获取更多的点数
        geometry2.setFromPoints(newPoints2);

        requestAnimationFrame(animation);
    };
    animation();

    return model;
};
