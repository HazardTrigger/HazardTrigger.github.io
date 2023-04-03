import { PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const init = (canvas: HTMLCanvasElement) => {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let camera = new PerspectiveCamera(45, width / height, 1, 30000);
    camera.position.set(
        7.11323783355963,
        -2635.0427926407483,
        525.8316106888058,
    );
    camera.lookAt(0, 0, 0);

    let renderer = new WebGLRenderer({
        antialias: true,
        canvas: canvas,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x001111, 1.0);

    let controls = new OrbitControls(camera, renderer.domElement);
    // 相机控件与.lookAt()无效( .target属性 )
    // controls.target.set(x, y, 0);
    // controls.update(); //update()函数内会执行camera.lookAt(controls.targe)

    window.onresize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        /**
         *  渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
         *  但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
         *  如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
         */
        camera.updateProjectionMatrix();
    };

    return { renderer, camera };
};
