
import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'


export class light
{

    position:vec3;
    ambient:vec3;
    diffuse:vec3;
    specular:vec3;

    constant:number;
    linear:number;
    quadratic:number;

    constructor(position:vec3, range:number, ambient:vec3 = vec3.fromValues(0,0,0), diffuse:vec3 = vec3.fromValues(0,0,0), specular:vec3 = vec3.fromValues(0,0,0))
    {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.constant = 1;
        this.linear = 0.1;
        this.quadratic = 0.01;


    }

}

export class light_point
{

}


