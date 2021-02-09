//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements

//REQUIRES ajax via jQuery

//import {common, mat4, vec3} from "./gl-matrix-es6.js";
import {model} from "./model.js"

import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'
//import { request } from "http"
import { light, light_point, light_directional, light_spot, resetLightIndexes, setNrLights } from "./light.js"


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


//textures
uniform sampler2D diffuse;
uniform sampler2D specular;
uniform sampler2D height;

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
    frag_pos = vec3(model*vec4(aPos, 1.0f));
    //eyeVector = -vec3(clipSpaceV.xyz);

}
`
var fragSource = `#version 300 es

precision mediump float;

#define MAX_POINT_LIGHTS 64
#define MAX_SPOT_LIGHTS 64
#define MAX_DIRECTIONAL_LIGHTS 8

uniform int nrPointLights;
uniform int nrSpotLights;
uniform int nrDirectionalLights;

uniform sampler2D mat_diffuse;
uniform sampler2D mat_specular;
uniform sampler2D mat_height;

uniform vec3 color_diffuse;
uniform vec3 color_specular;
uniform vec3 color_ambient;

uniform bool hasDiffuse;
uniform bool hasSpecular;
uniform bool hasHeight;

uniform vec4 light_ambient;
uniform vec4 light_diffuse;
uniform vec4 light_specular;
uniform float shininess;

uniform vec3 lightDirection;

uniform vec3 viewPos;

uniform vec3 light_position;

in vec3 frag_normal;
in vec3 frag_pos;
in vec2 frag_uv;

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
    float constant;
    float linear;
    float quadratic;
    vec3 direction;
    vec3 angleRadians;
};

uniform light_point light_points[MAX_POINT_LIGHTS];
uniform light_spot light_spots[MAX_SPOT_LIGHTS];
uniform light_directional light_directionals[MAX_DIRECTIONAL_LIGHTS];


//TODO: multiple light array https://stackoverflow.com/questions/13476294/accessing-a-structure-in-vertex-shader-from-the-code-in-webgl


out vec4 FragColor;


// vec4 calcSpotLight(light_spot light)
// {

// }

