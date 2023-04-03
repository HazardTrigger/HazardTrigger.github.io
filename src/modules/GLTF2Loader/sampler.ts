import {
    GLTFSampler,
    GLTFSamplerMagFilter,
    GLTFSamplerMinFilter,
    GLTFSamplerWrapS,
    GLTFSamplerWrapT,
} from './gltf2.types';

export default class Sampler {
    magFilter: GLTFSamplerMagFilter | null;
    minFilter: GLTFSamplerMinFilter | null;
    wrapS: GLTFSamplerWrapS | null;
    wrapT: GLTFSamplerWrapT | null;
    name: string;

    constructor(samplerData: GLTFSampler) {
        this.magFilter =
            samplerData.magFilter === undefined ? null : samplerData.magFilter;

        this.minFilter =
            samplerData.minFilter === undefined ? null : samplerData.minFilter;

        this.wrapS = samplerData.wrapS === undefined ? null : samplerData.wrapS;

        this.wrapT = samplerData.wrapT === undefined ? null : samplerData.wrapT;

        this.name = samplerData.name === undefined ? '' : samplerData.name;
    }
}
