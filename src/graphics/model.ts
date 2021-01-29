
// export module modelModule
// {
    
import {common, mat4} from "./gl-matrix-es6.js";
export class model
{
    vertices: Array<number>
    indices: Array<bigint>
    vao:any
    vbo:any
    ebo:any
    //@ts-ignore
    transform: mat4
    constructor(vertices:Array<number>, indices:Array<bigint>, vao:any, vbo:any, ebo:any)
    {
        this.vertices = vertices;
        this.indices = indices;
        this.vao = vao
        this.vbo = vbo
        this.ebo = ebo
        //@ts-ignore
        this.transform = mat4.create()
    }
    draw(gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        console.log("drawing");
        var transformLoc = gl.getUniformLocation(program, "transform")
        gl.uniformMatrix4fv(transformLoc, false, this.transform);

        gl.clearColor(0.95,0.95,0.95,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); //TODO the 6 needs to be the number of indices
    
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    }
}



