import MYGLTFLoader from '@/modules/GLTF2Loader/GLTFLoader';
import ShaderProgram from '@/modules/ShaderProgram/shaderProgram';
import { Radio, Checkbox, Select, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import vs from './shader/animation.vert';
import fs from './shader/animation.frag';
import { glMatrix, mat4, vec3 } from 'gl-matrix';
import Animator from '@/modules/GLTF2Loader/animator';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './index.less';

let translateX = 0.0;
let translateY = 1.0;
let translateZ = 400.5;
let rotateX = 90.0;
let rotateY = 0.0;
let rotateZ = 0.0;
let animator: Animator;
let loader: MYGLTFLoader;
let wireframe: boolean = false;
let camera: THREE.PerspectiveCamera;
// let frameId: number = -1;

const GLTF2Engine: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [path, setPath] = useState('/data/separate/DeerMonsterDance.gltf');
    const [frameId, setFrameId] = useState(-1);

    const main = async () => {
        const canvas = canvasRef.current!;
        const gl = canvas?.getContext('webgl2')!;
        loader = new MYGLTFLoader(gl);
        let shaderProgram: ShaderProgram;
        let deltaTime = 0.0;
        let lastFrameTimeStamp = 0.0;

        camera = new THREE.PerspectiveCamera(
            60,
            gl.canvas.width / gl.canvas.height,
            0.1,
            6000,
        );
        if (path === '/data/separate/DeerMonsterDance.gltf') {
            camera.position.set(0, 0, 300);
        } else {
            camera.position.set(0, 0, 10);
        }
        // camera.position.set(0, 0, 300);
        camera.lookAt(0, 0, 0);
        let controls = new OrbitControls(camera, canvas);
        // let controls = new MapControls(camera, canvas);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;

        // await loader.loadGLTF('/data/separate/animateCube.gltf');
        await loader.loadGLTF(path);

        shaderProgram = new ShaderProgram(gl, vs, fs);

        animator = new Animator(loader.gltf?.animations[0]!);

        window.onresize = () => {
            gl.canvas.width = window.innerWidth;
            gl.canvas.height = window.innerHeight;

            camera.aspect = window.innerWidth / window.innerHeight;
            /**
             *  渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
             *  但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
             *  如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
             */
            camera.updateProjectionMatrix();
        };

        const renderLoop = (currentTimeStamp: number) => {
            deltaTime = currentTimeStamp - lastFrameTimeStamp;
            lastFrameTimeStamp = currentTimeStamp;

            controls.update();

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            animator.updateAnimation(deltaTime * 0.00009);

            shaderProgram.use(gl);

            shaderProgram.setMat4(
                gl,
                'projection',
                Float32Array.from(camera.projectionMatrix.elements),
            );

            shaderProgram.setMat4(
                gl,
                'view',
                Float32Array.from(camera.matrixWorldInverse.elements),
            );

            let model = mat4.create();
            if (path === '/data/separate/DeerMonsterDance.gltf') {
                mat4.translate(model, model, vec3.fromValues(0, -100, 0));
                mat4.rotate(
                    model,
                    model,
                    glMatrix.toRadian(rotateX),
                    vec3.fromValues(1.0, 0.0, 0.0),
                );
            } else {
                mat4.translate(model, model, vec3.fromValues(0, -4, 0));
            }

            shaderProgram.setMat4(gl, 'model', model);

            let transforms = animator.getFinalBoneMatrices();
            transforms.forEach((finalMatrix, i) => {
                shaderProgram.setMat4(
                    gl,
                    `finalBonesMatrices[${i}]`,
                    finalMatrix,
                );
            });

            loader.gltf?._meshes.forEach((mesh) => {
                mesh.draw(shaderProgram, wireframe);
            });

            requestAnimationFrame(renderLoop);
        };

        setFrameId(requestAnimationFrame(renderLoop));
    };

    useEffect(() => {
        main();
    }, [path]);

    return (
        <>
            <Space
                className="panel"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 300,
                }}
                direction="vertical"
            >
                <Select
                    defaultValue="/data/separate/DeerMonsterDance.gltf"
                    style={{ width: 120 }}
                    onChange={(value: string) => {
                        setPath(value);
                    }}
                    size="small"
                    options={[
                        {
                            value: '/data/separate/animateCube.gltf',
                            label: 'Cube',
                        },
                        {
                            value: '/data/separate/DeerMonsterDance.gltf',
                            label: 'DeerMonsterDance',
                        },
                    ]}
                />
                <Checkbox
                    style={{
                        color: '#fff',
                    }}
                    defaultChecked={wireframe}
                    onChange={({ target: { checked } }) => {
                        wireframe = checked;
                    }}
                >
                    wireframe
                </Checkbox>
                {path === '/data/separate/animateCube.gltf' && (
                    <Radio.Group
                        onChange={(e) => {
                            animator.playAnimation(
                                loader.gltf?.animations[e.target.value]!,
                            );
                        }}
                        defaultValue={0}
                    >
                        <Radio
                            style={{
                                color: '#fff',
                            }}
                            value={0}
                        >
                            xRotation
                        </Radio>
                        <Radio
                            style={{
                                color: '#fff',
                            }}
                            value={1}
                        >
                            yRotation
                        </Radio>
                        <Radio
                            style={{
                                color: '#fff',
                            }}
                            value={2}
                        >
                            zRotation
                        </Radio>
                    </Radio.Group>
                )}
            </Space>
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
            ></canvas>
        </>
    );
};

export default GLTF2Engine;
