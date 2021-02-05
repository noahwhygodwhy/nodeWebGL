
import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'


export class light
{
    position:vec3;
    color:vec3;

    constructor(position:vec3, color:vec3)
    {
        this.position = position;
        this.color = color;
    }

}