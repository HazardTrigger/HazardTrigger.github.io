import {
    CSS2DObject,
    CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';

// 创建一个CSS2渲染器CSS2DRenderer
let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
// 相对标签原位置位置偏移大小
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.left = '0px';
//设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

export const createPOI = (name: string) => {
    let div = document.createElement('div');
    div.innerHTML = name;
    div.classList.add('poi');
    let label = new CSS2DObject(div);
    div.style.pointerEvents = 'none';
    return label;
};

export default labelRenderer;
