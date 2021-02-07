//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements

//REQUIRES ajax via jQuery

//import {common, mat4, vec3} from "./gl-matrix-es6.js";
import {model} from "./model.js"

import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'
import { request } from "http"

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


//TODO: multiple light array https://stackoverflow.com/questions/13476294/accessing-a-structure-in-vertex-shader-from-the-code-in-webgl


out vec4 FragColor;
void main()
{
    //ambient calculation
    //vec3 ambient = light_ambient.xyz*color_ambient;
    vec4 ambientResult = light_ambient*texture(mat_diffuse, frag_uv);

    //diffuse calculation
    vec3 normal = normalize(frag_normal);
    vec3 lightDir = normalize(light_position-frag_pos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light_diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0f)*texture(mat_diffuse, frag_uv);

    vec3 viewDir = normalize(viewPos-frag_pos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = vec3(light_specular * spec * vec4(color_specular, 1.0f));
    vec4 specularResult =  vec4(specular, 1.0f) * texture(mat_specular, frag_uv);


    vec4 result = diffuseResult + ambientResult + specularResult;

    
    FragColor = result;



    // failure for blinn test
    //vec3 normalizedLightDir = normalize(-lightDirection);
    //vec3 normal = normalize(frag_normal);
    

    //vec4 finalSpecColor = texture(specular, frag_uv) + vec4(color_specular, 1.0f);
    //vec4 finalDiffuseColor = texture(diffuse, frag_uv) + vec4(color_diffuse, 1.0f);


    //float lambertCoef = dot(normalizedLightDir, normal);

    //vec4 Ia = light_ambient * vec4(color_ambient, 1.0f); //TODO maybe diffuse texture here instead?

    //vec4 Id = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    //vec4 Is = vec4(0.0f, 0.0f, 0.0f, 1.0f);

    //if(lambertCoef > 0.0)
    //{
    //     Id = light_diffuse * texture(diffuse, frag_uv) * lambertCoef;
    //     vec3 E = normalize(eyeVector);
    //     vec3 R = reflect(normalizedLightDir, normal);
    //     float spec = pow(max(dot(R, E), 0.0), shininess/30.0f);
    //     Is = light_specular * texture(specular, frag_uv) * spec;
    // }
    //FragColor = vec4(vec3(Ia + Id + Is), 1.0);


    //float light = dot(normal, -normalizedLightDir);


    //FragColor = texture(diffuse, frag_uv);

    //FragColor = (texture(diffuse, frag_uv)*0.8) + (0.2*lightColor);

    //FragColor.rgb *= light;

    //FragColor.rgb *= texture(diffuse, frag_uv);


    //FragColor = vec4(1,0,0,1);
    //FragColor = vec4(frag_uv.x, frag_uv.y, 0, 1);
}
`

var gl : WebGL2RenderingContext
var program : WebGLProgram
var models : Array<model>
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
    models = new Array<model>()

    projection = mat4.create()
    view = mat4.create()

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW)

    gl.useProgram(program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


}
function draw(cT:number)
{
    //console.log(cT)
    dT = cT-pT;

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
    camX = -5
    camZ = -5

    var camPos = vec3.fromValues(camX, camY, camZ);

    mat4.lookAt(view, [camX, camY, camZ], [0, 0, 0], [0, 1, 0])
    //mat4.invert(view, view);


    //@ts-ignore
    gl.uniformMatrix4fv(viewLoc, false, view); //TODO: if it doesn't work this is the culprit (as float32list) 
    


    var projectionLoc = gl.getUniformLocation(program, "projection")
    mat4.perspective(projection, common.toRadian(60), gl.canvas.width / gl.canvas.height, 0.1, 2000)
    //@ts-ignore
    gl.uniformMatrix4fv(projectionLoc, false, projection);


    /*var lightColor = vec4.fromValues(0.8, 0.8, 1.0, 1)
    var lightDirection = vec3.fromValues(Math.cos(cT/2000), 1, Math.sin(cT/2000))

    var lightColorLoc = gl.getUniformLocation(program, "lightColor")

    var lightDirectionLoc = gl.getUniformLocation(program, "lightDirection")
    vec4.normalize(lightColor, lightColor)
    gl.uniform4fv(lightColorLoc, lightColor as Float32Array)
    
    vec3.normalize(lightDirection, lightDirection)

    gl.uniform3fv(lightDirectionLoc, lightDirection as Float32Array)*/


    var viewPos = vec3.fromValues(camX, camY, camZ);
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), viewPos as Float32Array)

    var lightPos = vec3.fromValues(Math.sin(cT/1000)*10, 0, Math.cos(cT/1000)*10);
    gl.uniform3fv(gl.getUniformLocation(program, "light_position"), lightPos as Float32Array)
    //var lightColor = vec3.fromValues(1.0, 1.0, 1.0);
    //gl.uniform3fv(gl.getUniformLocation(program, "light_color"), lightColor as Float32Array)

    var ambientLight = vec4.fromValues(0.1, 0.1, 0.1, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "light_ambient"), ambientLight as Float32Array)

    var diffuseLight = vec4.fromValues(0.8, 0.8, 0.8, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "light_diffuse"), diffuseLight as Float32Array)

    var specularLight = vec4.fromValues(0.5, 0.5, 0.5, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "light_specular"), specularLight as Float32Array)





    models.forEach(m => m.draw(gl, program, view, dT))

    requestAnimationFrame(draw);
}
function addModel(name:string, position?:any)
{
    models.push(new model(name, gl, program))
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

    var vertShader = makeShader(fragSource, gl.FRAGMENT_SHADER)
    var fragShader = makeShader(vertSource, gl.VERTEX_SHADER)

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
    var modelName = "survival backpack"
    //modelName = "brickCube"

    //init stuff
    var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    initializeRenderer(canvas)


    canvas.width = window.innerWidth*0.95
    canvas.height = window.innerHeight*0.95

    //canvas.style.width = String(window.innerWidth*0.95)+"px";
    //canvas.style.height = String(window.innerHeight*0.95)+"px";
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    window.addEventListener('resize', function()
    {
        //canvas.style.width = String(window.innerWidth*0.95)+"px";
        //canvas.style.height = String(window.innerHeight*0.95)+"px";
        canvas.width = window.innerWidth*0.95
        canvas.height = window.innerHeight*0.95
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });




    

    //var transform = new mat4;

    addModel(modelName)

    requestAnimationFrame(draw);

}

