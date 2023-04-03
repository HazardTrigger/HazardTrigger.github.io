import { mat4, quat, vec3 } from 'gl-matrix';
import Camera from './camera';
import { GLTFIndex, GLTFNode } from './gltf2.types';
import Mesh from './mesh';
import Skin from './skin';

export default class Node {
    nodeID: number;
    camera: Camera | null;
    _childrenIndex: number[];
    children: Node[] = [];
    _skinIndex: number | null;

    isSkin: boolean = false;
    isBone: boolean = false;
    translation: vec3;
    rotation: import('gl-matrix').vec4;
    scale: vec3;
    localMatrix: mat4;
    mesh: Mesh | null;
    weights: number[] | null;
    name: string;
    parent: Node | null;
    worldMatrix: mat4;
    skin: Skin | null = null;

    constructor(
        nodeData: GLTFNode,
        nodeID: GLTFIndex,
        _meshes: Mesh[],
        _cameras: Camera[],
    ) {
        this.nodeID = nodeID;

        this.camera =
            nodeData.camera === undefined ? null : _cameras[nodeData.camera];

        this._childrenIndex =
            nodeData.children === undefined ? [] : nodeData.children;

        this._skinIndex = nodeData.skin !== undefined ? nodeData.skin : null;
        this.isSkin = this._skinIndex !== null;

        this.translation =
            nodeData.translation === undefined
                ? vec3.fromValues(0, 0, 0)
                : vec3.fromValues(...nodeData.translation);

        this.rotation =
            nodeData.rotation === undefined
                ? quat.fromValues(0, 0, 0, 1)
                : quat.fromValues(...nodeData.rotation);

        this.scale =
            nodeData.scale === undefined
                ? vec3.fromValues(1, 1, 1)
                : vec3.fromValues(...nodeData.scale);

        this.localMatrix =
            nodeData.matrix === undefined
                ? mat4.create()
                : mat4.fromValues(...nodeData.matrix);

        this.mesh = nodeData.mesh === undefined ? null : _meshes[nodeData.mesh];

        this.weights = nodeData.weights === undefined ? null : nodeData.weights;

        this.name = nodeData.name === undefined ? '' : nodeData.name;

        this.parent = null;

        this.worldMatrix = mat4.clone(this.localMatrix);
    }

    traversePreOrder(
        fun: (thisNode: Node, parentNode: Node | null) => void,
        parent?: Node | null,
    ) {
        if (parent === undefined) {
            parent = null;
        }

        this.children.forEach((node: Node) => {
            node.traversePreOrder(fun, this);
        });
    }

    traversePostOrder(
        fun: (thisNode: Node, parentNode: Node | null) => void,
        parent?: Node | null,
    ) {
        if (parent === undefined) {
            parent = null;
        }

        this.children.forEach((node: Node) => {
            node.traversePreOrder(fun, this);
        });

        fun(this, parent);
    }
}
