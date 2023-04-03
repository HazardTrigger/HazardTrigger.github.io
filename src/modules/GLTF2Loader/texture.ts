import GLTF from './GLTF';
import { GLTFTexture } from './gltf2.types';
import Sampler from './sampler';

export default class Texture {
    sampler: Sampler | null;
    source: ImageBitmap | null;
    name: string;

    constructor(
        textureData: GLTFTexture,
        _samplers: Sampler[],
        _images: ImageBitmap[],
    ) {
        this.sampler =
            textureData.sampler === undefined
                ? null
                : _samplers?.[textureData.sampler];

        this.source =
            textureData.source === undefined
                ? null
                : _images?.[textureData.source];

        this.name = textureData.name === undefined ? '' : textureData.name;
    }
}
