import { vec3 } from "./gl-matrix-es6";



var loadedTextures = new Map<string,WebGLTexture>()


function makeTexture(gl:any ,modelName:string, imageName:string):WebGLTexture
{

    var maybeT = loadedTextures.get(modelName+"-"+imageName)
    if(maybeT != undefined)
    {
        return maybeT
    }

    const pixel = new Uint8Array([255, 255, 0, 255]);

    var t = gl.createTexture()
    gl.bindTeture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        pixel);

    const image = new Image()

    image.src = "/models/"+modelName + "/" + imageName

    image.onload = function()
    {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
        gl.generateMipmap(gl.TEXTURE_2D);
        return loadedTextures.set(modelName+"-"+imageName, t)
    }
    return t;

}


enum shadingMode //TODO each of these should relate to a different actual frag (and maybe vert?) shader
{                //don't worry about applying this until you start writing more advanced shaders
    flat,
    gouraud,
    phong,
    blinn,
    toon,
    orennayar,
    minnaert,
    cooktorrance,
    noshading,
    fresnel,
}

export class material
{
    mat_diffuse:any = null
    mat_specular:any = null
    mat_height:any = null
    refraction:number = 0 //ignore unless raytracing
    opacity:number = 1//obv
    shininess:number = 0//shininess if phong, exponent of phong specular equation
    color_specular:vec3 = vec3.fromValues(0, 0, 0)
    color_diffuse:vec3 = vec3.fromValues(0, 0, 0)
    color_ambient:vec3 = vec3.fromValues(0, 0, 0)
    shadingMode:shadingMode = shadingMode.flat//http://assimp.sourceforge.net/lib_html/material_8h.html#a93e23e0201d6ed86fb4287e15218e4cf


    constructor(gl:WebGL2RenderingContext, matJson:any, modelName:string)
    {

        for(let i = 0; i < matJson.properties; i++)
        {
            var prop = matJson.properties[i]
            switch(prop.key)
            {
                case "$tex.file":
                    switch(prop.semantic)
                    {
                        case 1:
                            this.mat_diffuse = makeTexture(gl, modelName, prop.value)
                            break
                        case 2:
                            this.mat_specular = makeTexture(gl, modelName, prop.value)
                            break;
                        case 5:
                            this.mat_height = makeTexture(gl, modelName, prop.value)
                            break;
                        default:
                            throw("not handling a texture: " + prop.semantic + " " + prop.key)
                    }
                    break;
                case "$mat.refracti":
                    this.refraction = prop.value
                    break;
                case "$mat.opacity":
                    this.opacity = prop.value
                    break;
                case "$mat.shininess":
                    this.shininess = prop.value
                    break;
                case "$clr.specular":
                    this.color_specular = vec3.fromValues(prop.value[0], prop.value[1], prop.value[2])
                    break;
                case "$clr.diffuse":
                    this.color_diffuse = vec3.fromValues(prop.value[0], prop.value[1], prop.value[2])
                    break;
                case "$clr.ambient":
                    this.color_ambient = vec3.fromValues(prop.value[0], prop.value[1], prop.value[2])
                    break;
                case "$mat.shadingm":
                    this.shadingMode = prop.value
                    break;
                default:
                    throw("not handling " + prop.key)
            }
        }
        //switch case

        //retreive the textures,
        //place the values
        //maybe have a .use()?
    }
    use(gl:WebGL2RenderingContext, program:WebGLProgram)
    {
        //TODO
    }
}