import { vec3,vec4} from "./gl-matrix-es6.js";



var loadedTextures = new Map<string,WebGLTexture>()



export function dirtyVec4(i:vec3):vec4
{
    return vec4.fromValues(i[0], i[1], i[2], 1.0);
}

function makeTexture(gl:WebGL2RenderingContext ,modelName:string, imageName:string):WebGLTexture
{
    
    var maybeT = loadedTextures.get(modelName+"-"+imageName)
    if(maybeT != undefined)
    {
        return maybeT
    }

    const pixel = new Uint8Array([255, 255, 0, 255]);

    var t:WebGLTexture;
    var maybeTTwo = gl.createTexture()
    if(maybeTTwo === null)
    {
        throw("problem creating texture")
    }
    t = maybeTTwo

    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        pixel);

    const image = new Image()

    console.log("setting up image")
    //console.log("image src: "+ image.src)
    image.onload = function()
    {
        console.log("image loaded");
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
        gl.generateMipmap(gl.TEXTURE_2D);
        loadedTextures.set(modelName+"-"+imageName, t)
    }

    image.src = "models/"+modelName + "/" + imageName
    //console.log("src from: " + "models/"+modelName + "/" + imageName)
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
    texNum:number;
    mat_diffuse: WebGLTexture|null = null
    mat_specular:WebGLTexture|null = null
    mat_height:WebGLTexture|null = null
    refraction:number = 0 //ignore unless raytracing
    opacity:number = 1//obv
    shininess:number = 0//shininess if phong, exponent of phong specular equation
    color_specular:vec3 = vec3.fromValues(0, 0, 0)
    color_diffuse:vec3 = vec3.fromValues(0, 0, 0)
    color_ambient:vec3 = vec3.fromValues(0, 0, 0)
    shadingMode:shadingMode = shadingMode.flat//http://assimp.sourceforge.net/lib_html/material_8h.html#a93e23e0201d6ed86fb4287e15218e4cf
    ubo:WebGLBuffer|null;

    constructor(gl:WebGL2RenderingContext, program:WebGLProgram, matJson:any, modelName:string)
    {
        this.texNum = 0;
        //console.log("making a material")
        for(let i = 0; i < matJson.properties.length; i++)
        {
            //console.log("on property " + i)
            var prop = matJson.properties[i]
            //console.log("they key is : " + prop.key);
            switch(prop.key)
            {
                case "?mat.name":
                    break;
                case "$tex.file":
                    //console.log("material prop is a tex file");
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
        


        this.ubo = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
        gl.bufferData(gl.UNIFORM_BUFFER, 64, gl.STATIC_DRAW);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0,  new Float32Array(dirtyVec4(this.color_diffuse))); //TODO vec3 is broke, disect it
        gl.bufferSubData(gl.UNIFORM_BUFFER, 16, new Float32Array(dirtyVec4(this.color_specular)));
        gl.bufferSubData(gl.UNIFORM_BUFFER, 32, new Float32Array(dirtyVec4(this.color_ambient)));
        gl.bufferSubData(gl.UNIFORM_BUFFER, 48, new Float32Array(this.shininess));
        gl.bufferSubData(gl.UNIFORM_BUFFER, 52, new Float32Array([this.mat_diffuse != null?1:0]));
        gl.bufferSubData(gl.UNIFORM_BUFFER, 56, new Float32Array([this.mat_specular != null?1:0]));
        gl.bufferSubData(gl.UNIFORM_BUFFER, 60, new Float32Array([this.mat_height != null?1:0]));
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    }
    use(gl:WebGL2RenderingContext, program:WebGLProgram)
    {
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
        var matUniformIndex = gl.getUniformBlockIndex(program, "Material")
        //console.log("matuniformindex: " + matUniformIndex)
        gl.uniformBlockBinding(program, matUniformIndex, 0)
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo)
        //gl.bindBufferBase(gl.UNIFORM_BUFFER, matUniformIndex, this.ubo)
        



        // gl.uniform1i(gl.getUniformLocation(program, "hasDiffuse"), this.mat_diffuse != null?1:0)
        // gl.uniform1i(gl.getUniformLocation(program, "hasSpecular"), this.mat_specular != null?1:0)
        // gl.uniform1i(gl.getUniformLocation(program, "hasHeight"), this.mat_height != null?1:0)

        this.texNum = 0;

        // gl.uniform3fv(gl.getUniformLocation(program, "color_diffuse"), this.color_diffuse as Float32Array)
        // gl.uniform3fv(gl.getUniformLocation(program, "color_specular"), this.color_specular as Float32Array)
        // gl.uniform3fv(gl.getUniformLocation(program, "color_ambient"), this.color_ambient as Float32Array)

        // gl.uniform1f(gl.getUniformLocation(program, "shininess"), this.shininess)


        if(this.mat_diffuse != null)
        {
            //var loc = gl.getUniformLocation(program, "diffuse")
            //gl.uniform1i(loc, this.texNum)
            gl.activeTexture(gl.TEXTURE0+this.texNum);
            gl.bindTexture(gl.TEXTURE_2D, this.mat_diffuse);
            this.texNum++
        }
        if(this.mat_specular != null)
        {
            //var loc = gl.getUniformLocation(program, "specular")
            //gl.uniform1i(loc, this.texNum)
            gl.activeTexture(gl.TEXTURE0+this.texNum);
            gl.bindTexture(gl.TEXTURE_2D, this.mat_specular);
            this.texNum++
        }
        if(this.mat_height != null)
        {
            //var loc = gl.getUniformLocation(program, "height")
            //gl.uniform1i(loc, this.texNum)
            gl.activeTexture(gl.TEXTURE0+this.texNum);
            gl.bindTexture(gl.TEXTURE_2D, this.mat_height);
            this.texNum++
        }
        
        
        //TODO rest of the properties to the shader, maybe use a specific shader depending on what's available? idk
    }
    unuse(gl:WebGL2RenderingContext, program:WebGLProgram)
    {
        for(let i = 0; i < this.texNum; i++)
        {
            gl.activeTexture(gl.TEXTURE0+this.texNum)  
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }
}

