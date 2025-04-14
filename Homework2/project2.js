// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	let M = new Array(9)
	// Convert from degrees to radiants
	let theta = rotation * Math.PI/180;
	// Determines cosine and sine of theta
	let cos_theta = Math.cos(theta);
	let sin_theta = Math.sin(theta);
	// M = T*R*S (Scale -> Rotation -> Transation)
	// The matrix is constructed for each element
	M[0] = scale * cos_theta;
	M[1] = scale * sin_theta;
	M[2] = 0;
	M[3] = scale * (-sin_theta);
	M[4] = scale * cos_theta;
	M[5] = 0;
	M[6] = positionX;
	M[7] = positionY;
	M[8] = 1;
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
