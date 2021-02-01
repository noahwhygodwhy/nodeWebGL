//https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements

//REQUIRES ajax via jQuery

//import {common, mat4, vec3} from "./gl-matrix-es6.js";
import {model} from "./model.js"

import {mat4, common, vec3} from './gl-matrix-es6.js'

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
`
var fragSource = `#version 300 es

precision mediump float;

in vec2 frag_uv;
out vec4 FragColor;
void main()
{
    FragColor = vec4(frag_uv.x, frag_uv.y, 0, 1);
}
`

class renderer
{
    gl : WebGL2RenderingContext
    program : WebGLProgram
    models : Array<model>
    projection:mat4
    view:mat4

    constructor(canvas:HTMLCanvasElement)
    {
        

        var glMaybe = canvas.getContext("webgl2");
        
        if(glMaybe === null)
        {
            console.log("no webgl :(")
            throw("No webGL")
        }
        this.gl = glMaybe
        var x = this.gl.createTexture()
        this.program = makeProgram(this)
        this.models = new Array<model>()

        this.projection = mat4.create()

        mat4.identity(this.projection)

        this.view = mat4.create()


    }
    initialize()
    {
        this.gl.useProgram(this.program)
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);


    }
    draw()
    {
        
        this.gl.useProgram(this.program)

        var viewLoc = this.gl.getUniformLocation(this.program, "view")
        var projectionLoc = this.gl.getUniformLocation(this.program, "projection")

        var view = mat4.create()

        var projection = mat4.create()

        this.gl.uniformMatrix4fv(viewLoc, false, this.view as Float32List); //TODO: if it doesn't work this is the culprit (as float32list) 
        this.gl.uniformMatrix4fv(projectionLoc, false, this.projection as Float32List);

        console.log("there are this many models: " + this.models.length)

        this.models.forEach(m => m.draw(this.gl, this.program))

        

    }
    addModel(name:string, position?:any)
    {
        console.log(position)
        this.models.push(new model(name, this.gl, this.program))
    }
    
}

var canvasID = "c"

declare var r:renderer

window.onload = init;





function makeShader(r:renderer, source:any, type:any) : WebGLShader | null
{
    var shader = r.gl.createShader(type)

    if(shader === null)
    {
        console.log("error making shader")
        return null
    }

    r.gl.shaderSource(shader, source)
    r.gl.compileShader(shader);
    var success = r.gl.getShaderParameter(shader, r.gl.COMPILE_STATUS)
    if(success)
    {
        return shader
    }
    
    console.log("problem creating shader\n");
    console.log(r.gl.getShaderInfoLog(shader));
    r.gl.deleteShader(shader);
    return null
}

function makeProgram(r:renderer): WebGLProgram
{
    var program = r.gl.createProgram();

    if(program === null)
    {
        console.log("error making shader program")
        throw("error")
    }

    var vertShader = makeShader(r, fragSource, r.gl.FRAGMENT_SHADER)
    var fragShader = makeShader(r, vertSource, r.gl.VERTEX_SHADER)

    if(vertShader === null || fragShader === null)
    {
        throw("error")
    }

    r.gl.attachShader(program, vertShader)
    r.gl.attachShader(program, fragShader)
    r.gl.linkProgram(program);
    var success = r.gl.getProgramParameter(program, r.gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.log("problem creating program\n");
    r.gl.deleteProgram(program);
    throw("error")
}

function resizeCanvas()
{
    var canvas = document.getElementById(canvasID)

    if(canvas === null)
    {
        return
    }

    console.log("resizing canvas")

    console.log("width:"+String(window.innerWidth*0.95)+"px")

    canvas.style.width = String(window.innerWidth*0.95)+"px";
    canvas.style.height = String(window.innerHeight*0.95)+"px";
}

function init()
{
    var modelName = "survival backpack"

    //init stuff
    var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas);

    var r = new renderer(canvas)


    

    //var transform = new mat4;

    r.addModel(modelName)


    r.draw()

}

