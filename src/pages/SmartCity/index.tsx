import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { init } from './init';
import {
    BufferAttribute,
    Color,
    Float32BufferAttribute,
    Fog,
    Group,
    Material,
    Mesh,
    MeshLambertMaterial,
    Scene,
    ShaderMaterial,
    TextureLoader,
} from 'three';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { addLight } from './light';
import { drawAxesHelper } from './helper';
import gradientVert from './shader/gradient.vert';
import gradientFrag from './shader/gradient.frag';
import labelRenderer, { createPOI } from './POI';
import './index.less';
import { addDrone } from './drone';
import { createFlyLine } from './flyLine';

let textureLoadedr = new TextureLoader();
let haloTexture = textureLoadedr.load('./images/标注光圈.png');
let gradientTexture = textureLoadedr.load('./images/渐变.png');
var flowTexture = textureLoadedr.load('./images/流动.png');

const SmartCity: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    let frameId: any = null;

    const addPOI = (gltf: GLTF, model: Group) => {
        // 如果想代码方便，一般最好让美术把模型的局部坐标原点设置在你想标注的位置
        let arr = ['东方明珠', '上海中心大厦', '金茂大厦', '环球金融中心'];
        for (let i = 0; i < arr.length; i++) {
            let obj = gltf.scene.getObjectByName(arr[i]) as Mesh;
            let messageTag = createPOI(arr[i]); //创建标签对象
            let pos = new THREE.Vector3();
            obj.getWorldPosition(pos);
            messageTag.position.copy(pos);
            model.add(messageTag);
            messageTag.position.z += 50;
            //美术给的需要标注的模型的局部坐标系坐标原点在底部，如果你想标注顶部，就需要在世界坐标基础上考虑模型高度
            if (arr[i] === '东方明珠') messageTag.position.z += 450;
        }
    };

    const addHalo = (model: Group) => {
        let geometry = new THREE.PlaneGeometry(30, 30); //默认在XOY平面上
        let material = new THREE.MeshBasicMaterial({
            color: 0xffffff, //设置光圈颜色
            map: haloTexture,
            transparent: true,
            depthWrite: false,
        });
        let mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
        mesh.position.set(0, 0, 1);
        model.add(mesh); //网格模型添加到model中

        // 波动动画
        let S = 100; //波动范围倍数设置
        let _s = 1.0;
        const waveAnimation = () => {
            _s += 0.1;
            mesh.scale.set(_s, _s, _s);
            if (_s <= S * 0.2) {
                material.opacity = (_s - 1) / (S * 0.2 - 1); //保证透明度在0~1之间变化
            } else if (_s > S * 0.2 && _s <= S) {
                material.opacity = 1 - (_s - S * 0.2) / (S - S * 0.2); //保证透明度在0~1之间变化
            } else {
                _s = 1.0;
            }
            requestAnimationFrame(waveAnimation);
        };
        waveAnimation();
    };

    const addCylinder = (pos: any, model: Group) => {
        // 圆柱几何体，参数5设置不生成圆柱的两个底面
        let geometry = new THREE.CylinderGeometry(
            100,
            100,
            329.95220947265625 * 2,
            40,
            1,
            true,
        );
        let material = new THREE.MeshLambertMaterial({
            color: 0xffff44, //颜色
            map: gradientTexture,
            side: THREE.DoubleSide, //两面可见
            transparent: true, //需要开启透明度计算，否则着色器透明度设置无效
            // opacity: 0.5, //整体改变透明度
            depthTest: true,
        }); //材质对象Material
        let mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh

        mesh.position.set(
            pos.position.x - -107.4942626953125,
            pos.position.y,
            pos.position.z - 77.569091796875,
        );
        model.add(mesh);

        let mesh2 = mesh.clone();
        flowTexture.wrapS = THREE.RepeatWrapping;
        flowTexture.wrapT = THREE.RepeatWrapping;
        flowTexture.repeat.x = 2;
        mesh2.material = mesh.material.clone();
        mesh2.material.map = flowTexture;
        mesh2.material.depthTest = true;
        model.add(mesh2);

        mesh2.scale.set(1.01, 1.01, 1.01);
    };

    const main = async () => {
        const { renderer, camera } = init(canvasRef.current!);

        let scene = new Scene();
        /**
         * 设置雾化效果，雾的颜色和背景颜色相近，这样远处三维场景和背景颜色融为一体
         * 结合相机参数设置Fog的参数2和参数3
         */
        scene.fog = new Fog(0x001111, 5, 5000);
        let model = new Group();

        let gltfLoader = new GLTFLoader();
        let gltf = await gltfLoader.loadAsync('./gltf/上海外滩.glb');
        // console.log(gltf);

        gltf.scene.rotateX(Math.PI / 2);

        let ground = gltf.scene.getObjectByName('地面') as Mesh;
        ground.material = new MeshLambertMaterial({
            color: 0x001111,
            transparent: true,
            opacity: 0,
        });

        gltf.scene.getObjectByName('楼房')?.traverse((obj) => {
            if (obj.type === 'Mesh') {
                let geometry = (obj as Mesh).geometry!;
                let material = new ShaderMaterial({
                    glslVersion: '300 es',
                    vertexShader: gradientVert,
                    fragmentShader: gradientFrag,
                    uniforms: {
                        color1: { value: new Color(0x001111) },
                        color2: { value: new Color(0x00ffff) },
                        bboxMin: {
                            value: geometry.boundingBox!.min,
                        },
                        bboxMax: {
                            value: geometry.boundingBox!.max,
                        },
                        time: { value: 0 },
                    },
                    // depthTest: true,
                    transparent: true,
                    opacity: 0.5,
                });

                (obj as Mesh).material = material;

                // 设置模型边线
                let edges = new THREE.EdgesGeometry((obj as Mesh).geometry, 1);
                let edgesMaterial = new THREE.LineBasicMaterial({
                    color: 0x006666,
                });
                let line = new THREE.LineSegments(edges, edgesMaterial);
                (obj as Mesh).add(line);
            }
        });

        let zhongxindasha = gltf.scene.getObjectByName('上海中心大厦') as Mesh;
        // console.log(zhongxindasha);
        addCylinder(zhongxindasha, gltf.scene);

        addPOI(gltf, model);

        addHalo(model);

        const { flyGroup, mixer } = addDrone();
        flyGroup.position.set(0, 0, 800);
        flyGroup.rotateX(Math.PI / 2);
        model.add(flyGroup);

        const flyLine = createFlyLine([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 800, 0),
            new THREE.Vector3(-1000, 0, 1000),
        ]);
        flyLine.rotateX(Math.PI / 2);
        model.add(flyLine);

        const flyLin2 = createFlyLine([
            new THREE.Vector3(100, 0, -1100),
            new THREE.Vector3(0, 600, 0),
            new THREE.Vector3(1000, 0, 1000),
        ]);
        flyLin2.rotateX(Math.PI / 2);
        model.add(flyLin2);

        const flyLin3 = createFlyLine([
            new THREE.Vector3(-1000, 0, -1100),
            new THREE.Vector3(0, 300, 0),
            new THREE.Vector3(1000, 0, 0),
        ]);
        flyLin3.rotateX(Math.PI / 2);
        model.add(flyLin3);

        model.add(gltf.scene);
        scene.add(model);

        addLight(scene);

        // drawAxesHelper(550, scene);

        let clock = new THREE.Clock();
        labelRenderer.domElement.style.display = 'block';

        const render = () => {
            let deltaTime = clock.getDelta();
            if (mixer) {
                (mixer as THREE.AnimationMixer).update(deltaTime);
            }
            flowTexture.offset.y -= 0.002;
            labelRenderer.render(scene, camera);
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        };

        frameId = requestAnimationFrame(render);
    };

    useEffect(() => {
        main();
        return () => {
            cancelAnimationFrame(frameId);
            labelRenderer.domElement.style.display = 'none';
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
        ></canvas>
    );
};

export default SmartCity;
