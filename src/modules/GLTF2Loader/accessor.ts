import BufferView from './bufferView';
import {
    GLTFAccessor,
    GLTFAccessorComponentType,
    GLTFAccessorSparse,
} from './gltf2.types';

export default class Accessor {
    byteOffset: number;
    compoentType: GLTFAccessorComponentType;
    // glDataType?: GLenum
    data:
        | Int8Array
        | Uint8Array
        | Int16Array
        | Uint16Array
        | Uint32Array
        | Float32Array
        | undefined;
    normalize: boolean;
    count: number;
    type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
    sizeOfType: number;
    max: number[];
    min: number[];
    sparse: GLTFAccessorSparse | null;
    name: string;
    target: any;

    constructor(
        accessorData: GLTFAccessor,
        { buffer, target }: BufferView,
        gl: WebGL2RenderingContext,
    ) {
        this.byteOffset =
            accessorData.byteOffset === undefined ? 0 : accessorData.byteOffset;

        this.compoentType = accessorData.componentType;

        this.data = this.constructBufferData(this.compoentType, buffer);

        this.normalize =
            accessorData.normalize === undefined
                ? false
                : accessorData.normalize;

        this.count = accessorData.count;

        this.type = accessorData.type;

        this.target = target !== undefined ? target : 34962;

        switch (this.type) {
            case 'SCALAR':
                this.sizeOfType = 1;
                break;
            case 'VEC2':
                this.sizeOfType = 2;
                break;
            case 'VEC3':
                this.sizeOfType = 3;
                break;
            case 'VEC4':
                this.sizeOfType = 4;
                break;
            case 'MAT2':
                this.sizeOfType = 4;
                break;
            case 'MAT3':
                this.sizeOfType = 9;
                break;
            case 'MAT4':
                this.sizeOfType = 16;
                break;
            default:
                this.sizeOfType = 0;
                break;
        }

        this.max = accessorData.max === undefined ? [] : accessorData.max;

        this.min = accessorData.min === undefined ? [] : accessorData.min;

        this.sparse =
            accessorData.sparse === undefined ? null : accessorData.sparse;

        this.name = accessorData.name === undefined ? '' : accessorData.name;
    }

    constructBufferData(type: GLTFAccessorComponentType, buffer: ArrayBuffer) {
        switch (type) {
            case GLTFAccessorComponentType.BYTE:
                return new Int8Array(buffer);
            case GLTFAccessorComponentType.UNSIGNED_BYTE:
                return new Uint8Array(buffer);
            case GLTFAccessorComponentType.SHORT:
                return new Int16Array(buffer);
            case GLTFAccessorComponentType.UNSIGNED_SHORT:
                return new Uint16Array(buffer);
            case GLTFAccessorComponentType.UNSIGNED_INT:
                return new Uint32Array(buffer);
            case GLTFAccessorComponentType.FLOAT:
                return new Float32Array(buffer);
            default:
                break;
        }
    }
}
