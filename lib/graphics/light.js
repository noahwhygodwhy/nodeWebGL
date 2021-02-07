import { vec3 } from './gl-matrix-es6.js';
export class light {
    constructor(position, range, ambient = vec3.fromValues(0, 0, 0), diffuse = vec3.fromValues(0, 0, 0), specular = vec3.fromValues(0, 0, 0)) {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.constant = 1;
        this.linear = 0.1;
        this.quadratic = 0.01;
    }
}
export class light_point {
}
