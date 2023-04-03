import { GLTFBufferView, GLTFBufferViewTarget } from './gltf2.types';

export default class BufferView {
    byteOffset: number;
    byteLength: number;
    byteStride: number;
    target: any;
    name: string;
    buffer: ArrayBuffer;

    constructor(bufferViewData: GLTFBufferView, bufferData: ArrayBuffer) {
        this.byteOffset =
            bufferViewData.byteOffset === undefined
                ? 0
                : bufferViewData.byteOffset;

        this.byteLength = bufferViewData.byteLength;

        this.byteStride =
            bufferViewData.byteStride === undefined
                ? 0
                : bufferViewData.byteStride;

        this.target =
            bufferViewData.target === undefined
                ? GLTFBufferViewTarget.ARRAY_BUFFER
                : bufferViewData.target;

        this.name =
            bufferViewData.name === undefined ? '' : bufferViewData.name;

        this.buffer = bufferData.slice(
            this.byteOffset,
            this.byteOffset + this.byteLength,
        );
    }
}
