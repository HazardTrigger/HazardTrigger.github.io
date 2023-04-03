import ShaderProgram from '../shader/shaderProgram';
import Accessor from './accessor';
import { GLTFIndex, GLTFMesh, GLTFTopologyType } from './gltf2.types';
import Material from './material';
import Sampler from './sampler';
import Texture from './texture';

export default class Mesh {
    weights: number[] | null;
    name: string;
    gl: WebGL2RenderingContext;
    meshID: number;
    attibutes: {
        [key: string]: Accessor | null | undefined;
        POSITION?: Accessor | null | undefined;
        NORMAL?: Accessor | null | undefined;
        TEXCOORD_0?: Accessor | null | undefined;
        COLOR_0?: Accessor | null | undefined;
        JOINTS_0?: Accessor | null | undefined;
        WEIGHTS_0?: Accessor | null | undefined;
        TANGENT?: Accessor | null | undefined;
    } = { POSITION: null, NORMAL: null, TEXCOORD_0: null };

    indices: Accessor | undefined;
    material: Material | null = null;
    mode: GLTFTopologyType = GLTFTopologyType.TRIANGLES;
    targets: {
        POSITION?: Accessor | null | undefined;
        NORMAL?: Accessor | null | undefined;
        TANGENT?: Accessor | null | undefined;
        [key: string]: Accessor | null | undefined;
    }[] = [];
    vao: WebGLVertexArrayObject | undefined;
    private ebo: WebGLBuffer | undefined;
    baseColorTexture?: { texture: WebGLTexture; textureUnit: number };

    constructor(
        meshData: GLTFMesh,
        meshID: GLTFIndex,
        _accessors: Accessor[],
        _materials: Material[],
        gl: WebGL2RenderingContext,
    ) {
        this.weights = meshData.weights === undefined ? null : meshData.weights;

        this.name = meshData.name === undefined ? '' : meshData.name;

        this.gl = gl;

        this.meshID = meshID;

        let meshPrimitiveData = meshData.primitives[0]; // todo check whether it has multi primitive

        for (let [attributeName, attributeIndex] of Object.entries(
            meshPrimitiveData.attributes,
        )) {
            this.attibutes[attributeName] = _accessors[attributeIndex!];
        }

        if (meshPrimitiveData.indices !== undefined) {
            this.indices = _accessors?.[meshPrimitiveData.indices];
        }

        this.material =
            meshPrimitiveData.material === undefined
                ? null
                : _materials?.[meshPrimitiveData.material];

        this.mode =
            meshPrimitiveData.mode === undefined
                ? GLTFTopologyType.TRIANGLES
                : meshPrimitiveData.mode;

        if (meshPrimitiveData.targets !== undefined) {
            for (let target of meshPrimitiveData.targets) {
                let temp: {
                    POSITION?: Accessor | null | undefined;
                    NORMAL?: Accessor | null | undefined;
                    TANGENT?: Accessor | null | undefined;
                    [key: string]: Accessor | null | undefined;
                } = { POSITION: null, NORMAL: null, TANGENT: null };

                for (let attributeName of Object.keys(target)) {
                    temp[attributeName] = _accessors[target[attributeName]!];
                }

                this.targets.push(temp);
            }
        }

        this.setupMesh();

        if (this.material?.pbrMetallicRoughness.baseColorTexture?.texture) {
            this.baseColorTexture = this.setupTexture(
                this.material?.pbrMetallicRoughness.baseColorTexture!,
                0,
            );
        }
    }

    setupMesh() {
        const { gl } = this;
        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        let posBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(
            this.attibutes.POSITION?.target,
            this.attibutes.POSITION?.data!,
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(
            0,
            this.attibutes.POSITION?.sizeOfType!,
            this.attibutes.POSITION?.compoentType!,
            this.attibutes.POSITION?.normalize!,
            0,
            0,
        );

        let normBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.bufferData(
            this.attibutes.NORMAL?.target,
            this.attibutes.NORMAL?.data!,
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(
            1,
            this.attibutes.NORMAL?.sizeOfType!,
            this.attibutes.NORMAL?.compoentType!,
            this.attibutes.NORMAL?.normalize!,
            0,
            0,
        );

        let texBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(
            this.attibutes.TEXCOORD_0?.target,
            this.attibutes.TEXCOORD_0?.data!,
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(
            2,
            this.attibutes.TEXCOORD_0?.sizeOfType!,
            this.attibutes.TEXCOORD_0?.compoentType!,
            this.attibutes.TEXCOORD_0?.normalize!,
            0,
            0,
        );

        if (this.attibutes.TANGENT?.data) {
            let tangentBuffer = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
            gl.bufferData(
                this.attibutes.TANGENT.target,
                this.attibutes.TANGENT?.data!,
                gl.STATIC_DRAW,
            );
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(
                3,
                this.attibutes.TANGENT?.sizeOfType!,
                this.attibutes.TANGENT?.compoentType!,
                this.attibutes.TANGENT?.normalize!,
                0,
                0,
            );
        }

        // gl.enableVertexAttribArray(4);
        // gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 0, 0);

        let boneIdsBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, boneIdsBuffer);
        gl.bufferData(
            this.attibutes.JOINTS_0?.target,
            this.attibutes.JOINTS_0?.data!,
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(5);
        gl.vertexAttribIPointer(
            5,
            this.attibutes.JOINTS_0?.sizeOfType!,
            this.attibutes.JOINTS_0?.compoentType!,
            0,
            0,
        );

        let weightsBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, weightsBuffer);
        gl.bufferData(
            this.attibutes.WEIGHTS_0?.target,
            this.attibutes.WEIGHTS_0?.data!,
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(
            6,
            this.attibutes.WEIGHTS_0?.sizeOfType!,
            this.attibutes.WEIGHTS_0?.compoentType!,
            this.attibutes.WEIGHTS_0?.normalize!,
            0,
            0,
        );

        this.ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            this.indices?.data!,
            gl.STATIC_DRAW,
        );

        gl.bindVertexArray(null);
    }

    setupTexture(
        textureData: { texCoord: string; texture: Texture },
        textureUnit: number,
    ) {
        const { gl } = this;
        const { sampler, source } = textureData.texture;
        let texture = gl.createTexture()!;

        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            source!.width,
            source!.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source!,
        );
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_S,
            sampler ? sampler.wrapS! : gl.REPEAT,
        );
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_T,
            sampler ? sampler.wrapT! : gl.REPEAT,
        );
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            sampler ? sampler.minFilter! : gl.LINEAR_MIPMAP_LINEAR,
        );
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MAG_FILTER,
            sampler ? sampler.magFilter! : gl.LINEAR,
        );

        return { texture, textureUnit };
    }

    draw(shader: ShaderProgram, wireframe: boolean = false) {
        const { gl, vao, indices } = this;
        let diffuseNr = 1;
        let specularNr = 1;
        let normalNr = 1;
        let heightNr = 1;

        if (this.baseColorTexture) {
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.uniform1i(
                gl.getUniformLocation(shader.program, 'texture_diffuse'),
                this.baseColorTexture!.textureUnit,
            );
            gl.bindTexture(gl.TEXTURE_2D, this.baseColorTexture!.texture!);
        }

        gl.bindVertexArray(vao!);
        gl.drawElements(
            wireframe ? gl.LINES : this.mode,
            indices?.data?.length!,
            gl.UNSIGNED_SHORT,
            0,
        );
        gl.bindVertexArray(null);
    }
}
