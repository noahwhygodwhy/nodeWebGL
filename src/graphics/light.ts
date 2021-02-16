
import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'

import {MAX_POINT_LIGHTS, MAX_DIRECTIONAL_LIGHTS, MAX_SPOT_LIGHTS} from "./graphics.js"


var pointLightIndex = 0;
var directionalLightIndex = 0;
var spotLightIndex = 0;

var lubo:WebGLBuffer //buffer consists of three 4 byte ints, and then 3 variable sized light arrays sized to the maximum number of lights


export var pointLightBufferOffset = 0
export var spotLightBufferOffset = 0;
export var directionalLightBufferOffset = 0;



function bufferLights(gl:WebGL2RenderingContext)
{
    gl.bindBuffer(gl.UNIFORM_BUFFER, lubo);

    let totalLightBufferSize = (light_point.sizeInBuffer()*MAX_POINT_LIGHTS)+(light_spot.sizeInBuffer() * MAX_SPOT_LIGHTS) + (light_directional.sizeInBuffer()*MAX_DIRECTIONAL_LIGHTS);
    gl.bufferData(gl.UNIFORM_BUFFER, totalLightBufferSize, gl.DYNAMIC_DRAW);

}


export function resetLightIndexes()
{
    pointLightIndex = 0;
    directionalLightIndex = 0;
    spotLightIndex = 0;
}

export function setNrLights(gl:WebGLRenderingContext, program:WebGLProgram)
{
    gl.uniform1i(gl.getUniformLocation(program, "nrPointLights"), pointLightIndex)
    gl.uniform1i(gl.getUniformLocation(program, "nrSpotLights"), spotLightIndex)
    gl.uniform1i(gl.getUniformLocation(program, "nrDirectionalLights"), directionalLightIndex)
}

export class light
{
    
    ambient:vec4;
    diffuse:vec4;
    specular:vec4;

    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4)
    {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
    }
    use(gl:WebGLRenderingContext, program:WebGLProgram)
    {
        console.error("lights use should not be called");
    }
    static sizeInBuffer()
    {
        return 48;
    }
}

export class light_directional extends light
{
    direction:vec3;
    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4, direction:vec3)
    {
        super(gl, ambient, diffuse, specular);
        this.direction = direction;
    }
    use(gl:WebGLRenderingContext, program:WebGLProgram)
    {
        gl.uniform3fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].direction"), this.direction as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].ambient"), this.ambient as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].diffuse"), this.diffuse as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].specular"), this.specular as Float32Array)
        directionalLightIndex++;
    }
    static sizeInBuffer()
    {
        return 16+super.sizeInBuffer();
    }
    

}
export var lights: Array<light> = new Array<light>();

export class light_point extends light
{
    position:vec3;

    constant:number;
    linear:number;
    quadratic:number;

    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3)
    {
        super(gl, ambient, diffuse, specular);
        
        this.constant = 1.0;
        this.linear = 0.1;
        this.quadratic = 0.03; //yay constants
        this.position = position;

    }
    use(gl:WebGLRenderingContext, program:WebGLProgram)
    {

        gl.uniform3fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].position"), this.position as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].ambient"), this.ambient as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].diffuse"), this.diffuse as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].specular"), this.specular as Float32Array)

        gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].constant"), this.constant)
        gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].linear"), this.linear)
        gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].quadratic"), this.quadratic)
        pointLightIndex++;
    }
    static sizeInBuffer()
    {
        return 28+super.sizeInBuffer();
    }
}

export class light_spot extends light_point
{
    direction:vec3;
    angleDegrees:number;
    constructor(gl:WebGLRenderingContext, 
            ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3,
            direction:vec3,
            angleDegrees:number)
    {
        super(gl, ambient, diffuse, specular, position);
        this.direction = direction;
        this.angleDegrees = angleDegrees;
    }
    use(gl:WebGLRenderingContext, program:WebGLProgram)
    {
        
        gl.uniform3fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].position"), this.position as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].ambient"), this.ambient as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].diffuse"), this.diffuse as Float32Array)
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].specular"), this.specular as Float32Array)
        gl.uniform3fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].direction"), this.direction as Float32Array)

        gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].constant"), this.constant)
        gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].linear"), this.linear)
        gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].quadratic"), this.quadratic)
        gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].phi"), Math.cos(common.toRadian(this.angleDegrees)))
        spotLightIndex++;
    }
    static sizeInBuffer()
    {
        return 20+super.sizeInBuffer();
    }
    bufferIt()
    {

    }
}


