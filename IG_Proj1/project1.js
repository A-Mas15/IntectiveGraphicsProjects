// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    let bgData = bgImg.data;
    let fgData = fgImg.data;
    let bgWidth = bgImg.width; 		// Backgroung image width
    let bgHeight = bgImg.height; 		// Backgroung image height
    let fgWidth = fgImg.width; 		// Foregroung image width
    let fgHeight = fgImg.height; 		// Foregroung image height	
    
    for(let fgY = 0; fgY < fgHeight; fgY++){
    	for(let fgX = 0; fgX < fgWidth; fgX++){
	    	let bgX = fgX + fgPos.x;
	    	let bgY = fgY + fgPos.y;
	    	if(bgX >= 0 && bgX < bgWidth && bgY >= 0 && bgY < bgHeight){
	    		let bgIdx = (bgY * bgWidth + bgX)*4;
	    		let fgIdx = (fgY * fgWidth + fgX)*4; 
	    		
	    		// Define the channels:
	    		let cFgRed =  fgData[fgIdx];			// Red channel forground
	    		let cFgGreen =  fgData[fgIdx + 1];		// Green channel forground
	    		let cFgBlue =  fgData[fgIdx + 2];		// Blue channel forground
		    	let alphaFg = (fgData[fgIdx + 3] * fgOpac)/255;	// Foreground image alpha - Normalized

		    	let cBgRed =  bgData[bgIdx];			// Red channel background
	    		let cBgGreen =  bgData[bgIdx + 1];		// Green channel background
	    		let cBgBlue =  bgData[bgIdx + 2];		// Blue channel background
		    	let alphaBg = (bgData[bgIdx + 3])/255;		// Background image alpha - Normalized
		    	// alpha = alpha_fg + (1- alpha_f)*alpha_b
		    	let alpha = alphaFg + (1- alphaFg)*alphaBg;
		    
		    	//c =((alphaFg*cFg) + (1-alphaFg)*alphaBg*cBg) / alpha
		    	if(alpha > 0){
		    		// Update the color channels for the bottom image
		    		bgData[bgIdx] = ((alphaFg*cFgRed) + (1-alphaFg)*alphaBg*cBgRed) / alpha;
		    		bgData[bgIdx + 1] = ((alphaFg*cFgGreen) + (1-alphaFg)*alphaBg*cBgGreen) / alpha;
		    		bgData[bgIdx + 2] = ((alphaFg*cFgBlue) + (1-alphaFg)*alphaBg*cBgBlue) / alpha;
		    		bgData[bgIdx + 3] = alpha * 255;	// Un-normalize alpha
		    	}
	    	}
    	}
    }
}
