import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';
import Accessor from './accessor';
import { GLTFAnimationSampler } from './gltf2.types';

export default class AnimationSampler {
    private _input: Accessor;
    interpolation: string;
    private _output: Accessor;
    keyframeTimeStamp:
        | Int8Array
        | Uint8Array
        | Int16Array
        | Uint16Array
        | Uint32Array
        | Float32Array;
    keyframeOutputValue:
        | vec2[]
        | vec3[]
        | vec4[]
        | mat2[]
        | mat3[]
        | mat4[]
        | undefined;
    currentTimeStampIndex: number;
    startTime: number;
    endTime: number;
    animationDuration: number;

    constructor(
        animationSamplerData: GLTFAnimationSampler,
        _accessors: Accessor[],
    ) {
        this._input = _accessors?.[animationSamplerData.input];

        this.interpolation =
            animationSamplerData.interpolation === undefined
                ? 'LINEAR'
                : animationSamplerData.interpolation;

        this._output = _accessors?.[animationSamplerData.output];

        this.keyframeTimeStamp = this._input.data!;

        this.outputToGlMatrix(this._output.type);

        this.currentTimeStampIndex = 0;

        this.startTime = this.keyframeTimeStamp[0];

        this.endTime =
            this.keyframeTimeStamp[this.keyframeTimeStamp.length - 1];

        this.animationDuration = this.endTime - this.startTime;
    }

    outputToGlMatrix(
        type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4',
    ) {
        switch (type) {
            case 'SCALAR':
                break;
            case 'VEC2': {
                let tempData = this._output.data!;
                let tempOutData: vec2[] = [];
                for (let i = 0; i < tempData.length; i += 2) {
                    tempOutData.push(
                        vec2.fromValues(tempData[i], tempData[i + 1]),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            case 'VEC3': {
                let tempData = this._output.data!;
                let tempOutData: vec3[] = [];
                for (let i = 0; i < tempData.length; i += 3) {
                    tempOutData.push(
                        vec3.fromValues(
                            tempData[i],
                            tempData[i + 1],
                            tempData[i + 2],
                        ),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            case 'VEC4': {
                let tempData = this._output.data!;
                let tempOutData: vec4[] = [];
                for (let i = 0; i < tempData.length; i += 4) {
                    tempOutData.push(
                        vec4.fromValues(
                            tempData[i],
                            tempData[i + 1],
                            tempData[i + 2],
                            tempData[i + 3],
                        ),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            case 'MAT2': {
                let tempData = this._output.data!;
                let tempOutData: mat2[] = [];
                for (let i = 0; i < tempData.length; i += 4) {
                    tempOutData.push(
                        mat2.fromValues(
                            tempData[i],
                            tempData[i + 1],
                            tempData[i + 2],
                            tempData[i + 3],
                        ),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            case 'MAT3': {
                let tempData = this._output.data!;
                let tempOutData: mat3[] = [];
                for (let i = 0; i < tempData.length; i += 9) {
                    tempOutData.push(
                        mat3.fromValues(
                            tempData[i],
                            tempData[i + 1],
                            tempData[i + 2],
                            tempData[i + 3],
                            tempData[i + 4],
                            tempData[i + 5],
                            tempData[i + 6],
                            tempData[i + 7],
                            tempData[i + 8],
                        ),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            case 'MAT4': {
                let tempData = this._output.data!;
                let tempOutData: mat4[] = [];
                for (let i = 0; i < tempData.length; i += 16) {
                    tempOutData.push(
                        mat4.fromValues(
                            tempData[i],
                            tempData[i + 1],
                            tempData[i + 2],
                            tempData[i + 3],
                            tempData[i + 4],
                            tempData[i + 5],
                            tempData[i + 6],
                            tempData[i + 7],
                            tempData[i + 8],
                            tempData[i + 9],
                            tempData[i + 10],
                            tempData[i + 11],
                            tempData[i + 12],
                            tempData[i + 13],
                            tempData[i + 14],
                            tempData[i + 15],
                        ),
                    );
                }
                this.keyframeOutputValue = tempOutData;
                break;
            }
            default:
                break;
        }
    }
}
