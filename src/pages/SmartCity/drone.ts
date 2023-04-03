import { AnimationMixer, Group, Mesh, MeshLambertMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import lightVS from './shader/lightSphere.vert';
import lightFS from './shader/lightSphere.frag';

let loader = new GLTFLoader();
let texLoader = new THREE.TextureLoader();

export const createLightSphere = (size: number) => {
    // 创建一个球
    let geometry = new THREE.SphereGeometry(size, 30, 30);
    let material = new THREE.ShaderMaterial({
        glslVersion: '300 es',
        vertexShader: lightVS,
        fragmentShader: lightFS,
        transparent: true,
    });

    let mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
    // 波动动画
    // let S = 1.5; //波动范围设置
    // let _s = 1.0;
    // let t = 0;
    // function waveAnimation() {
    //     // _s += 0.01;
    //     t += 0.01;
    //     mesh.position.x = 20 * Math.cos(t);
    //     mesh.position.y = 20 * Math.sin(t);
    //     // mesh.scale.set(_s, _s, _s);
    //     // if (_s > S) _s = 1.0;
    //     requestAnimationFrame(waveAnimation);
    // }
    // waveAnimation();

    mesh.rotateX(Math.PI / 2); //旋转调整姿态
    return mesh;
};

const createSignalMesh = () => {
    let L = 1;
    let geometry = new THREE.PlaneGeometry(L, 0.6 * L);
    geometry.translate(-L / 2, 0, 0);
    geometry.rotateZ(Math.PI / 2);
    let material = new THREE.MeshLambertMaterial({
        map: texLoader.load('./images/信号波.png'),
        color: 0xffffff, //设置颜色
        transparent: true, //允许透明计算
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    let plane = new THREE.Mesh(geometry, material);

    // 波动动画
    let S = 1000; //波动范围倍数设置
    let _s = 1;
    function animation() {
        _s += 10;
        plane.scale.set(_s, _s, _s);
        if (_s <= S * 0.2) {
            material.opacity = (_s - 1) / (S * 0.2 - 1); //保证透明度在0~1之间变化
        } else if (_s > S * 0.2 && _s <= S) {
            material.opacity = 1 - (_s - S * 0.2) / (S - S * 0.2); //保证透明度在0~1之间变化
        } else {
            _s = 1.0;
        }
        requestAnimationFrame(animation);
    }
    animation();

    return plane;
};

export const addDrone = () => {
    let flyGroup = new Group();
    let mixer: AnimationMixer | null = null;

    let LightSphereMesh = createLightSphere(120);
    flyGroup.add(LightSphereMesh);

    let SignalMesh = createSignalMesh();
    flyGroup.add(SignalMesh);

    loader.load('./gltf/fly.glb', (gltf) => {
        let fly = gltf.scene;
        fly.scale.set(4, 4, 4);
        fly.position.x = -28 * 4;
        flyGroup.add(fly);

        fly.traverse((child) => {
            if (child.type === 'Mesh') {
                let material = (child as Mesh).material as any;
                (child as Mesh).material = new MeshLambertMaterial({
                    color: material.color,
                });
            }
        });

        mixer = new AnimationMixer(fly);
        let animationAction = mixer.clipAction(gltf.animations[0]);
        animationAction.timeScale = 1;
        animationAction.play();
    });

    let t = 0;
    const circleAnimation = () => {
        t += 0.01;
        flyGroup.position.x = 1000 * Math.cos(t);
        flyGroup.position.y = 1000 * Math.sin(t);
        requestAnimationFrame(circleAnimation);
    };
    circleAnimation();

    return { flyGroup, mixer };
};
