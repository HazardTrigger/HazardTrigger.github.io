import Accessor from './accessor';
import AnimationSampler from './animaionSampler';
import AnimationChannel from './animationChannel';
import {
    GLTFAnimation,
    GLTFAnimationChannel,
    GLTFAnimationSampler,
} from './gltf2.types';
import Joint from './joint';
import Node from './node';
import Skin from './skin';

export default class Animation {
    channels: { [key: string]: AnimationChannel[] } = {};
    name: string;
    duration: number;
    rootNode: Node;
    joints: Joint[];
    ticksPerSecond: number = 10; // 每秒多少帧

    constructor(
        animationData: GLTFAnimation,
        _accessors: Accessor[],
        _nodes: Node[],
        skin: Skin,
    ) {
        // sampler决定动画的输入时间和输出值以及动画插值方式
        let _samplers = animationData.samplers.map(
            (sampler: GLTFAnimationSampler) =>
                new AnimationSampler(sampler, _accessors),
        );

        // channel包含一个骨骼的平移旋转缩放三种动画
        this.channels = this._groupBy(
            animationData.channels.map(
                (channel: GLTFAnimationChannel) =>
                    new AnimationChannel(channel, _samplers, _nodes),
            ),
            'jointName',
        );

        this.name = animationData.name === undefined ? '' : animationData.name;

        this.duration = _samplers[0].animationDuration; // 动画持续时间

        this.rootNode = skin.skeleton;

        this.joints = skin.joints.map((joint, i) => {
            return new Joint(
                joint.name,
                i,
                this.channels[joint.name],
                skin.offsets[i],
            );
        });
    }

    findBone(name: string) {
        return this.joints.filter((joint) => {
            return joint.getJointName() === name;
        })[0];
    }

    getTicksPerSecond() {
        return this.ticksPerSecond;
    }

    getDuration() {
        return this.duration;
    }

    getRootNode() {
        return this.rootNode;
    }

    _groupBy(xs: any[], key: string) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    }
}
