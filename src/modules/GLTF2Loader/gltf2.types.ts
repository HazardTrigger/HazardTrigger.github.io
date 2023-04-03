export enum GLTFAccessorComponentType {
    BYTE = 5120, // Int8Array
    UNSIGNED_BYTE = 5121, // Uint8Array
    SHORT = 5122, // Int16Array
    UNSIGNED_SHORT = 5123, // Uint16Array
    UNSIGNED_INT = 5125, // Uint32Array
    FLOAT = 5126, // Float32Array
}

export enum GLTFAccessorSparseComponentType {
    UNSIGNED_BYTE = 5121, // Uint8Array
    UNSIGNED_SHORT = 5123, // Uint16Array
    UNSIGNED_INT = 5125, // Uint32Array
}

export enum GLTFBufferViewTarget {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963,
}

export enum GLTFTopologyType {
    POINTS = 0,
    LINES = 1,
    LINE_LOOP = 2,
    LINE_STRIP = 3,
    TRIANGLES = 4,
    TRIANGLES_STRIP = 5,
    TRIANGLES_FAN = 6,
}

export enum GLTFSamplerMagFilter {
    NEAREST = 9728,
    LINEAR = 9729,
}

export enum GLTFSamplerMinFilter {
    NEAREST = 9728,
    LINEAR = 9729,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987,
}

export enum GLTFSamplerWrapS {
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648,
    REPEAT = 10497,
}

export enum GLTFSamplerWrapT {
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648,
    REPEAT = 10497,
}

export type Extension = {
    title?: string;
    type?: string;
    description?: string;
    properties?: {};
    additionalProperties?: {};
};

// export type GLTFAccessorDataType =
//     | 'SCALAR'
//     | 'VEC2'
//     | 'VEC3'
//     | 'VEC4'
//     | 'MAT2'
//     | 'MAT3'
//     | 'MAT4';

export type Extras = any; // wait for define

export type GLTFIndex = number;

type Unused = {
    extensions?: Extension;
    extras?: Extras;
};

export type GLTFMeshPrimitiveTarget = {
    POSITION?: GLTFIndex | undefined;
    NORMAL?: GLTFIndex | undefined;
    TANGENT?: GLTFIndex | undefined;
    [key: string]: GLTFIndex | undefined;
};

export type GLTFAcessorSparseIndices = {
    bufferView: GLTFIndex;
    byteOffset?: number; // default 0
    componentType: GLTFAccessorSparseComponentType;
} & Unused;

export type GLTFAccessorSparseValues = {
    bufferView: GLTFIndex;
    byteOffset?: number; // default 0
} & Unused;

export type GLTFAccessorSparse = {
    count: number;
    indices: GLTFAcessorSparseIndices;
    values: GLTFAccessorSparseValues;
} & Unused;

export type GLTFAccessor = {
    bufferView?: GLTFIndex;
    byteOffset?: number; // default 0
    componentType: GLTFAccessorComponentType;
    normalize?: boolean; // default false
    count: number;
    type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
    max?: number[];
    min?: number[];
    sparse?: GLTFAccessorSparse;
    name?: string;
} & Unused;

export type GLTFAnimationChannelTarget = {
    node?: GLTFIndex;
    path: 'translation' | 'rotation' | 'scale' | 'weights';
} & Unused;

export type GLTFAnimationChannel = {
    sampler: GLTFIndex;
    target: GLTFAnimationChannelTarget;
} & Unused;

export type GLTFAnimationSampler = {
    input: GLTFIndex;
    interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE'; // default LINEAR
    output: GLTFIndex;
} & Unused;

export type GLTFAnimation = {
    channels: GLTFAnimationChannel[];
    samplers: GLTFAnimationSampler[];
    name?: string;
} & Unused;

export type GLTFAsset = {
    copyright?: string;
    generator?: string;
    version: string;
    minVersion?: string;
} & Unused;

export type GLTFBuffer = {
    uri?: string;
    byteLength: number;
    name?: string;
} & Unused;

export type GLTFBufferView = {
    buffer: GLTFIndex;
    byteOffset?: number; // default 0
    byteLength: number;
    byteStride?: number;
    target?: GLTFBufferViewTarget;
    name?: string;
} & Unused;

export type GLTFOrthographicCamera = {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
} & Unused;

export type GLTFPerspectiveCamera = {
    aspectRatio?: number;
    yfov: number; // This value SHOULD be less than π.
    zfar?: number; // if not define zfar SHOULD be inf
    znear: number;
} & Unused;

export type GLTFCamera = {
    orthographic?: GLTFOrthographicCamera;
    perspective?: GLTFPerspectiveCamera;
    type: 'perspective' | 'orthographic';
    name?: string;
} & Unused;

