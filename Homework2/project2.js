// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Scale matrix
	let S = new Array(9);
	S[0] = scale;
	S[1] = 0;
	S[2] = 0;
	S[3] = 0;
	S[4] = scale;
	S[5] = 0;
	S[6] = 0;
	S[7] = 0;
	S[8] = 1;
	
	let theta = rotation* Math.PI/180; // Need to convert to radians
	let sinTheta = Math.sin(theta);
	let cosTheta = Math.cos(theta);
	
	// Rotation matrix
	let R = new Array(9);
	R[0] = cosTheta;
	R[1] = sinTheta;
	R[2] = 0;
	R[3] = - sinTheta;
	R[4] = cosTheta;
	R[5] = 0;
	R[6] = 0;
	R[7] = 0;
	R[8] = 1;

	// Translation matrix
	let T = new Array(9)
	T[0] = 1;
	T[1] = 0;
	T[2] = 0;
	T[3] = 0;
	T[4] = 1;
	T[5] = 0;
	T[6] = positionX;
	T[7] = positionY;
	T[8] = 1;

	// M = T*R*S 
	let M = ApplyTransform(ApplyTransform(S,R), T);
	return M;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2)
{
	let finalTrans = new Array(9)
	for(let i = 0; i < 3; i++){
		for(let j = 0; j < 3; j++){
			finalTrans[j*3 + i] = 
				trans2[0 * 3 + i] * trans1[j * 3 + 0] +
				trans2[1 * 3 + i] * trans1[j * 3 + 1] +
				trans2[2 * 3 + i] * trans1[j * 3 + 2];
		}
	}
	return finalTrans;
}
