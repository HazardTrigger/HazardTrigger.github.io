import { vec4 } from 'gl-matrix';
import {
    Extension,
    GLTFMaterial,
    GLTFMaterialNormalTextureInfo,
    GLTFMaterialOcclusionTextureInfo,
    GLTFMaterialPBRMetallicRoughness,
    GLTFTextureInfo,
} from './gltf2.types';
import Texture from './texture';

export default class Material {
    name: string;
    // pbrMetallicRoughness: any;
    normalTexture: GLTFMaterialNormalTextureInfo | null;
    occlusionTexture: GLTFMaterialOcclusionTextureInfo | null;
    emissiveFactor: [number, number, number];
    alphaMode: 'OPAQUE' | 'MASK' | 'BLEND'; // default OPAQUE
    alphaCutOff: number;
    doubleSided: boolean;
    pbrMetallicRoughness:
        | {
              baseColorFactor: number[];
              baseColorTexture: undefined;
              metallicFactor: number;
              roughnessFactor: number;
              metallicRoughnessTexture: undefined;
          }
        | {
              baseColorTexture: { texture: Texture; texCoord: string };
              baseColorFactor?:
                  | [
                        number,
                        number,
                        number,
                        number, // pbrMetallicRoughness: any;
                    ]
                  | undefined;
              metallicFactor?: number | undefined;
              roughnessFactor?: number | undefined;
              metallicRoughnessTexture?: GLTFTextureInfo | undefined;
              extension?: Extension | undefined;
              extras?: any;
          };

    constructor(materialData: GLTFMaterial, _textures: Texture[]) {
        this.name = materialData.name === undefined ? '' : materialData.name;

        this.pbrMetallicRoughness =
            materialData.pbrMetallicRoughness === undefined
                ? {
                      baseColorFactor: [1, 1, 1, 1],
                      baseColorTexture: undefined,
                      metallicFactor: 1,
                      roughnessFactor: 1,
                      metallicRoughnessTexture: undefined,
                  }
                : {
                      ...materialData.pbrMetallicRoughness,
                      baseColorTexture: {
                          texture:
                              _textures[
                                  materialData.pbrMetallicRoughness
                                      .baseColorTexture?.index!
                              ],
                          texCoord: `TEXCOORD_${materialData.pbrMetallicRoughness.baseColorTexture?.texCoord}`,
                      },
                  };

        this.normalTexture =
            materialData.normalTexture === undefined
                ? null
                : materialData.normalTexture;

        this.occlusionTexture =
            materialData.occlusionTexture === undefined
                ? null
                : materialData.occlusionTexture;

        this.emissiveFactor =
            materialData.emissiveFactor === undefined
                ? [0, 0, 0]
                : materialData.emissiveFactor;

        this.alphaMode =
            materialData.alphaMode === undefined
                ? 'OPAQUE'
                : materialData.alphaMode;

        this.alphaCutOff =
            materialData.alphaCutOff === undefined
                ? 0.5
                : materialData.alphaCutOff;

        this.doubleSided =
            materialData.doubleSided === undefined
                ? false
                : materialData.doubleSided;
    }
}
