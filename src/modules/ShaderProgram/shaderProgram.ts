import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

export default class ShaderProgram {
    status: boolean = false;
    active: boolean = false;
    program: WebGLProgram;

    constructor(gl: WebGL2RenderingContext, vs: string, fs: string) {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);
        this.checkShaderError(gl, vertexShader, 'vertex shader', vs);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fs);
        gl.compileShader(fragmentShader);
        this.checkShaderError(gl, fragmentShader, 'fragment shader', fs);

        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        this.status = this.checkProgramerror(gl, this.program);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }

    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
    }

    // https://stackoverflow.com/questions/7820683/convert-boolean-result-into-number-integer
    setBool(gl: WebGL2RenderingContext, name: string, value: boolean) {
        gl.uniform1i(gl.getUniformLocation(this.program, name), +value);
    }

    setInt(gl: WebGL2RenderingContext, name: string, value: number) {
        gl.uniform1i(gl.getUniformLocation(this.program, name), value);
    }

    setFloat(gl: WebGL2RenderingContext, name: string, value: number) {
        gl.uniform1f(gl.getUniformLocation(this.program, name), value);
    }

    setVec2(gl: WebGL2RenderingContext, name: string, value: vec2) {
        gl.uniform2fv(gl.getUniformLocation(this.program, name), value);
    }

    setVec3(gl: WebGL2RenderingContext, name: string, value: vec3) {
        gl.uniform3fv(gl.getUniformLocation(this.program, name), value);
    }

    setVec4(gl: WebGL2RenderingContext, name: string, value: vec4) {
        gl.uniform4fv(gl.getUniformLocation(this.program, name), value);
    }

    setMat2(gl: WebGL2RenderingContext, name: string, value: mat2) {
        gl.uniformMatrix2fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    setMat3(gl: WebGL2RenderingContext, name: string, value: mat3) {
        gl.uniformMatrix3fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    setMat4(gl: WebGL2RenderingContext, name: string, value: mat4) {
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, name),
            false,
            value,
        );
    }

    checkShaderError(
        gl: WebGL2RenderingContext,
        shader: WebGLShader,
        type: string,
        source: string,
    ) {
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

    checkProgramerror(gl: WebGL2RenderingContext, program: WebGLProgram) {
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
