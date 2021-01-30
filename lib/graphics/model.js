// export module modelModule
// {
//import {common, mat4, vec3} from "./gl-matrix-es6.js";
//import * as glm from './gl-matrix-es6.js'
import { mat4 } from './gl-matrix-es6.js';
//var x = mat4.create()
function getModelJson(modelName) {
    var x = null;
    $.ajax({
        type: "GET",
        url: "models/" + modelName + "/" + modelName + ".json",
        data: {},
        dataType: "json",
        async: false,
        success: function (result) {
            console.log("success");
            console.log(result);
            x = result;
        },
        error: function (xhr, status, error) {
            console.log("ajax error: " + xhr.status + " " + xhr.statusText);
            console.log(error);
        }
    });
    //console.log("type of json: " + typeof x)
    if (x === null) {
        throw ("error getting model json");
    }
    //var json = JSON.parse(x)
    //console.log("json parsed: " + json)
    return x;
}
function arrayToMat4(a) {
    var x = (mat4.fromValues(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]));
    mat4.transpose(x, x);
    return x;
}
/*
class vertex
{
    coords:vec3
    normals:vec3
    tangents: vec3
    bitangents: vec3
    uv:vec2
    constructor(c:vec3, n:vec3, t:vec3, b:vec3,uv:vec2)
    {
        this.coords = c
        this.normals = n
        this.tangents = t
        this.bitangents = b
        this.uv = uv
    }
}*/
//TODO: maybe https://webglfundamentals.org/webgl/lessons/webgl-pulling-vertices.html
class mesh {
    constructor(jsonRoot, jsonNode, gl, program) {
        console.log("constructing mesh");
        this.children = new Array();
        console.log("mesh jsonnode" + jsonNode);
        console.log("mesh transformation: " + jsonNode.transformation);
        this.transform = arrayToMat4(jsonNode.transformation);
        var meshIndex = jsonNode.meshes;
        var meshData = jsonRoot.meshes[meshIndex];
        var textureIndex = meshData.materialindex;
        if (meshData.primitivetypes != 4) {
            throw ("this model isn't made of triangles");
        }
        if (meshData.numuvcomponents[0] != 2) {
            throw ("weird number of uv components");
        }
        this.vertices = new Float32Array(meshData.vertices);
        this.normals = new Float32Array(meshData.normals);
        this.tangents = new Float32Array(meshData.tangents);
        this.bitangents = new Float32Array(meshData.bitangents);
        this.indices = new Int32Array();
        for (var tri in meshData.faces) {
            console.log(tri);
        }
        //set texture somewhere ere
        //TODO: Initialize/fill vertices and indices arrays
        //this.vertices = new Float32Array()
        //this.indices = new Int32Array()
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
        this.transform = mat4.create();
    }
    draw(parentTransform, gl, program) {
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
export class model {
    constructor(modelName, gl, program) {
        var jsonData = getModelJson(modelName);
        if (jsonData === null) {
            throw ("bad json");
        }
        console.log(jsonData);
        console.log("rootnode:" + jsonData.rootnode);
        console.log(jsonData.rootnode.name);
        console.log("model transformation: " + jsonData.rootnode.transformation);
        this.transform = arrayToMat4(jsonData.rootnode.transformation);
        this.children = new Array();
        console.log("children json: " + jsonData.rootnode.children);
        for (let i = 0; i < jsonData.rootnode.children.length; i++) {
            console.log("making mesh with json: " + jsonData.rootnode.children[i]);
            this.children.push(new mesh(jsonData, jsonData.rootnode.children[i], gl, program));
        }
        //TODO: Initialize/fill vertices and indices arrays
        //this.vertices = new Float32Array()
        //this.indices = new Int32Array()
        /*
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
                this.transform = mat4.create()*/
    }
    draw(gl, program) {
        this.children.forEach(e => { e.draw(this.transform, gl, program); });
        // console.log("drawing");
        // var transformLoc = gl.getUniformLocation(program, "transform")
        // gl.uniformMatrix4fv(transformLoc, false, this.transform as Float32List);
        // gl.clearColor(0.95,0.95,0.95,1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        // gl.bindVertexArray(this.vao);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        // gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); //TODO the 6 needs to be the number of indices
        // gl.bindVertexArray(null);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
