import { common } from './gl-matrix-es6.js';
var pointLightIndex = 0;
var directionalLightIndex = 0;
var spotLightIndex = 0;
export function resetLightIndexes() {
    pointLightIndex = 0;
    directionalLightIndex = 0;
    spotLightIndex = 0;
}
export function setNrLights(gl, program) {
    gl.uniform1i(gl.getUniformLocation(program, "nrPointLights"), pointLightIndex + 1);
    gl.uniform1i(gl.getUniformLocation(program, "nrSpotLights"), spotLightIndex + 1);
    gl.uniform1i(gl.getUniformLocation(program, "nrDirectionalLights"), directionalLightIndex + 1);
}
//idk if i actually need this
export var lightTypes;
(function (lightTypes) {
    lightTypes[lightTypes["POINT"] = 0] = "POINT";
    lightTypes[lightTypes["DIRECTIONAL"] = 1] = "DIRECTIONAL";
    lightTypes[lightTypes["SPOT"] = 2] = "SPOT";
    lightTypes[lightTypes["AMBIENT"] = 3] = "AMBIENT";
    lightTypes[lightTypes["AREA"] = 4] = "AREA";
    lightTypes[lightTypes["OBJECT"] = 5] = "OBJECT";
})(lightTypes || (lightTypes = {}));
export class light {
    constructor(ambient, diffuse, specular) {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
    }
    use(gl, program) {
        console.error("lights use should not be called");
    }
}
export class light_directional extends light {
    constructor(ambient, diffuse, specular, direction) {
        super(ambient, diffuse, specular);
        this.direction = direction;
    }
    use(gl, program) {
        gl.uniform3fv(gl.getUniformLocation(program, "light_directionals[" + directionalLightIndex + "].direction"), this.direction);
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals[" + directionalLightIndex + "].ambient"), this.ambient);
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals[" + directionalLightIndex + "].diffuse"), this.diffuse);
        gl.uniform4fv(gl.getUniformLocation(program, "light_directionals[" + directionalLightIndex + "].specular"), this.specular);
        directionalLightIndex++;
    }
}
export class light_point extends light {
    constructor(ambient, diffuse, specular, position) {
        super(ambient, diffuse, specular);
        this.constant = 1;
        this.linear = 0.1;
        this.quadratic = 0.01; //yay constants
        this.position = position;
    }
    use(gl, program) {
        gl.uniform3fv(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].position"), this.position);
        gl.uniform4fv(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].ambient"), this.ambient);
        gl.uniform4fv(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].diffuse"), this.diffuse);
        gl.uniform4fv(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].specular"), this.specular);
        gl.uniform1f(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].constant"), this.constant);
        gl.uniform1f(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].linear"), this.linear);
        gl.uniform1f(gl.getUniformLocation(program, "light_points[" + pointLightIndex + "].quadratic"), this.quadratic);
        pointLightIndex++;
    }
}
export class light_spot extends light_point {
    constructor(ambient, diffuse, specular, position, direction, angleDegrees) {
        super(ambient, diffuse, specular, position);
        this.direction = direction;
        this.angleDegrees = angleDegrees;
    }
    use(gl, program) {
        gl.uniform3fv(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].position"), this.position);
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].ambient"), this.ambient);
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].diffuse"), this.diffuse);
        gl.uniform4fv(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].specular"), this.specular);
        gl.uniform3fv(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].direction"), this.direction);
        gl.uniform1f(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].constant"), this.constant);
        gl.uniform1f(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].linear"), this.linear);
        gl.uniform1f(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].quadratic"), this.quadratic);
        gl.uniform1f(gl.getUniformLocation(program, "light_spots[" + spotLightIndex + "].angleRadians"), common.toRadian(this.angleDegrees));
        spotLightIndex++;
    }
}
