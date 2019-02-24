import {canvas, draw} from './graphics.js';

document.body.appendChild(canvas);
(window.onresize = function () {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
})();

let mode = 0;
window.onclick = function () {
	mode = 1 - mode;
}

window.onload = async function () {
	for (let start_time = new Date(); true; ) {
		draw((new Date - start_time) / (1000*2*Math.PI), 0.01, mode);  // it takes 2*PI seconds for a full rotation
		await new Promise(requestAnimationFrame);
	}
}
