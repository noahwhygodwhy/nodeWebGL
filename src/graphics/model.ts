
// export module modelModule
// {
    
//import {common, mat4, vec3} from "./gl-matrix-es6.js";

//import * as glm from './gl-matrix-es6.js'


import {mat4, common, vec3} from './gl-matrix-es6.js'
import {material} from "./material.js"
//var x = mat4.create()


var loadedModels = new Map<string, model>()



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
    //console.log("type of json: " + typeof x)

    if(x === null)
    {
        throw("error getting model json")
    }

    //var json = JSON.parse(x)

    //console.log("json parsed: " + json)

    return x
}










function arrayToMat4(a : Array<number>):mat4
{

    var x = (mat4.fromValues(
        a[0], a[1],a[2], a[3], 
        a[4], a[5],a[6],a[7],
        a[8],a[9],a[10],a[11],
        a[12],a[13],a[14],a[15]))

    mat4.transpose(x, x)
    return x
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
class mesh
{
    vertices:Float32Array
    normals:Float32Array
    tangents:Float32Array
    bitangents:Float32Array
    textureCoords:Float32Array

    indices: Int32Array

    mat:material

    vao:WebGLVertexArrayObject|null
    vbo:WebGLBuffer|null
    nbo:WebGLBuffer|null
    tbo:WebGLBuffer|null
    bbo:WebGLBuffer|null
    uvbo:WebGLBuffer|null
    ebo:WebGLBuffer|null
    children:Array<mesh>
    //@ts-ignore
    transform: mat4
    constructor(jsonRoot:any, jsonNode:any, transformation:any, mat:material, gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        //console.log("making a model")
        //console.log("constructing mesh")
        this.children = new Array<mesh>()
        this.mat = mat
        //console.log("assigning mat: " + this.mat)
        //console.log("mesh jsonnode" + jsonNode)
        //console.log("mesh transformation: " + jsonNode.transformation)
        //console.log(jsonNode.materialindex)
        this.transform = arrayToMat4(transformation)
        //var meshIndex = jsonNode.meshes

        

        var meshData = jsonNode
        if(meshData.primitivetypes != 4)
        {
            throw("this model isn't made of triangles")
        }
        if(meshData.numuvcomponents[0] != 2)
        {
            throw("weird number of uv components")
        }

        this.vertices = new Float32Array(meshData.vertices)
        //console.log("has " + this.vertices.length/3 + " triangles");
        this.normals = new Float32Array(meshData.normals)
        this.tangents = new Float32Array(meshData.tangents)
        this.bitangents = new Float32Array(meshData.bitangents)
        
        //console.log(meshData.texturecoords)
        this.textureCoords = new Float32Array(meshData.texturecoords[0]);
        /*for(let i = 0; i < this.textureCoords.length; i+=2)
        {
            console.log(this.textureCoords[i] + ","+this.textureCoords[i+1]);
        }*/

        this.indices = new Int32Array()
        var tempArray = new Array<number>()
        for(let i = 0; i < meshData.faces.length; i++)
        {
            for(let j = 0; j < meshData.faces[i].length; j++)
            {
                tempArray.push(meshData.faces[i][j])
            }
        }
        this.indices = new Int32Array(tempArray)
        this.uvbo = new Float32Array(meshData.texturecoords)

        



        //set texture somewhere ere



        //TODO: Initialize/fill vertices and indices arrays
        //this.vertices = new Float32Array()
        //this.indice


        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
    
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 0, 0);

        this.nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "normal")); //but why
        gl.vertexAttribPointer(gl.getAttribLocation(program, "normal"), 3, gl.FLOAT, false, 0, 0);

        this.tbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.tangents, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "tangent"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "tangent"), 3, gl.FLOAT, false, 0, 0);

        this.bbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bitangents, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "bitangent"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "bitangent"), 3, gl.FLOAT, false, 0, 0);

        this.uvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.textureCoords, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "uv"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "uv"), 2, gl.FLOAT, false, 0, 0);


    
        this.ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
    }
    draw(parentTransform:mat4, gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        if(this.vao === null)
        {
            throw("issue with vao")
        }

        //console.log("drawing mesh");
        //gl.useProgram(program)
        this.mat.use(gl, program)

        var transformLoc = gl.getUniformLocation(program, "transform")
        var globalTransform = mat4.create()
        mat4.multiply(globalTransform, parentTransform, this.transform)
        gl.uniformMatrix4fv(transformLoc, false, globalTransform as Float32List);

    
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    
        //console.log("this many indices: " + this.indices.length)
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0); //TODO the 6 needs to be the number of indices
    
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.mat.unuse(gl, program)

    }
}





export class model
{
    children:Array<mesh>
    materials:Array<material>
    //@ts-ignore
    transform: mat4 //model will still have a transform
    constructor(modelName:string, gl:WebGL2RenderingContext, program :WebGLProgram)
    {
        var jsonData = getModelJson(modelName);
        if(jsonData === null)
        {
            throw("bad json")
        }

        this.materials = new Array<material>()

        for(let i = 0; i < jsonData.materials.length; i++)
        {
            this.materials.push(new material(gl, jsonData.materials[i], modelName))
        }

        this.transform = arrayToMat4(jsonData.rootnode.transformation)
        this.children = new Array<mesh>()
        let l = jsonData.rootnode.children.length;

        var meshIndex = 0;
        
        for(let i = 0; i < l; i++)
        {
            if(jsonData.rootnode.children[i].meshes != undefined)
            {
                var mat = this.materials[jsonData.meshes[jsonData.rootnode.children[i].meshes].materialindex]
                console.log("uses material #" + jsonData.meshes[jsonData.rootnode.children[i].meshes].materialindex)
                this.children.push(new mesh(jsonData, jsonData.meshes[meshIndex],jsonData.rootnode.children[i].transformation, mat,  gl, program));
                meshIndex++
            }
            
        }

        this.transform = mat4.rotateY(this.transform, this.transform, common.toRadian(180))

        //mat4.scale(this.transform, this.transform, vec3.fromValues(5, 5, 5));
    }
    draw(gl:WebGL2RenderingContext, program :WebGLProgram)
    {   

        //mat4.rotate(this.transform, this.transform, common.toRadian(2), [0, 1, 0])
        //mat4.scale(this.transform, this.transform, vec3.fromValues(1, 1, 1))
        //this.transform = mat4.rotateY(this.transform, this.transform, common.toRadian(1))
        for(let i = 0; i < this.children.length; i++)
        {
            this.children[i].draw(this.transform, gl, program)
        }

    }
}
