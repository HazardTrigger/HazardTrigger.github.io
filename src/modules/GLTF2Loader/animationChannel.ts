import AnimationSampler from './animaionSampler';
import { GLTFAnimationChannel } from './gltf2.types';
import Node from './node';

export default class AnimationChannel {
    sampler: AnimationSampler;
    target: Node;
    path: 'translation' | 'rotation' | 'scale' | 'weights';
    channelName: string;
    jointName: string;

    constructor(
        animationChannelData: GLTFAnimationChannel,
        _samplers: AnimationSampler[],
        _nodes: Node[],
    ) {
        this.sampler = _samplers[animationChannelData.sampler];

        this.target = _nodes[animationChannelData.target.node!];

        this.path = animationChannelData.target.path;

        this.channelName = `${this.target.name}.${this.path}`;

        this.jointName = this.target.name !== undefined ? this.target.name : '';
    }
}
