import { AmbientLight, DirectionalLight, Scene } from 'three';

export const addLight = (scene: Scene) => {
    let directionalLight = new DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(400, 200, 300);
    scene.add(directionalLight);

    let directionalLight2 = new DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-300, 600, -300);
    scene.add(directionalLight2);

    let ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
};
