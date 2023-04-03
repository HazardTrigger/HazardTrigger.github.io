import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';
import { Matrix3, Matrix4, Vector2, Vector3, Vector4 } from 'three';

export default class ShaderProgram {
    status: boolean = false;
    active: boolean = false;
    program: WebGLProgram;
    gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext, vs: string, fs: string) {
        this.gl = gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);
        this.checkShaderError(vertexShader, 'vertex shader', vs);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fs);
        gl.compileShader(fragmentShader);
        this.checkShaderError(fragmentShader, 'fragment shader', fs);

        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        this.status = this.checkProgramerror(this.program);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }

    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
    }

    // https://stackoverflow.com/questions/7820683/convert-boolean-result-into-number-integer
    setBool(name: string, value: boolean) {
        const { gl } = this;
        gl.uniform1i(gl.getUniformLocation(this.program, name), +value);
    }

    setInt(name: string, value: number) {
        const { gl } = this;

        gl.uniform1i(gl.getUniformLocation(this.program, name), value);
    }

    setFloat(name: string, value: number) {
        const { gl } = this;

        gl.uniform1f(gl.getUniformLocation(this.program, name), value);
    }

    setVec2(name: string, value: vec2) {
        const { gl } = this;

        gl.uniform2fv(gl.getUniformLocation(this.program, name), value);
    }

    setVec2THREE(name: string, value: Vector2) {
        const { gl, program } = this;

        gl.uniform2fv(
            gl.getUniformLocation(program, name),
            new Float32Array(value.toArray()),
        );
    }

    setVec3(name: string, value: vec3) {
        const { gl } = this;

        gl.uniform3fv(gl.getUniformLocation(this.program, name), value);
    }

    setVec3THREE(namae: string, value: Vector3) {
        const { gl, program } = this;
        gl.uniform3fv(
            gl.getUniformLocation(program, namae),
            new Float32Array(value.toArray()),
        );
    }

    setVec4(name: string, value: vec4) {
        const { gl } = this;

        gl.uniform4fv(gl.getUniformLocation(this.program, name), value);
    }

    setVec4THREE(name: string, value: Vector4) {
        const { gl, program } = this;
        gl.uniform4fv(
            gl.getUniformLocation(program, name),
            new Float32Array(value.toArray()),
        );
    }

    setMat2(name: string, value: mat2) {
        const { gl } = this;

        gl.uniformMatrix2fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    setMat3(name: string, value: mat3) {
        const { gl } = this;

        gl.uniformMatrix3fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    setMat3THREE(name: string, value: Matrix3) {
        const { gl, program } = this;
        gl.uniformMatrix3fv(
            gl.getUniformLocation(program, name),
            false,
            new Float32Array(value.elements),
        );
    }

    setMat4(name: string, value: mat4) {
        const { gl } = this;

        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    setMat4THREE(name: string, value: Matrix4) {
        const { gl, program } = this;
        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, name),
            false,
            new Float32Array(value.elements),
        );
    }

    checkShaderError(shader: WebGLShader, type: string, source: string) {
        const { gl } = this;

        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            console.warn(
                `${type} compile error: ${gl.getShaderInfoLog(
                    shader,
                )}\n ${source}`,
            );
            return false;
        }
        return true;
    }

    checkProgramerror(program: WebGLProgram) {
        const { gl } = this;

        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            console.warn(
                `program failed to link: ${gl.getProgramInfoLog(program)}`,
            );
            return false;
        }
        return true;
    }
}