export type GLTFImage = {
    uri?: string;
    mimeType?: 'image/jpeg' | 'image/png';
    bufferView?: GLTFIndex;
    name?: string;
} & Unused;

export type GLTFTextureInfo = {
    index: GLTFIndex;
    texCoord?: GLTFIndex; // default 0 TEXCOORD_<set index> which is a reference to a key in mesh.primitives.attributes (e.g. a value of 0 corresponds to TEXCOORD_0).
} & Unused;

export type GLTFMaterialPBRMetallicRoughness = {
    baseColorFactor?: [number, number, number, number]; // default [1, 1, 1, 1]
    baseColorTexture?: GLTFTextureInfo;
    metallicFactor?: number; // default 1
    roughnessFactor?: number; // default 1
    metallicRoughnessTexture?: GLTFTextureInfo;
} & Unused;

export type GLTFMaterialOcclusionTextureInfo = {
    index: GLTFIndex;
    texCoord?: GLTFIndex; // default 0
    strength?: number; // default 1
} & Unused;

export type GLTFMaterialNormalTextureInfo = {
    index: GLTFIndex;
    texCoord?: GLTFIndex; // default 0
    scale?: number; // default 1
} & Unused;

export type GLTFMaterial = {
    name?: string;
    pbrMetallicRoughness?: GLTFMaterialPBRMetallicRoughness;
    normalTexture?: GLTFMaterialNormalTextureInfo;
    occlusionTexture?: GLTFMaterialOcclusionTextureInfo;
    emissiveTexture: GLTFTextureInfo;
    emissiveFactor?: [number, number, number]; // default [0, 0, 0]
    alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND'; // default OPAQUE
    alphaCutOff?: number; // default 0.5
    doubleSided?: boolean; // default false
} & Unused;

export type GLTFMeshPrimitive = {
    attributes: {
        POSITION?: GLTFIndex | undefined;
        NORMAL?: GLTFIndex | undefined;
        TEXCOORD_0?: GLTFIndex | undefined;
        COLOR_0?: GLTFIndex | undefined;
        JOINTS_0?: GLTFIndex | undefined;
        WEIGHTS_0?: GLTFIndex | undefined;
        TANGENT?: GLTFIndex | undefined;
        [key: string]: GLTFIndex | undefined;
    };
    indices?: GLTFIndex;
    material?: GLTFIndex;
    mode?: GLTFTopologyType; // default TRIANGLES
    targets?: GLTFMeshPrimitiveTarget[]; // morph target array
} & Unused;

export type GLTFMesh = {
    primitives: GLTFMeshPrimitive[];
    weights?: number[];
    name?: string;
} & Unused;

export type GLTFNode = {
    camera?: GLTFIndex;
    children?: GLTFIndex[];
    skin?: GLTFIndex;
    matrix?: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
    ]; // 4x4 column-major order default [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
    mesh?: GLTFIndex;
    rotation?: [number, number, number, number]; // quaternion rotation in the order (x, y, z, w) default [0,0,0,1]
    scale?: [number, number, number]; // scaling factors along the x, y, and z axes default [1,1,1]
    translation?: [number, number, number]; // ranslation along the x, y, and z axes default [0, 0, 0]
    weights?: number[];
    name?: string;
} & Unused;

export type GLTFSampler = {
    magFilter?: GLTFSamplerMagFilter;
    minFilter?: GLTFSamplerMinFilter;
    wrapS?: GLTFSamplerWrapS; // default REPEAT
    wrapT?: GLTFSamplerWrapT; // default REPEAT
    name?: string;
} & Unused;

export type GLTFScene = {
    nodes?: GLTFIndex[];
    name?: string;
} & Unused;

export type GLTFSkin = {
    inverseBindMatrices?: GLTFIndex;
    skeleton?: GLTFIndex; // root node in nodes
    joints: GLTFIndex[];
    name?: string;
} & Unused;

export type GLTFTexture = {
    sampler?: GLTFIndex;
    source?: GLTFIndex;
    name?: string;
} & Unused;

export type glTFBase = {
    extensionsUsed?: string[];
    extensionsRequired?: string[];
    accessors?: GLTFAccessor[];
    animations?: GLTFAnimation[];
    asset: GLTFAsset;
    buffers?: GLTFBuffer[];
    bufferViews?: GLTFBufferView[];
    cameras?: GLTFCamera[];
    images?: GLTFImage[];
    materials?: GLTFMaterial[];
    meshes?: GLTFMesh[];
    nodes?: GLTFNode[];
    samplers?: GLTFSampler[];
    scene?: GLTFIndex;
    scenes?: GLTFScene[];
    skins?: GLTFSkin[];
    textures?: GLTFTexture[];
} & Unused;
