import { mat4 } from 'gl-matrix';
import Animation from './animation';
import Node from './node';

export default class Animator {
    currentTime: number;
    currenAnimation: Animation;
    finalBoneMatrices: mat4[] = [];
    deltaTime: number = 0;

    constructor(animation: Animation) {
        this.currentTime = 0.0;

        this.currenAnimation = animation;

        for (let i = 0; i < 100; ++i) {
            this.finalBoneMatrices.push(mat4.create());
        }
    }

    getFinalBoneMatrices() {
        return this.finalBoneMatrices;
    }

    /**
     * 从骨架根节点开始遍历每个子骨头
     * 计算每个骨头的到根节点的世界矩阵（用于将skin上的顶点转换到世界坐标）
     * 世界矩阵乘以inverse bind matrix得到顶点变换到世界坐标系的最终变换矩阵
     * @param node
     * @param parentTransform
     */
    calculateBoneTransform(node: Node, parentTransform: mat4) {
        let nodeName = node.name;
        let nodeTransform = node.localMatrix;

        let bone = this.currenAnimation.findBone(nodeName);

        if (bone) {
            bone.update(this.currentTime);
            nodeTransform = bone.getLocalTransform();
        }

        let globalTransform = mat4.multiply(
            mat4.create(),
            parentTransform,
            nodeTransform,
        );

        if (bone) {
            this.finalBoneMatrices[bone.id] = mat4.multiply(
                mat4.create(),
                globalTransform,
                bone.offset, // inverse bind matrix
            );
        }

        node.children.forEach((child) => {
            this.calculateBoneTransform(child, globalTransform);
        });
    }

    updateAnimation(dt: number) {
        this.deltaTime = dt;
        if (this.currenAnimation) {
            // 根据设定的动画帧率和帧间隔时间获取当前动画执行的进度
            this.currentTime += this.currenAnimation.getTicksPerSecond() * dt;
            // 当进度100%时取模动画间隔时间重置动画
            this.currentTime =
                this.currentTime % this.currenAnimation.getDuration();

            this.calculateBoneTransform(
                this.currenAnimation.getRootNode(),
                mat4.create(),
            );
        }
    }

    playAnimation(animation: Animation) {
        this.currentTime = 0.0;

        this.currenAnimation = animation;
    }
}
