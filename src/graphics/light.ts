
import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'




var pointLightIndex = 0;
var directionalLightIndex = 0;
var spotLightIndex = 0;


export function resetLightIndexes()
{
    pointLightIndex = 0;
    directionalLightIndex = 0;
    spotLightIndex = 0;
}

export function setNrLights(gl:WebGLRenderingContext, program:WebGLProgram)
{
    gl.uniform1i(gl.getUniformLocation(program, "nrPointLights"), pointLightIndex+1)
    gl.uniform1i(gl.getUniformLocation(program, "nrSpotLights"), spotLightIndex+1)
    gl.uniform1i(gl.getUniformLocation(program, "nrDirectionalLights"), directionalLightIndex+1)


}

//idk if i actually need this
export enum lightTypes
{
    POINT,
    DIRECTIONAL,
    SPOT,
    AMBIENT,
    AREA,//TODO:
    OBJECT,//TODO:
}

export class light
{
    
    ambient:vec4;
    diffuse:vec4;
    specular:vec4;

    constructor(ambient:vec4, 
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
}

export class light_directional extends light
{
    direction:vec3;
    constructor(ambient:vec4, 
            diffuse:vec4, 
            specular:vec4, direction:vec3)
    {
        super(ambient, diffuse, specular);
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
}

export class light_point extends light
{
    position:vec3;

    constant:number;
    linear:number;
    quadratic:number;

    constructor(ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3)
    {
        super(ambient, diffuse, specular);
        
        this.constant = 1;
        this.linear = 0.1;
        this.quadratic = 0.01; //yay constants
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
}

export class light_spot extends light_point
{
    direction:vec3;
    angleDegrees:number;
    constructor(ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3,
            direction:vec3,
            angleDegrees:number)
    {
        super(ambient, diffuse, specular, position);
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
        gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].angleRadians"), common.toRadian(this.angleDegrees))
        spotLightIndex++;
    }
}


