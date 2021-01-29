//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
//REQUIRES ajax via jQuery
import { mat4 } from "./gl-matrix-es6.js";
import { model } from "./model.js";
var x = mat4.create();
console.log("hello world");
var vertSource = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 uv;

//attribute vec3 aPos;
//attribute vec2 uv;


uniform mat4 view;
uniform mat4 projection;
uniform mat4 transform;

out vec2 frag_uv;

void main()
{

    //coords = aPos;
    //texCoords = aUV;
    //gl_Position = projection*view*transform*vec4(aPos, 1.0);
    frag_uv = uv;
    gl_Position = vec4(aPos, 1.0);
}
`;
var fragSource = `#version 300 es

precision mediump float;

in vec2 frag_uv;
out vec4 FragColor;
void main()
{
    FragColor = vec4(frag_uv.x, frag_uv.y, 0, 1);
}
`;
class renderer {
    constructor(canvas) {
        var glMaybe = canvas.getContext("webgl2");
        if (glMaybe === null) {
            console.log("no webgl :(");
            throw ("No webGL");
        }
        this.gl = glMaybe;
        this.program = makeProgram(this);
        this.models = new Array();
        // @ts-ignore
        this.projection = mat4.create();
        console.log("mat4 type: " + typeof this.projection);
        mat4.identity(this.projection);
        // @ts-ignore
        this.view = mat4.create();
    }
    initialize() {
        this.gl.useProgram(this.program);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }
    draw() {
        this.gl.useProgram(this.program);
        var viewLoc = this.gl.getUniformLocation(this.program, "view");
        var projectionLoc = this.gl.getUniformLocation(this.program, "projection");
        // @ts-ignore
        var view = mat4.create();
        // @ts-ignore
        var projection = mat4.create();
        this.gl.uniformMatrix4fv(viewLoc, false, this.view);
        this.gl.uniformMatrix4fv(projectionLoc, false, this.projection);
        console.log("there are this many models: " + this.models.length);
        this.models.forEach(m => m.draw(this.gl, this.program));
    }
    initModel(modelName) {
        console.log("model name: " + modelName);
        var jsonData = getModelJson(modelName);
        console.log("jsonData: " + jsonData);
        if (jsonData === null) {
            throw ("bad json");
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
        this.models.push(new model(indices, vertices, VAO, VBO, EBO));
    }
}
var canvasID = "c";
window.onload = init;
function makeShader(r, source, type) {
    var shader = r.gl.createShader(type);
    if (shader === null) {
        console.log("error making shader");
        return null;
    }
    r.gl.shaderSource(shader, source);
    r.gl.compileShader(shader);
    var success = r.gl.getShaderParameter(shader, r.gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log("problem creating shader\n");
    console.log(r.gl.getShaderInfoLog(shader));
    r.gl.deleteShader(shader);
    return null;
}
function makeProgram(r) {
    var program = r.gl.createProgram();
    if (program === null) {
        console.log("error making shader program");
        throw ("error");
    }
    var vertShader = makeShader(r, fragSource, r.gl.FRAGMENT_SHADER);
    var fragShader = makeShader(r, vertSource, r.gl.VERTEX_SHADER);
    if (vertShader === null || fragShader === null) {
        throw ("error");
    }
    r.gl.attachShader(program, vertShader);
    r.gl.attachShader(program, fragShader);
    r.gl.linkProgram(program);
    var success = r.gl.getProgramParameter(program, r.gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log("problem creating program\n");
    r.gl.deleteProgram(program);
    throw ("error");
}
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
    console.log(typeof x);
    return x;
}
function resizeCanvas() {
    var canvas = document.getElementById(canvasID);
    if (canvas === null) {
        return;
    }
    console.log("resizing canvas");
    console.log("width:" + String(window.innerWidth * 0.95) + "px");
    canvas.style.width = String(window.innerWidth * 0.95) + "px";
    canvas.style.height = String(window.innerHeight * 0.95) + "px";
}
function init() {
    var modelName = "square";
    //init stuff
    var canvas = document.getElementById(canvasID);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    var r = new renderer(canvas);
    //var transform = new mat4;
    r.initModel(modelName);
    r.draw();
}
