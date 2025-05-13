// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var Rx = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), -Math.sin(rotationX), 0,
		0, Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];
	// Rotation around the y axis
	var Ry = [
		Math.cos(rotationY), 0, Math.sin(rotationY), 0,
		0, 1, 0, 0,
		-Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var mv = trans;
	mv = MatrixMult( mv, Rx );
	mv = MatrixMult( mv, Ry );
	return mv;
}


// [TO-DO] Complete the implementation of the following class.
// Vertex shader source code
var meshVS = `
	attribute vec3 pos;
    attribute vec2 texCoord;
    attribute vec3 normal;
    uniform mat4 mvp;
    uniform mat3 matrixNormal;
    uniform bool swapYZ;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    void main() {
        vec3 position = pos;
        if (swapYZ)
            position = vec3(position.x, position.z, position.y);
        gl_Position = mvp * vec4(position, 1.0);
        v_texCoord = texCoord;
        v_normal = normalize(matrixNormal * normal);
    }
`;
// Fragment shader source code
var meshFS = `
    precision mediump float;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    uniform sampler2D sampler;
    uniform bool showTex;
    uniform vec3 lightDir;
    uniform float shininess;
    void main() {
        vec3 N = normalize(v_normal);
        vec3 L = normalize(lightDir);
        float NdotL = max(dot(N, L), 0.0);
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);
        float NdotH = max(dot(N, H), 0.0);
        float specular = pow(NdotH, shininess);

        vec3 Kd = showTex ? texture2D(sampler, v_texCoord).rgb : vec3(1.0, 1.0, 1.0);
        vec3 Ks = vec3(1.0, 1.0, 1.0);

        vec3 color = Kd * NdotL + Ks * specular;
        gl_FragColor = vec4(color, 1.0);
    }
`;


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram(meshVS, meshFS);
				
		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.swap = gl.getUniformLocation(this.prog, 'swapYZ');
        this.showTex = gl.getUniformLocation(this.prog, 'showTex');
        this.sampTex = gl.getUniformLocation(this.prog, 'sampler');
        this.lightDirU = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessU = gl.getUniformLocation(this.prog, 'shininess');
        this.matrixNormalU = gl.getUniformLocation(this.prog, 'matrixNormal');
		// Get the ids of the vertex attributes in the shaders
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');
        this.normal = gl.getAttribLocation(this.prog, 'normal');
		// Create the buffer objects
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.normbuffer = gl.createBuffer();
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.swapYZBool = false;
        this.showTextureBool = true;
        this.lightDir = [0, 0, 1];
        this.shininess = 1.0;
    }

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		this.swapYZBool = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix3fv(this.matrixNormalU, false, matrixNormal);
        gl.uniform1i(this.swap, this.swapYZBool);
        gl.uniform1i(this.showTex, this.showTextureBool);
        gl.uniform3fv(this.lightDirU, this.lightDir);
        gl.uniform1f(this.shininessU, this.shininess);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.sampTex, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		// Set some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.useProgram(this.prog);
		gl.uniform1i(this.sampTex, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		this.showTextureBool = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		this.lightDir = [x, y, z];
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		this.shininess = shininess;
	}
}
