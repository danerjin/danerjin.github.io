function castSingleRay(euclidDist, stripIdx,zbuffer) {
  // determine the hit point
	var fisheyecorrection = viewDist/euclidDist;
  {
		var cameraX = 2 * stripIdx * stripWidth / screenWidth - 1; //x-coordinate in camera space
		var rayDirX = dirX + planeX * cameraX;
		var rayDirY = dirY + planeY * cameraX;
		var right = (rayDirX>=0);
		var up = (rayDirY<=0);
    //WALL CASTING
  	var wallType = 0;
		var deltaDistX = Math.abs(1 / rayDirX);
		var deltaDistY = Math.abs(1 / rayDirY);
		//length of ray from current position to next x or y-side
		var sideDistX = right?((mapX + 1.0 - player.x) * deltaDistX):((player.x - mapX) * deltaDistX);
		var sideDistY = up?((player.y - mapY) * deltaDistY):((mapY + 1.0 - player.y) * deltaDistY);
  	var dist = 0;	// the distance to the block we hit
  	var textureX;	// the x-coord on the texture of the block, ie. what part of the texture are we going to render
  	var wallX;	// the (x,y) map coords of the block
  	var wallY;
  	var wallIsShaded = false;
  	// first check against the vertical map/wall lines
  	// we do this by moving to the right or left edge of the block we're standing in
  	// and then moving in 1 map unit steps horizontally. The amount we have to move vertically
  	// is determined by the slope of the ray, which is simply defined as sin(angle) / cos(angle).
    var hits = [];
		var hit;
    var slope = rayDirY / rayDirX; 	// the slope of the straight line made by the ray
  	var dXVer = right ? 1 : -1; 	// we move either 1 map unit to the left or right
  	var dYVer = dXVer * slope; 	// how much to move up or down
  	var dYHor = up ? -1 : 1;
  	var dXHor = dYHor / slope;
    /*if(player.currSquare===8||player.currSquare===9||player.currSquare===10){
      if(right){
        if(player.x%1>=0.5){
          var x = !right ? Math.ceil(player.x) : Math.floor(player.x);
        }
      }
      else{
        if(player.x%1<=0.5){
          var x = !right ? Math.ceil(player.x) : Math.floor(player.x);
        }
      }
    }
    else if(player.currSquare===11){
      if(right){
        if(player.x%1>=1-doorOffsets[Math.floor(player.y)][Math.floor(player.x)]){
          var x = !right ? Math.ceil(player.x) : Math.floor(player.x);
        }
      }
      else{
        if(player.x%1<=doorOffsets[Math.floor(player.y)][Math.floor(player.x)]){
          var x = !right ? Math.ceil(player.x) : Math.floor(player.x);
        }
      }
    }
    else{*/
      var x = right ? Math.ceil(player.x) : Math.floor(player.x);	// starting horizontal position, at one of the edges of the current map block
    //}
    var y = player.y + (x - player.x) * slope;// starting vertical position. We add the small horizontal step we just made, multiplied by the slope.
    while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
    		var wallX = Math.floor(x + (right ? 0 : -1));
    		var wallY = Math.floor(y);
    		// is this point inside a wall block?
    		if(map[wallY][wallX] !== 0){
          if(map[wallY][wallX]===8||map[wallY][wallX]===9 ||map[wallY][wallX]===10&&doorDirs[wallY][wallX]===0){
            x_maybe=x+dXVer/2;
            y_maybe=y+dYVer/2;
            if((y_maybe-wallY) <= 1-doorOffsets[wallY][wallX]){
              var distX = x_maybe - player.x;
        			var distY = y_maybe - player.y;
        			textureX = (y_maybe+doorOffsets[wallY][wallX]) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
        			textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
              hits.push(front);
              if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
        			    break;
              }
            }
          }
          else if(map[wallY][wallX]===11){
              x_maybe=x+dXVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
              y_maybe=y+dYVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
            if(y_maybe-wallY <= 1 && y_maybe-wallY >= 0){
              var distX = x_maybe - player.x;
              var distY = y_maybe - player.y;
                textureX = (y_maybe) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
                if(!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
								var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
								if(up){
									if(Math.abs(dXVer)>Math.abs(dXHor*(y%1))){
										var distXNew = x+dXHor*(y%1)-player.x;
										var distYNew = y+dYHor*(y%1)-player.y;
									}else{
										var distXNew = x+dXVer-player.x;
										var distYNew = y+dYVer-player.y;
									}
								}else{
									if(Math.abs(dXVer)>Math.abs(dXHor*(1-y%1))){
										var distXNew = x+dXHor*(1-y%1)-player.x;
										var distYNew = y+dYHor*(1-y%1)-player.y;
									}else{
										var distXNew = x+dXVer-player.x;
										var distYNew = y+dYVer-player.y;
									}
								}
								var back = (distXNew*distXNew + distYNew*distYNew)**0.5*fisheyecorrection;
                hits.push(new WallStripe(front,back));
                if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
          			    break;
              }
            }
          }
          else{
            var distX = x - player.x;
      			var distY = y - player.y;
        			textureX = y % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
        			if(!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
							if(up){
								if(Math.abs(dXVer)>Math.abs(dXHor*(y%1))){
									var distXNew = x+dXHor*(y%1)-player.x;
									var distYNew = y+dYHor*(y%1)-player.y;
								}else{
									var distXNew = x+dXVer-player.x;
									var distYNew = y+dYVer-player.y;
								}
							}else{
								if(Math.abs(dXVer)>Math.abs(dXHor*(1-y%1))){
									var distXNew = x+dXHor*(1-y%1)-player.x;
									var distYNew = y+dYHor*(1-y%1)-player.y;
								}else{
									var distXNew = x+dXVer-player.x;
									var distYNew = y+dYVer-player.y;
								}
							}
							var back = (distXNew*distXNew + distYNew*distYNew)**0.5*fisheyecorrection;
							hits.push(new WallStripe(front,back));
              if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
                  break;
              }
          }
    		}
        x += dXVer;
    		y += dYVer;
  	}

  	// now check against horizontal lines. It's basically the same, just "turned around".
  	// the only difference here is that once we hit a map block,
  	// we check if there we also found one in the earlier, vertical run. We'll know that if dist != 0.
  	// If so, we only register this hit if this distance is smaller.
    /*if(player.currSquare===8||player.currSquare===9||player.currSquare===10){
      if(up){
        if(player.y%1<=0.5){
          var y = !up ? Math.floor(player.y) : Math.ceil(player.y);
        }
      }
      else{
        if(player.y%1>=0.5){
          var y = !up ? Math.floor(player.y) : Math.ceil(player.y);
        }
      }
    }
    else if(player.currSquare===11){
      if(up){
        if(player.y%1>=1-doorOffsets[Math.floor(player.y)][Math.floor(player.x)]){
          var y = !up ? Math.floor(player.y) : Math.ceil(player.y);
        }
      }
      else{
        if(player.y%1<=doorOffsets[Math.floor(player.y)][Math.floor(player.x)]){
          var y = !up ? Math.floor(player.y) : Math.ceil(player.y);
        }
      }
    }
    else{*/
      var y = up ? Math.floor(player.y) : Math.ceil(player.y);
    //}
    var x = player.x + (y - player.y) / slope;
  	while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
  		var wallY = Math.floor(y + (up ? -1 : 0));
  		var wallX = Math.floor(x);
  		if(map[wallY][wallX]  !== 0) {
        if(map[wallY][wallX]===8 || map[wallY][wallX]===9 || map[wallY][wallX]===10&&doorDirs[wallY][wallX]===1){
          x_maybe=x+dXHor/2;
          y_maybe=y+dYHor/2;
          if(x_maybe-wallX <= 1-doorOffsets[wallY][wallX] && x_maybe-wallX >= 0){
            var distX = x_maybe - player.x;
            var distY = y_maybe - player.y;
              textureX = (x_maybe+doorOffsets[wallY][wallX]) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
              textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed

							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
							hits.push(front);
							if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
                  break;
              }
          }
        }
        else if(map[wallY][wallX]===11){
            x_maybe=x+dXHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
            y_maybe=y+dYHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
          if(x_maybe-wallX <= 1 && x_maybe-wallX >= 0){
            var distX = x_maybe - player.x;
            var distY = y_maybe - player.y;
              textureX = (x_maybe) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
              if(up) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
							if(!right){
								if(Math.abs(dYHor)>Math.abs(dYVer*(x%1))){
									var distXNew = x+dXVer*(x%1)-player.x;
									var distYNew = y+dYVer*(x%1)-player.y;
								}else{
									var distXNew = x+dXHor-player.x;
									var distYNew = y+dYHor-player.y;
								}
							}else{
								if(Math.abs(dYHor)>Math.abs(dYVer*(1-x%1))){
									var distXNew = x+dXVer*(1-x%1)-player.x;
									var distYNew = y+dYVer*(1-x%1)-player.y;
								}else{
									var distXNew = x+dXHor-player.x;
									var distYNew = y+dYHor-player.y;
								}
							}
							var back = (distXNew*distXNew + distYNew*distYNew)**0.5*fisheyecorrection;
							hits.push(new WallStripe(front,back));
              if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
                  break;
              }
          }
        }
        else{
          var distX = x - player.x;
    			var distY = y - player.y;
    				textureX = x % 1;
    				if(up) textureX = 1 - textureX
						var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection);
						if(!right){
							if(Math.abs(dXHor)>Math.abs(dXVer*(x%1))){
								var distXNew = x+dXVer*(x%1)-player.x;
								var distYNew = y+dYVer*(x%1)-player.y;
							}else{
								var distXNew = x+dXHor-player.x;
								var distYNew = y+dYHor-player.y;
							}
						}else{
							if(Math.abs(dXHor)>Math.abs(dXVer*(1-x%1))){
								var distXNew = x+dXVer*(1-x%1)-player.x;
								var distYNew = y+dYVer*(1-x%1)-player.y;
							}else{
								var distXNew = x+dXHor-player.x;
								var distYNew = y+dYHor-player.y;
							}
						}
						var back = (distXNew*distXNew + distYNew*distYNew)**0.5*fisheyecorrection;
						hits.push(new WallStripe(front,back));
            if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
                break;
            }
        }
  		}
  		x += dXHor;
  		y += dYHor;
  	}
  }
	if(hits.length) {
		hits = hits.sort(function(x,y){return x.dist-y.dist})
		var height;
		var top;
		for(var i = 0; i<hits.length;i++){
			if(hits[i].height+hits[i].y<screenHeight){
				height = hits[i].height;
				top = hits[i].y;
			}
		}
		//permadi floorcasting
    if(floor){
			var floorX,floorY,cellX,cellY,tx,ty,floorTexture;
      for(var y = Math.round(top+height-stripWidth); y < screenHeight; y+=stripWidth){
        if(y===screenHeight/2+player.pitch){continue;}
        var rowDistance = rowdistlookup[Math.round(y/stripWidth)*stripWidth];
        // calculate the real world step vector we have to add for each x (parallel to camera plane)
        // adding step by step avoids multiplications with a weight in the inner loop
        // real world coordinates of the leftmost column. This will be updated as we step to the right.
        floorX = player.x + rowDistance * 0.847826 * (dirX+(stripIdx-numRays/2)*planeX/(numRays/2));
        floorY = player.y + rowDistance * 0.847826 * (dirY+(stripIdx-numRays/2)*planeY/(numRays/2));
  			// the cell coord is simply got from the integer parts of floorX and floorY
        cellX = Math.floor(floorX);
        cellY = Math.floor(floorY);
        // get the texture coordinate from the fractional part
        tx = floorX - cellX;
        ty = floorY - cellY;
        // choose texture and draw the pixel
        if((floorX >= mapWidth || floorY >= mapHeight) || (floorX <= 0 || floorY <= 0) || floorlayout[cellY] === undefined){floorTexture = 2;}else{floorTexture = floorlayout[cellY][cellX];}
        if(floorTexture === 0 || floorTexture === undefined){floorTexture = 2;}
        // floor drawing
        drawFloorRectangle(stripIdx*stripWidth,y,stripWidth,stripWidth,tx,ty,floorTexture);
      }
      if(ceiling){
        for(var y = 0; y < top+stripWidth; y+=stripWidth){
        if(y===screenHeight/2+player.pitch){continue;}
        // Current y position compared to the center of the screen (the horizon)
        var p = screenHeight / 2 - y + player.pitch;
        // Vertical position of the camera.
        // Horizontal distance from the camera to the floor for the current row.
        // 0.5 is the z position exactly in the middle between floor and ceiling.
        var rowDistance = (3*screenHeight-posZ) / (p);
        // calculate the real world step vector we have to add for each x (parallel to camera plane)
        // adding step by step avoids multiplications with a weight in the inner loop
        // real world coordinates of the leftmost column. This will be updated as we step to the right.
        var floorX = player.x + rowDistance * 0.847826 * (rayDirX0 + 2*stripIdx*stripWidth*planeX/screenWidth);
        var floorY = player.y + rowDistance * 0.847826 * (rayDirY0 + 2*stripIdx*stripWidth*planeY/screenWidth);
  			// the cell coord is simply got from the integer parts of floorX and floorY
        var cellX = Math.floor(floorX);
        var cellY = Math.floor(floorY);
        // get the texture coordinate from the fractional part
        var tx = floorX - cellX;
        var ty = floorY - cellY;
        var floorTexture;
        // choose texture and draw the pixel
        if((floorX >= mapWidth || floorY >= mapHeight) || (floorX <= 0 || floorY <= 0) || floorlayout[cellY] === undefined){continue;}else{floorTexture = ceilinglayout[cellY][cellX];}
        if(floorTexture+0 === 0 || floorTexture === undefined){continue;}
        // floor drawing
        drawCeilRectangle(stripIdx*stripWidth,y,stripWidth,stripWidth,tx,ty,floorTexture);
      }
      }
    }
		hits.concat(zbuffer[stripIdx]).sort(function(x,y){return y.dist-x.dist}).forEach((element) => element.draw());
  }
}
