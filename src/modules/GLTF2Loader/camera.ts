import {
    GLTFCamera,
    GLTFOrthographicCamera,
    GLTFPerspectiveCamera,
} from './gltf2.types';

export default class Camera {
    orthographic: GLTFOrthographicCamera | null;
    perspective: GLTFPerspectiveCamera | null;
    type: 'perspective' | 'orthographic';
    name: string;

    constructor(cameraData: GLTFCamera) {
        this.orthographic =
            cameraData.orthographic === undefined
                ? null
                : cameraData.orthographic;

        this.perspective =
            cameraData.perspective === undefined
                ? null
                : cameraData.perspective;

        this.type = cameraData.type;

        this.name = cameraData.name === undefined ? '' : cameraData.name;
    }
}