vec4 calcPointLight(light_point light)
{
    vec4 ambientResult = light_ambient*texture(mat_diffuse, frag_uv);

    vec3 normal = normalize(frag_normal);
    vec3 lightDir = normalize(light.position-frag_pos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0f)*texture(mat_diffuse, frag_uv);

    vec3 viewDir = normalize(viewPos-frag_pos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = vec3(light.specular * spec * vec4(color_specular, 1.0f));
    vec4 specularResult =  vec4(specular, 1.0f) * texture(mat_specular, frag_uv);

    float distance = length(light.position - frag_pos);
    float attenuation = 1.0/(light.constant + (light.linear*distance)+(light.quadratic*distance*distance));

    return (ambientResult+diffuseResult+specularResult)*attenuation;
}

void main()
{

    vec4 result = vec4(0.0f);

    for(int i = 0; i < nrPointLights; i++)
    {
        result+=calcPointLight(light_points[i]);
    }
    // for(int i = 0; i < nrSpotLights; i++)
    // {
    //     result+= calcSpotLight(light_spots[i]);
    // }
    
    FragColor = result;

}
`

var gl : WebGL2RenderingContext
var program : WebGLProgram
var models : Array<model>
var lights: Array<light>
var projection:mat4
var view:mat4


var pT:number
var dT:number

function initializeRenderer(canvas:HTMLCanvasElement)
{
    pT = 0;
    dT = 0;

    var glMaybe = canvas.getContext("webgl2");
    
    if(glMaybe === null)
    {
        console.log("no webgl :(")
        throw("No webGL")
    }
    gl = glMaybe
    var x = gl.createTexture()
    program = makeProgram()
    models = new Array<model>();
    lights = new Array<light>();
    projection = mat4.create()
    view = mat4.create()

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW)

    gl.useProgram(program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


}

const fpsElem = document.querySelector("#fps");


var frameCount = 60;
var frameTimes = new Array<number>(frameCount);
var frameIndex = 0;

function draw(cT:number)
{
    //console.log(cT)
    dT = cT-pT;

    pT = cT;
    var fps = 1.0/(dT/1000.0)


    if(fpsElem !== null)
    {
        frameTimes[frameIndex] = fps
        frameIndex = (frameIndex+1)%frameCount

        console.log("dt: " + dT);
        console.log("fps: " + fps);
        
        let avg = 0
        frameTimes.forEach(val => {avg+=val})
        avg /= frameCount

        fpsElem.textContent = avg.toFixed(2);
    }


    //console.log("frame")
    
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program)

    var viewLoc = gl.getUniformLocation(program, "view")


    var camX = -Math.sin(cT/1000)*5
    var camZ = -Math.cos(cT/1000)*5
    var camY = 1
    camY = 0
    //camX = -25
    //camZ = -25

    //var camPos = vec3.fromValues(camX, camY, camZ);

    mat4.lookAt(view, [camX, camY, camZ], [0, 0, 0], [0, 1, 0])


    gl.uniformMatrix4fv(viewLoc, false, view as Float32Array); 
    


    var projectionLoc = gl.getUniformLocation(program, "projection")
    mat4.perspective(projection, common.toRadian(90), gl.canvas.width / gl.canvas.height, 0.1, 2000)
  
    gl.uniformMatrix4fv(projectionLoc, false, projection as Float32Array);

    var viewPos = vec3.fromValues(camX, camY, camZ);
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), viewPos as Float32Array);
    



    (lights[0] as light_point).position = vec3.fromValues(Math.sin(cT/1000)*10,0,0)

    resetLightIndexes()
    lights.forEach(l => l.use(gl, program))
    setNrLights(gl, program);
    


    models.forEach(m => m.draw(gl, program, view, dT))

    requestAnimationFrame(draw);
}
function addModel(name:string, position?:vec3, rotation?:vec3)
{
    models.push(new model(name, gl, program, position, rotation))
}
    

var canvasID = "c"

window.onload = main;






function makeShader(source:any, type:any) : WebGLShader | null
{
    var shader = gl.createShader(type)

    if(shader === null)
    {
        console.log("error making shader")
        return null
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if(success)
    {
        return shader
    }
    
    console.log("problem creating shader\n");
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null
}

function makeProgram(): WebGLProgram
{
    var program = gl.createProgram();

    if(program === null)
    {
        console.log("error making shader program")
        throw("error")
    }



    var fragShader = makeShader(fragSource, gl.FRAGMENT_SHADER)
    var vertShader = makeShader(vertSource, gl.VERTEX_SHADER)

    if(vertShader === null || fragShader === null)
    {
        throw("error")
    }


    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.log("problem creating program\n");
    gl.deleteProgram(program);
    throw("error")
}


function main()
{
    var modelName = "survivalBackpack"
    //modelName = "brickCube"

    //init stuff
    var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    initializeRenderer(canvas)


    canvas.width = window.innerWidth*0.95
    canvas.height = window.innerHeight*0.95

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    window.addEventListener('resize', function()
    {
        canvas.width = window.innerWidth*0.95
        canvas.height = window.innerHeight*0.95
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });




    

    lights.push(new light_point(
        vec4.fromValues(0.1, 0.1, 0.1, 1.0),
        vec4.fromValues(0.2, 0.2, 0.8, 1.0),
        vec4.fromValues(0.5, 0.5, 0.5, 1.0),
        vec3.fromValues(0, 0, 0)
    ))

    lights.push(new light_point(
        vec4.fromValues(0.1, 0.1, 0.1, 1.0),
        vec4.fromValues(0.8, 0.2, 0.2, 1.0),
        vec4.fromValues(0.5, 0.5, 0.5, 1.0),
        vec3.fromValues(0, 1, 10)
    ))

    addModel(modelName)

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

    requestAnimationFrame(draw);

}

