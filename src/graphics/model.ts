
// export module modelModule
// {
    
//import {common, mat4, vec3} from "./gl-matrix-es6.js";

import * as glm from 'gl-matrix'


var x = glm.mat4.create()

function getModelJson(modelName:string):any
{
    var x = null
    $.ajax(
        {
            type: "GET",
            url: "models/"+modelName+"/"+modelName+".json",
            data:{},
            dataType:"json",
            async:false,
            success:function(result:any)
            {
                console.log("success");
                console.log(result);
                x = result
            },
            error:function(xhr:any, status:any, error:any)
            {
                console.log("ajax error: " + xhr.status + " " + xhr.statusText)
                console.log(error)
            }
        }
    );
    console.log(typeof x)
    return x
}

export class model
{
    vertices: Float32Array|null
    indices: Int32Array|null
    vao:any
    vbo:any
    ebo:any
    //@ts-ignore
    transform: mat4
    constructor(modelName:string, gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        var jsonData = getModelJson(modelName);
        if(jsonData === null)
        {
            throw("bad json")
        }

        //TODO: Initialize/fill vertices and indices arrays
        //this.vertices = new Float32Array()
        //this.indices = new Int32Array()



        this.vertices=null
        this.indices=null


        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
    
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "uv"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "uv"), 2, gl.FLOAT, false, 20, 12);
    
        this.ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    

    
        //@ts-ignore
        this.transform = mat4.create()
    }
    draw(gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        console.log("drawing");
        var transformLoc = gl.getUniformLocation(program, "transform")
        gl.uniformMatrix4fv(transformLoc, false, this.transform as Float32List);

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




/*function initModel(modelName:string) //TODO program can be a program
{
    console.log("model name: " + modelName)
    var jsonData = getModelJson(modelName);    
    console.log("jsonData: " + jsonData)

    if(jsonData === null)
    {
        throw("bad json")
    }

    var vertices = jsonData["vertices"];
    var indices = jsonData["indices"];
    
    console.log("vertices: " + jsonData.vertices);
    console.log("indices: " + jsonData.indices);

    var VAO = this.gl.createVertexArray();
    this.gl.bindVertexArray(VAO);


    var VBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    

    this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.program, "aPos"));
    this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.program, "uv"));
    this.gl.vertexAttribPointer(this.gl.getAttribLocation(this.program, "aPos"), 3, this.gl.FLOAT, false, 20, 0);
    this.gl.vertexAttribPointer(this.gl.getAttribLocation(this.program, "uv"), 2, this.gl.FLOAT, false, 20, 12);


    var EBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, EBO);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int32Array(indices), this.gl.STATIC_DRAW);

    this.gl.bindVertexArray(null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); 
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);



    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.models.push(new model(indices, vertices, VAO, VBO, EBO))
}*/