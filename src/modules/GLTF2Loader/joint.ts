import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import AnimationChannel from './animationChannel';

export default class Joint {
    name: string;
    id: number;
    offset: mat4;
    m_NumPositions: number;
    m_NumRotations: number;
    m_NumScalings: number;
    m_Positions: { position: vec3; timeStamp: number }[] = [];
    m_Rotations: { orientation: vec4; timeStamp: number }[] = [];
    m_Scales: { scale: vec3; timeStamp: number }[] = [];
    localMatrix: mat4 = mat4.create();

    constructor(
        name: string,
        id: number,
        channels: AnimationChannel[],
        offset: mat4,
    ) {
        this.name = name;

        this.id = id;

        this.offset = offset;

        this.m_NumPositions = channels[0].sampler.keyframeTimeStamp?.length!;
        for (
            let positionIndex = 0;
            positionIndex < this.m_NumPositions;
            ++positionIndex
        ) {
            this.m_Positions.push({
                position: channels[0].sampler.keyframeOutputValue?.[
                    positionIndex
                ] as vec3,
                timeStamp: channels[0].sampler.keyframeTimeStamp?.[
                    positionIndex
                ] as number,
            });
        }

        this.m_NumRotations = channels[1].sampler.keyframeTimeStamp?.length!;
        for (
            let rotationIndex = 0;
            rotationIndex < this.m_NumRotations;
            ++rotationIndex
        ) {
            this.m_Rotations.push({
                orientation: channels[1].sampler.keyframeOutputValue?.[
                    rotationIndex
                ] as vec4,
                timeStamp: channels[1].sampler.keyframeTimeStamp?.[
                    rotationIndex
                ] as number,
            });
        }

        this.m_NumScalings = channels[2].sampler.keyframeTimeStamp?.length!;
        for (
            let scaleIndex = 0;
            scaleIndex < this.m_NumScalings;
            ++scaleIndex
        ) {
            this.m_Scales.push({
                scale: channels[2].sampler.keyframeOutputValue?.[
                    scaleIndex
                ] as vec3,
                timeStamp: channels[2].sampler.keyframeTimeStamp?.[
                    scaleIndex
                ] as number,
            });
        }
    }

    getJointName() {
        return this.name;
    }

    getJointID() {
        return this.id;
    }

    getPositionIndex(animationTime: number) {
        for (let index = 0; index < this.m_NumPositions - 1; ++index) {
            if (animationTime < this.m_Positions[index + 1].timeStamp) {
                return index;
            }
        }
    }

    getRotationIndex(animationTime: number) {
        for (let index = 0; index < this.m_NumRotations - 1; ++index) {
            if (animationTime < this.m_Rotations[index + 1].timeStamp) {
                return index;
            }
        }
    }

    getScaleIndex(animationTime: number) {
        for (let index = 0; index < this.m_NumScalings - 1; ++index) {
            if (animationTime < this.m_Scales[index + 1].timeStamp) {
                return index;
            }
        }
    }

    getProgressFactor(
        lastTimeStamp: number,
        nextTimeStamp: number,
        animationTime: number,
    ) {
        let midWayLength = animationTime - lastTimeStamp;
        let frameDiff = nextTimeStamp - lastTimeStamp;
        return midWayLength / frameDiff;
    }

    interpolatePosition(animationTime: number) {
        if (this.m_NumPositions === 1) {
            return mat4.translate(
                mat4.create(),
                mat4.create(),
                this.m_Positions[0].position,
            );
        }

        let p0Index = this.getPositionIndex(animationTime)!;
        let p1Index = p0Index + 1;

        let progressFactor = this.getProgressFactor(
            this.m_Positions[p0Index].timeStamp,
            this.m_Positions[p1Index].timeStamp,
            animationTime,
        );

        let finalPosition = vec3.lerp(
            vec3.create(),
            this.m_Positions[p0Index].position,
            this.m_Positions[p1Index].position,
            progressFactor,
        );

        return mat4.translate(mat4.create(), mat4.create(), finalPosition);
    }

    interpolateRotation(animationTime: number) {
        if (this.m_NumRotations === 1) {
            let rotation = quat.normalize(
                vec4.create(),
                this.m_Rotations[0].orientation,
            );

            return mat4.fromQuat(mat4.create(), rotation);
        }

        let p0Index = this.getRotationIndex(animationTime)!;
        let p1Index = p0Index + 1;

        let progressFactor = this.getProgressFactor(
            this.m_Rotations[p0Index].timeStamp,
            this.m_Rotations[p1Index].timeStamp,
            animationTime,
        );

        let finalRotation = quat.normalize(
            vec4.create(),
            quat.slerp(
                quat.create(),
                this.m_Rotations[p0Index].orientation,
                this.m_Rotations[p1Index].orientation,
                progressFactor,
            ),
        );
        return mat4.fromQuat(mat4.create(), finalRotation);
    }

    interpolateScaling(animationTime: number) {
        if (this.m_NumScalings === 1) {
            return mat4.scale(
                mat4.create(),
                mat4.create(),
                this.m_Scales[0].scale,
            );
        }

        let p0Index = this.getScaleIndex(animationTime)!;
        let p1Index = p0Index + 1;

        let progressFactor = this.getProgressFactor(
            this.m_Scales[p0Index].timeStamp,
            this.m_Scales[p1Index].timeStamp,
            animationTime,
        );

        let finalScale = vec3.lerp(
            vec3.create(),
            this.m_Scales[p0Index].scale,
            this.m_Scales[p1Index].scale,
            progressFactor,
        );

        return mat4.scale(mat4.create(), mat4.create(), finalScale);
    }

    update(animationTime: number) {
        let translation = this.interpolatePosition(animationTime);

        let rotation = this.interpolateRotation(animationTime);

        let scale = this.interpolateScaling(animationTime);

        let temp = mat4.multiply(mat4.create(), rotation, scale);

        this.localMatrix = mat4.multiply(mat4.create(), translation, temp);
    }

    getLocalTransform() {
        return this.localMatrix;
    }
}
