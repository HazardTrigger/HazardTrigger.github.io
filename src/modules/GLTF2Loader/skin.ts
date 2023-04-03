import { mat4 } from 'gl-matrix';
import Accessor from './accessor';
import { GLTFIndex, GLTFSkin } from './gltf2.types';
import Node from './node';

export default class Skin {
    offsets: mat4[] = [];
    private _inverseBindMatrices: Accessor | null;
    skeleton: Node;
    name: string;
    joints: Node[];

    constructor(skinData: GLTFSkin, _accessors: Accessor[], _nodes: Node[]) {
        this._inverseBindMatrices =
            skinData.inverseBindMatrices === undefined
                ? null
                : _accessors?.[skinData.inverseBindMatrices];

        if (this._inverseBindMatrices) {
            let _IBMBufferDara = this._inverseBindMatrices.data;
            if (_IBMBufferDara) {
                for (let i = 0; i < _IBMBufferDara?.length; i += 16) {
                    this.offsets.push(
                        mat4.fromValues(
                            _IBMBufferDara[i],
                            _IBMBufferDara[i + 1],
                            _IBMBufferDara[i + 2],
                            _IBMBufferDara[i + 3],
                            _IBMBufferDara[i + 4],
                            _IBMBufferDara[i + 5],
                            _IBMBufferDara[i + 6],
                            _IBMBufferDara[i + 7],
                            _IBMBufferDara[i + 8],
                            _IBMBufferDara[i + 9],
                            _IBMBufferDara[i + 10],
                            _IBMBufferDara[i + 11],
                            _IBMBufferDara[i + 12],
                            _IBMBufferDara[i + 13],
                            _IBMBufferDara[i + 14],
                            _IBMBufferDara[i + 15],
                        ),
                    );
                }
            }
        }

        this.skeleton =
            skinData.skeleton === undefined
                ? _nodes.filter(
                      (node) =>
                          node.parent === null && node.children.length > 0,
                  )[0]
                : _nodes?.[skinData.skeleton];

        this.joints = skinData.joints.map((index: GLTFIndex) => {
            let tempNode = _nodes?.[index];
            tempNode.isBone = true;
            return tempNode;
        });

        this.name = skinData.name === undefined ? '' : skinData.name;
    }
}
