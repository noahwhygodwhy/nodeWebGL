//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
//REQUIRES ajax via jQuery
//import {common, mat4, vec3} from "./gl-matrix-es6.js";
import { model } from "./model.js";
import { mat4, common } from './gl-matrix-es6.js';
var vertSource = `#version 300 es

precision mediump float;

in vec3 aPos;
in vec3 normal;
in vec3 tangent;
in vec3 bitangent;
in vec2 uv;

//attribute vec3 aPos;
//attribute vec2 uv;


uniform mat4 view;
uniform mat4 projection;
uniform mat4 transform;

out vec2 frag_uv;

void main()
{

    vec3 a = normal;
    a = tangent;
    a = bitangent;
    //coords = aPos;
    //texCoords = aUV;
    gl_Position = projection*view*transform*vec4(aPos, 1.0);
    frag_uv = uv;
    //gl_Position = vec4(aPos, 1.0);
}
`;
var fragSource = `#version 300 es

precision mediump float;

uniform sampler2D diffuse;
uniform sampler2D specular;
uniform sampler2D height;

uniform bool hasDiffuse;
uniform bool hasSpecular;
uniform bool hasHeight;

in vec2 frag_uv;
out vec4 FragColor;
void main()
{
    FragColor = texture(diffuse, frag_uv);
    //FragColor = vec4(1,0,0,1);
    //FragColor = vec4(frag_uv.x, frag_uv.y, 0, 1);
}
`;
var gl;
var program;
var models;
var projection;
var view;
var pT;
var dT;
function initializeRenderer(canvas) {
    pT = 0;
    dT = 0;
    var glMaybe = canvas.getContext("webgl2");
    if (glMaybe === null) {
        console.log("no webgl :(");
        throw ("No webGL");
    }
    gl = glMaybe;
    var x = gl.createTexture();
    program = makeProgram();
    models = new Array();
    projection = mat4.create();
    view = mat4.create();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
function draw(cT) {
    //console.log(cT)
    dT = cT - pT;
    //console.log("frame")
    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    var viewLoc = gl.getUniformLocation(program, "view");
    var camX = Math.sin(cT / 1000) * 5;
    var camZ = Math.cos(cT / 1000) * 5;
    var camY = 1;
    //camY = 0
    //camX = 0
    mat4.lookAt(view, [camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    //mat4.invert(view, view);
    //@ts-ignore
    gl.uniformMatrix4fv(viewLoc, false, view); //TODO: if it doesn't work this is the culprit (as float32list) 
    var projectionLoc = gl.getUniformLocation(program, "projection");
    mat4.perspective(projection, common.toRadian(60), gl.canvas.width / gl.canvas.height, 0.1, 2000);
    //@ts-ignore
    gl.uniformMatrix4fv(projectionLoc, false, projection);
    models.forEach(m => m.draw(gl, program));
    requestAnimationFrame(draw);
}
function addModel(name, position) {
    models.push(new model(name, gl, program));
}
var canvasID = "c";
window.onload = main;
function makeShader(source, type) {
    var shader = gl.createShader(type);
    if (shader === null) {
        console.log("error making shader");
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log("problem creating shader\n");
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}
function makeProgram() {
    var program = gl.createProgram();
    if (program === null) {
        console.log("error making shader program");
        throw ("error");
    }
    var vertShader = makeShader(fragSource, gl.FRAGMENT_SHADER);
    var fragShader = makeShader(vertSource, gl.VERTEX_SHADER);
    if (vertShader === null || fragShader === null) {
        throw ("error");
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log("problem creating program\n");
    gl.deleteProgram(program);
    throw ("error");
}
function main() {
    var modelName = "survival backpack";
    //modelName = "brickCube"
    //init stuff
    var canvas = document.getElementById(canvasID);
    initializeRenderer(canvas);
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.95;
    //canvas.style.width = String(window.innerWidth*0.95)+"px";
    //canvas.style.height = String(window.innerHeight*0.95)+"px";
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    window.addEventListener('resize', function () {
        //canvas.style.width = String(window.innerWidth*0.95)+"px";
        //canvas.style.height = String(window.innerHeight*0.95)+"px";
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //draw()
    });
    //var transform = new mat4;
    addModel(modelName);
    //draw()
    requestAnimationFrame(draw);
    //draw()
}
