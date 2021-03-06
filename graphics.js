export
let canvas = document.createElement('canvas');
let gl     = canvas.getContext('webgl');


gl.clearColor(0, 0, 0, 1);
gl.clearDepth(1.0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

let prog = initProgram();
gl.useProgram(prog);




export
function draw (t, stepSize = 0.01, mode) {
	// clear
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, canvas.width, canvas.height);

	// set uniforms
	let canvas_size = Math.sqrt(canvas.width * canvas.height); let x_scale = canvas_size / canvas.width; let y_scale = canvas_size / canvas.height;
	gl.uniformMatrix4fv(prog.uProjectionMatrix, false, new Float32Array([x_scale, 0, 0, 0,  0, y_scale, 0, 0,  0, 0, 0, 1,  0, 0, 0, 3]));
	gl.uniformMatrix4fv(prog.uModelViewMatrix , false, new Float32Array([1, 0, 0, 0,  0, 0, 1, 0,  0, -0.3, 0, 0,  0, 0, 0, 1]));  // swap y,z

	// fill buffers (for attributes)
	let growth_speed = -0.1;  // actually, its negative
	let angular_speed = 2*Math.PI;
	let scale = 1;
	if (mode == 1) {
		gl.viewport(-canvas.width, -canvas.height, 3*canvas.width, 3*canvas.height);
		scale = 1/2;
	}
	let phase = -(t%1)*2*Math.PI;
	let {exp, sin, cos} = Math; // shortcuts
	let positionData = new Float32Array(Math.floor(t / stepSize *3));
	let colorData    = new Float32Array(Math.floor(t / stepSize *4));
	let vertexCount = t/stepSize;
	for (let i = 0; i < vertexCount; i++) {
		// position.xy = uScale * exp(growth_speed*t + i*angular_speed*t);
		// position.z  = uScale * t;
		t = i * stepSize;
		positionData[i*3 + 0] = scale * exp(growth_speed*t) * sin(phase + angular_speed*t);
		positionData[i*3 + 1] = scale * exp(growth_speed*t) * cos(phase + angular_speed*t);
		positionData[i*3 + 2] = scale * t;
		colorData   [i*4 + 0] = exp(-0.1 * t);
		colorData   [i*4 + 1] = exp(-0.2 * t);
		colorData   [i*4 + 2] = exp(-0.5 * t);
		colorData   [i*4 + 3] = 1;
	}
	fillBuffer(prog.aPosition, positionData, 3);
	fillBuffer(prog.aColor   , colorData   , 4);

	// draw 'em
	console.log(`drawing ${vertexCount} vertices...`);
	gl.drawArrays(gl.LINE_STRIP, 0, vertexCount);
}



//////////// (IMPLEMENTATION) DETAILS BELOW ////////////


function fillBuffer (attribPointer, data, floatsPerVertex) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.vertexAttribPointer(attribPointer, floatsPerVertex, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attribPointer);
}


function initProgram () {
	let vertexSrc = `
		uniform mat4  uProjectionMatrix;
		uniform mat4  uModelViewMatrix;

		attribute vec3 aPosition;
		attribute vec4 aColor;

		varying vec4 vColor;


		void main () {
			gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
			vColor      = aColor;
		}
	`;
	let fragmentSrc = `
		precision lowp float;

		varying vec4 vColor;

		void main () {
			gl_FragColor = vColor;
		}
	`;

	function initShader (type, source) {
		let shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	let shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, initShader(gl.VERTEX_SHADER  , vertexSrc));
	gl.attachShader(shaderProgram, initShader(gl.FRAGMENT_SHADER, fragmentSrc));
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(shaderProgram));
	}

	shaderProgram.uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
	shaderProgram.uModelViewMatrix  = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
	shaderProgram.aPosition         = gl.getAttribLocation (shaderProgram, 'aPosition');
	shaderProgram.aColor            = gl.getAttribLocation (shaderProgram, 'aColor');
	return shaderProgram;
}

