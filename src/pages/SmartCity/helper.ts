import { AxesHelper, Scene } from 'three';

export const drawAxesHelper = (axisLen: number, scene: Scene) => {
    let helper = new AxesHelper(axisLen);
    scene.add(helper);
};
