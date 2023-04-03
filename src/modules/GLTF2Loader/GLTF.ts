import Accessor from './accessor';
import Animation from './animation';
import BufferView from './bufferView';
import Camera from './camera';
import {
    Extension,
    GLTFAccessor,
    GLTFAnimation,
    GLTFAsset,
    glTFBase,
    GLTFBufferView,
    GLTFCamera,
    GLTFIndex,
    GLTFMaterial,
    GLTFMesh,
    GLTFNode,
    GLTFSampler,
    GLTFScene,
    GLTFSkin,
    GLTFTexture,
} from './gltf2.types';
import Material from './material';
import Mesh from './mesh';
import Node from './node';
import Sampler from './sampler';
import Scene from './scene';
import Skin from './skin';
import Texture from './texture';

export default class GLTF {
    asset: GLTFAsset;
    gl: WebGL2RenderingContext;
    _cameras: Camera[] = [];
    _materials: Material[] = [];
    _textures: Texture[] = [];
    _meshes: Mesh[] = [];
    private _nodes: Node[] = [];
    scenes: Scene[] = [];
    scene?: Scene;
    private _skins: Skin[] = [];
    animations: Animation[] = [];
    extensions?: Extension;
    extensionsRequired?: string[];
    extensionsUsed?: string[];
    extras: any;

    constructor(
        gl: WebGL2RenderingContext,
        gltfData: glTFBase,
        bufferData: ArrayBuffer[],
        imageBufferData: ImageBitmap[],
    ) {
        this.asset = gltfData?.asset;
        this.gl = gl;

        if (gltfData.extensions) {
            this.extensions = gltfData.extensions;
        }

        if (gltfData.extensionsRequired) {
            this.extensionsRequired = gltfData.extensionsRequired;
        }

        if (gltfData.extensionsUsed) {
            this.extensionsUsed = gltfData.extensionsUsed;
        }

        if (gltfData.extras) {
            this.extras = gltfData.extras;
        }

        let _bufferViews: BufferView[] = [];
        let _accessors: Accessor[] = [];
        let _buffers = bufferData;
        let _images = imageBufferData;
        let _samplers: Sampler[] = [];

        if (gltfData.bufferViews !== undefined) {
            _bufferViews = gltfData.bufferViews.map(
                (bufferViewData: GLTFBufferView) => {
                    return new BufferView(
                        bufferViewData,
                        _buffers[bufferViewData.buffer],
                    );
                },
            );
        }

        if (gltfData.accessors !== undefined) {
            _accessors = gltfData.accessors.map(
                (accessorData: GLTFAccessor) => {
                    return new Accessor(
                        accessorData,
                        _bufferViews[accessorData.bufferView!],
                        this.gl,
                    );
                },
            );
        }

        if (gltfData.cameras !== undefined) {
            this._cameras = gltfData.cameras.map((cameraData: GLTFCamera) => {
                return new Camera(cameraData);
            });
        }

        if (gltfData.samplers !== undefined) {
            _samplers = gltfData.samplers.map((samplerData: GLTFSampler) => {
                return new Sampler(samplerData);
            });
        }

        if (gltfData.textures !== undefined) {
            this._textures = gltfData.textures.map(
                (textureData: GLTFTexture) => {
                    return new Texture(textureData, _samplers, _images);
                },
            );
        }

        if (gltfData.materials !== undefined) {
            this._materials = gltfData.materials.map(
                (materialData: GLTFMaterial) => {
                    return new Material(materialData, this._textures);
                },
            );
        }

        if (gltfData.meshes !== undefined) {
            this._meshes = gltfData.meshes.map(
                (meshData: GLTFMesh, meshID: GLTFIndex) => {
                    return new Mesh(
                        meshData,
                        meshID,
                        _accessors,
                        this._materials,
                        this.gl,
                    );
                },
            );
        }

        if (gltfData.nodes !== undefined) {
            this._nodes = gltfData.nodes.map(
                (nodeData: GLTFNode, nodeID: GLTFIndex) => {
                    return new Node(
                        nodeData,
                        nodeID,
                        this._meshes,
                        this._cameras,
                    );
                },
            );

            this._nodes.forEach((node: Node) => {
                for (const nodeIndex of node._childrenIndex) {
                    this._nodes[nodeIndex].parent = node;
                    node.children.push(this._nodes[nodeIndex]);
                }
            });

            if (gltfData.scenes !== undefined) {
                this.scenes = gltfData.scenes.map((sceneData: GLTFScene) => {
                    return new Scene(sceneData, this._nodes);
                });

                this.scene =
                    gltfData.scene === undefined
                        ? this.scenes[0]
                        : this.scenes[gltfData.scene];
            }
        }

        if (gltfData.skins !== undefined) {
            this._skins = gltfData.skins.map((skinData: GLTFSkin) => {
                return new Skin(skinData, _accessors, this._nodes);
            });

            this._nodes.forEach((node) => {
                node.skin = this._skins[node._skinIndex!];
            });
        }

        if (gltfData.animations !== undefined) {
            this.animations = gltfData.animations.map(
                (animationData: GLTFAnimation) => {
                    return new Animation(
                        animationData,
                        _accessors,
                        this._nodes,
                        this._skins[0],
                    );
                },
            );
        }
    }
}
