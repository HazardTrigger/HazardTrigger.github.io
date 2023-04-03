import { GLTFIndex, GLTFScene } from './gltf2.types';
import Node from './node';

export default class Scene {
    nodes: Node[] = [];
    name: string;

    constructor(sceneData: GLTFScene, _nodes: Node[]) {
        if (sceneData.nodes !== undefined) {
            this.nodes = sceneData.nodes.map(
                (nodeIndex: GLTFIndex) => _nodes?.[nodeIndex],
            );
        }

        this.name = sceneData.name === undefined ? '' : sceneData.name;
    }
}
