// export module modelModule
// {
import { mat4 } from "./gl-matrix-es6.js";
export class model {
    constructor(vertices, indices, vao, vbo, ebo) {
        this.vertices = vertices;
        this.indices = indices;
        this.vao = vao;
        this.vbo = vbo;
        this.ebo = ebo;
        //@ts-ignore
        this.transform = mat4.create();
    }
    draw(gl, program) {
        console.log("drawing");
        var transformLoc = gl.getUniformLocation(program, "transform");
        gl.uniformMatrix4fv(transformLoc, false, this.transform);
        gl.clearColor(0.95, 0.95, 0.95, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); //TODO the 6 needs to be the number of indices
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}
