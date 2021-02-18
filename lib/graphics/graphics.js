//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
//REQUIRES ajax via jQuery
//import {common, mat4, vec3} from "./gl-matrix-es6.js";
import { model } from "./model.js";
import { mat4, common, vec3, vec4 } from './gl-matrix-es6.js';
//import { request } from "http"
import { light, light_point, light_directional, light_spot, lights, bufferLights } from "./light.js";
export var MAX_POINT_LIGHTS = 64;
export var MAX_SPOT_LIGHTS = 64;
export var MAX_DIRECTIONAL_LIGHTS = 8;
var vertSource = `#version 300 es

precision mediump float;

//vert attributes
in vec3 aPos;
in vec3 normal;
in vec3 tangent;
in vec3 bitangent;
in vec2 uv;

//transform matrices

uniform mat4 view;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 normalMat;

//outs
out vec3 frag_normal;
out vec3 frag_pos;
out vec2 frag_uv;
//out vec3 eyeVector;
//out vec3 vertPos;

void main()
{

    vec3 a = normal;
    a = tangent;
    a = bitangent;
    
    gl_Position = projection*view*model*vec4(aPos, 1.0f);

    frag_uv = uv;
    frag_normal = mat3(normalMat)*normal;
    //frag_pos = aPos;
    frag_pos = vec3(model*vec4(aPos, 1.0f));
    //eyeVector = -vec3(clipSpaceV.xyz);

}
`;
var fragSource = `#version 300 es

precision mediump float;

uniform mat4 view;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 normalMat;

layout (std140) uniform Material
{
    vec4 color_diffuse; //4n 0
    vec4 color_specular; //4n 16
    vec4 color_ambient; //4n  32
    
    float shininess; //n 48

    bool hasDiffuse; //n 52
    bool hasSpecular; //n 56
    bool hasHeight; //n 60
};


struct light_directional
{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 direction;
};

struct light_point{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 position;
    float constant;
    float linear;
    float quadratic;
};
struct light_spot{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 position;
    vec3 direction;
    float constant;
    float linear;
    float quadratic;
    float phi;
};

layout (std140) uniform Lights
{
    int nrPointLights;
    int nrSpotLights;
    int nrDirectionalLights;
    //TODO:
    light_point light_points[MAX_POINT_LIGHTS_REPLACE];
    light_spot light_spots[MAX_SPOT_LIGHTS_REPLACE];
    light_directional light_directionals[MAX_DIRECTIONAL_LIGHTS_REPLACE];
};

uniform sampler2D mat_diffuse; //TODO make into array of sampler2Ds with the assimp indexing
uniform sampler2D mat_specular;
uniform sampler2D mat_height;

uniform vec3 viewPos;

in vec3 frag_normal;
in vec3 frag_pos;
in vec2 frag_uv;

out vec4 FragColor;


vec4 calcDirectionalLight(light_directional light, vec3 normal, vec3 viewDir)
{
    vec4 ambientResult = light.ambient*texture(mat_diffuse, frag_uv);

    vec3 lightDir = normalize(light.direction);
    
    vec3 reflectDir = reflect(-lightDir, normal);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*texture(mat_diffuse, frag_uv);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = vec3(light.specular * spec * color_specular);
    vec4 specularResult =  vec4(specular, 1.0f) * texture(mat_specular, frag_uv);

    return vec4(vec3(ambientResult+diffuseResult),1.0);//+specularResult), 1.0);
}

vec4 calcSpotLight(light_spot light, vec3 normal, vec3 viewDir)
{
    vec4 ambientResult = light.ambient*texture(mat_diffuse, frag_uv);

    vec3 lightDir = normalize(light.position-frag_pos);
    float theta = dot(lightDir, light.direction);
    if(theta>light.phi)
    {
        return vec4(vec3(ambientResult), 1.0f);
    }
    vec3 reflectDir = reflect(-lightDir, normal);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*texture(mat_diffuse, frag_uv);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = vec3(light.specular * spec * color_specular);
    vec4 specularResult =  vec4(specular, 1.0f) * texture(mat_specular, frag_uv);

    float d = distance(light.position, frag_pos);

    float attenuation = 1.0/(1.0 + (0.00001*d) + (0.000003*(d*d)));

    ambientResult *= attenuation;
    diffuseResult *= attenuation;
    specularResult *= attenuation;

    return vec4(vec3(ambientResult+diffuseResult+specularResult), 1.0);
    
}

vec4 calcPointLight(light_point light, vec3 normal, vec3 viewDir)
{


    vec4 ambientResult = light.ambient*texture(mat_diffuse, frag_uv);

    vec3 lightDir = normalize(light.position-frag_pos);
    
    vec3 reflectDir = reflect(-lightDir, normal);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*texture(mat_diffuse, frag_uv);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = vec3(light.specular * spec * color_specular);
    vec4 specularResult =  vec4(specular, 1.0f) * texture(mat_specular, frag_uv);

    float d = distance(light.position, frag_pos);

    float attenuation = 1.0/(1.0 + (0.01*d) + (0.003*(d*d)));

    ambientResult *= attenuation;
    diffuseResult *= attenuation;
    specularResult *= attenuation;

    return vec4(vec3(ambientResult+diffuseResult+specularResult), 1.0);
    
}

void main()
{




    vec4 result = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 normal = normalize(frag_normal);
    vec3 viewDir = normalize(viewPos-frag_pos);

    for(int i = 0; i < min(nrPointLights, MAX_POINT_LIGHTS_REPLACE); i++)
    {
        result+=calcPointLight(light_points[i], normal, viewDir);
    }
    for(int i = 0; i < min(nrSpotLights, MAX_SPOT_LIGHTS_REPLACE); i++)
    {
        result+=calcSpotLight(light_spots[i], normal, viewDir);
    }
    for(int i = 0; i < min(nrDirectionalLights, MAX_DIRECTIONAL_LIGHTS_REPLACE); i++)
    {
        result+=calcDirectionalLight(light_directionals[i], normal, viewDir);
    }
    
    result.a = 1.0;
    FragColor = result;

    if(result.a != 1.0)
    {
        FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
    // FragColor = vec4(0.0, 1.0, 0.0, 1.0);

    // if(light_directionals[0].direction == vec3(0.2, -1.0, 0.3))
    // {
    //     FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // }        
    // if(nrPointLights == 5)
    // {

    // }
    // FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // if(nrPointLights == 5)
    // {
    //     FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }
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
    //var x = gl.createTexture()
    program = makeProgram();
    models = new Array();
    projection = mat4.create();
    view = mat4.create();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    light.lubo = gl.createBuffer();
}
const fpsElem = document.querySelector("#fps");
var frameCount = 60;
var frameTimes = new Array(frameCount);
var frameIndex = 0;
function draw(cT) {
    //console.log(cT)
    dT = cT - pT;
    pT = cT;
    var fps = 1.0 / (dT / 1000.0);
    if (fpsElem !== null) {
        frameTimes[frameIndex] = fps;
        frameIndex = (frameIndex + 1) % frameCount;
        //console.log("dt: " + dT);
        //console.log("fps: " + fps);
        let avg = 0;
        frameTimes.forEach(val => { avg += val; });
        avg /= frameCount;
        fpsElem.textContent = avg.toFixed(2);
    }
    //console.log("frame")
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    var viewLoc = gl.getUniformLocation(program, "view");
    var camX = -Math.sin(cT / 1000) * 5;
    var camZ = -Math.cos(cT / 1000) * 5;
    var camY = 1;
    camX = 10;
    camY = 50;
    camZ = 10;
    //var camPos = vec3.fromValues(camX, camY, camZ);
    mat4.lookAt(view, [camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(viewLoc, false, view);
    var projectionLoc = gl.getUniformLocation(program, "projection");
    mat4.perspective(projection, common.toRadian(90), gl.canvas.width / gl.canvas.height, 0.1, 10000);
    gl.uniformMatrix4fv(projectionLoc, false, projection);
    var viewPos = vec3.fromValues(camX, camY, camZ);
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), viewPos);
    lights[0].position = vec3.fromValues(Math.sin(cT / 1000) * 75, 20, Math.cos(cT / 2000) * 75);
    lights[0].bufferAt(gl, program, lights[0].bufferPosition);
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    var lightUniformIndex = gl.getUniformBlockIndex(program, "Lights");
    gl.uniformBlockBinding(program, lightUniformIndex, 1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo);
    // let circ = Math.PI*2.0;
    // let radius = 1000
    // for(let i = 0; i < lights.length; i++)
    // {
    //     if(lights[i] instanceof light_point)
    //     {
    //         //let x = Math.sin(((i/circ)+cT)/lights.length);
    //         let x = Math.sin((((i*lights.length)/circ)+(cT/2000)))*75;
    //         let z = Math.cos((((i*lights.length)/circ)+(cT/2000)))*75;
    //         //console.log(x + "," + z);
    //         (lights[i] as light_point).position = vec3.fromValues(x, 50, z)
    //         lights[i].bufferAt(gl, program, lights[i].bufferPosition);
    //     }
    // }
    // resetLightIndexes()
    // lights.forEach(l => l.use(gl, program)) //TODO: can split this into a use in init and then a draw call each frame
    // setNrLights(gl, program);
    for (let i = 0; i < models.length; i++) {
        models[i].draw(gl, program, view, dT);
    }
    requestAnimationFrame(draw);
}
function addModel(name, position, rotation, scale) {
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
    fragSource = fragSource.replace(/MAX_SPOT_LIGHTS_REPLACE/g, "" + MAX_SPOT_LIGHTS);
    fragSource = fragSource.replace(/MAX_DIRECTIONAL_LIGHTS_REPLACE/g, "" + MAX_DIRECTIONAL_LIGHTS);
    fragSource = fragSource.replace(/MAX_POINT_LIGHTS_REPLACE/g, "" + MAX_POINT_LIGHTS);
    //console.log(fragSource)
    var fragShader = makeShader(fragSource, gl.FRAGMENT_SHADER);
    var vertShader = makeShader(vertSource, gl.VERTEX_SHADER);
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
export var pointLightBufferOffset;
export var spotLightBufferOffset;
export var directionalLightBufferOffset;
function main() {
    console.log("here2");
    //init stuff
    var canvas = document.getElementById(canvasID);
    initializeRenderer(canvas);
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.95;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });
    pointLightBufferOffset = 16;
    spotLightBufferOffset = pointLightBufferOffset + light_point.sizeInBuffer() * MAX_POINT_LIGHTS;
    directionalLightBufferOffset = spotLightBufferOffset + light_spot.sizeInBuffer() * MAX_SPOT_LIGHTS;
    // lights.push(new light_spot(
    //     gl,
    //     vec4.fromValues(0.1, 0.1, 0.1, 1.0),
    //     vec4.fromValues(0.2, 0.2, 0.8, 1.0),
    //     vec4.fromValues(0.5, 0.5, 0.5, 1.0),
    //     vec3.fromValues(0, 500, 0),
    //     vec3.fromValues(0, -1, 0),
    //     50
    // ))
    console.log("pushing new light");
    // for(let i = 0; i < 1; i++)
    // {
    //     lights.push(new light_point(
    //         gl,
    //         vec4.fromValues(0.1, 0.1, 0.1, 1.0),
    //         vec4.fromValues(i%3==0?0.8:0.2, i%3==1?0.8:0.2, i%3==2?0.8:0.2, 1.0),
    //         vec4.fromValues(0.5, 0.5, 0.5, 1.0),
    //         vec3.fromValues(0,20,0)
    //     ))
    // }
    lights.push(new light_directional(gl, vec4.fromValues(0.2, 0.2, 0.2, 1.0), vec4.fromValues(0.2, 0.2, 0.2, 1.0), vec4.fromValues(0.0, 0.0, 0.0, 1.0), vec3.normalize(vec3.fromValues(0, 0, 0), vec3.fromValues(-1.0, -1.0, -1.0))));
    // lights.push(new light_point(
    //     gl,
    //     vec4.fromValues(0.1, 0.1, 0.1, 1.0),
    //     vec4.fromValues(0.8, 0.2, 0.2, 1.0),
    //     vec4.fromValues(0.5, 0.5, 0.5, 1.0),
    //     vec3.fromValues(500,500,500)
    // ))
    // lights.push(new light_point(
    //     vec4.fromValues(0.1, 0.1, 0.1, 1.0),
    //     vec4.fromValues(0.8, 0.2, 0.2, 1.0),
    //     vec4.fromValues(0.5, 0.5, 0.5, 1.0),
    //     vec3.fromValues(0, 1, 10)
    // ))
    //addModel(modelName, vec3.fromValues(0, 0, 0), vec3.fromValues(270, 0, 0));
    //models.push(new model("de_dust2", gl, program, vec3.fromValues(0, 0, 0), vec3.fromValues(270, 0, 0), vec3.fromValues(0.05, 0.05, 0.05)));
    models.push(new model("brickCube", gl, program, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(75, 1, 75)));
    //addModel("survivalBackpack", vec3.fromValues(0, 500, 0), vec3.fromValues(0, 0, 0));
    // for(let i = 0; i < 2; i++)
    // {
    //     var rotx = (Math.random()*360)
    //     var roty = (Math.random()*360)
    //     var rotz = (Math.random()*360)
    //     var x = (Math.random()*40)-20
    //     var y = (Math.random()*40)-20
    //     var z = (Math.random()*40)-20
    //     addModel(modelName, vec3.fromValues(x, y, z), vec3.fromValues(rotx, roty, rotz));
    // }
    console.log("buffering lights");
    bufferLights(gl, program);
    console.log("done buffering lights");
    console.log("this many models: " + models.length);
    requestAnimationFrame(draw);
}
