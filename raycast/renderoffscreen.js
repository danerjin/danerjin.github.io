var isPressingG = false;
// just a few helper functions
var $ = function(id) { return document.getElementById(id); };
// indexOf for IE. From: https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference:Objects:Array:indexOf
if(!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(elt /*, from*/) {
		var len = this.length;
		var from = Number(arguments[1]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if(from < 0)
			from += len;
		for (; from < len; from++) {
			if(from in this && this[from] === elt)
				return from;
		}
		return -1;
	};
}
var debug = false;
var enemy;
var weapon_names = ['knife','pistol','smg','chaingun', 'rifle'];
var weapon_sizes = [64,      64,      64,        64,      128]
var dmgdist;
var vol = 0.5;
var scoretext='';
var chromebook = false;
var sens = 1;
var Node = function(state,parent){
	this.state=state;
	this.parent=parent;
}
function neighbors(input){
	var x=input[0];
	var y=input[1];
	var z=input[2];
	var traveled=input[3];
	var cellX = Math.floor(x);
	var cellY = Math.floor(y);
	var val = [];
	for(var j = cellY-1;j<=cellY+1;j++){
		if(map[j]===undefined) continue;
		for(var i = cellX-1;i<=cellX+1;i++){
			if(map[j][i]===undefined) continue;
			if((!isBlocking(i+0.5,j+0.5,z+0.25) || map[j][i]===8 || map[j][i]===9)/* && !traveled.includes([i,j])*/){
				if(Math.floor(player.x)===i&&Math.floor(player.y)===j){
					val.push([player.x,player.y,heightMap[j][i]]);
				}else{
					val.push([i+0.5,j+0.5,heightMap[j][i]])
				}
			}
		}
	}
	return val;
}
function solve(player,starter){
	//Initialize frontier to just the starting position
	var start = new Node([starter.x,starter.y], parent=undefined)
	var frontier = [start];
	// Initialize an empty explored set
	var explored = [];
	// Keep looping until solution found
	while(1){
		frontier=frontier.toSorted(function(a,b){
			return ((a[0]-player.x)**2+(a[1]-player.y)**2)**0.5-((b[0]-player.x)**2+(b[1]-player.y)**2)**0.5
		})
		// If nothing left in frontier, then no path
		if(frontier.length===0)	return [];
		// Choose a node from the frontier
		var node = frontier.shift();
		// If node is the player, then we have a solution
		if([Math.floor(node.state[0]),Math.floor(node.state[1])] === [Math.floor(player.x),Math.floor(player.y)]){
			var cells = [];
			while(node.parent !== undefined){
				cells.push(node.state)
				node = node.parent;
			}
			//cells=cells[::-1]
			console.log(cells);
			return cells;
		}
		// Mark node as explored
		explored.push(node.state)
		// Add neighbors to frontier
		var neighs=neighbors(node.state);
		for(var i = 0;i<neighs.length;i++){
			state=neighs[i];
			if(!explored.includes(state)){
				var child = new Node(state, node)
				frontier.push(child)
			}
		}
	}
}
function getimagedata(v) {
  const w = v.width, h = v.height;
  const context = new OffscreenCanvas(w, h).getContext('2d');
  context.drawImage(v, 0, 0, w, h);
  return context.getImageData(0, 0, w, h);
}
var astar=true;
var stuff=[0,1,1,3];
function playsound(src,mul=1) {
	var sound = document.createElement("audio");
	sound.src = 'sounds/'+src+'.mp3';
	//sound.setAttribute("preload", "auto");
	sound.setAttribute("controls", "none");
	sound.style.display = "none";
	sound.volume=Math.min(vol*mul,1);
	//document.body.appendChild(sound);
	sound.play();
}
function playsoundWAV(src,mul=1) {
	var sound = document.createElement("audio");
	sound.src = 'sounds/'+src+'.wav';
	//sound.setAttribute("preload", "auto");
	sound.setAttribute("controls", "none");
	sound.style.display = "none";
	sound.volume=Math.min(vol*mul,1);
	//document.body.appendChild(sound);
	sound.play();
}
gameIsOn=false;
textscreen='Get Ready!';
function rgb(csscolor){
	return 'rgb('+csscolor[0]+','+csscolor[1]+','+csscolor[2]+')';
}
var Sprite = function(x,y,texture,block,hitbox,h,z,vmove){
  this.x = x;
  this.y = y;
	this.vmove = vmove;
  this.texture = new Image();
  this.texture.crossOrigin = "Anonymous";
  this.texture.src = `sprites/objects/${texture}.png`;
  this.block = block;
  this.hitbox = hitbox;
  this.h = h;
  this.z = z;
}
var Pickup = function(x,y,texture,z,vmove,type){
  this.x = x;
  this.y = y;
	this.vmove = vmove;
  this.texture = new Image();
  this.texture.crossOrigin = "Anonymous";
  this.texture.src = `sprites/objects/${texture}.png`;
	this.name=texture;
	this.type=type;
	if(this.type===0){
		this.gun = weapon_names.indexOf(texture);
	}else if(this.type===1){
		//key
	}else if(this.type===2){
		//ammo
	}else if(this.type===3){
		//health
	}else if(this.type===4){
		///more lives
	}else if(this.type===5){
		//backpack
	}
  this.z = z;
}
var Enemy = function(x,y,z,texture,hp,rot,speed,dmg,melee,cool,burst,flinch,weapon,drops=[]/*,ai*/){
	this.name=texture;
  this.x = x;
  this.y = y;
	this.z = z;
	this.xSpeed = 0;
	this.ySpeed = 0;
  this.texture = new Image();
  this.texture.crossOrigin = "Anonymous";
  this.texture.src = `sprites/enemies/${texture}.png`;
	this.state = 0;
	this.rot = rot;
	this.hp = hp;
	this.speed = speed;
	this.stateTimer = 0;
	this.dmg = dmg;
	this.melee = melee;
	this.drops=drops;
	this.target = [Math.floor(this.x)+0.5,Math.floor(this.y)+0.5];
	this.instate = 0;
	this.atkooldown = 0;
	this.cool=cool;
	this.burstTimer=0;
	this.burst=burst;
	this.flinch=flinch;
	this.weapon=weapon;
	this.traveled=[[Math.floor(this.x),Math.floor(this.y)]];
	this.path=[];
	this.playerpos=[Math.floor(player.x),Math.floor(player.y)];
	this.update=function(mul,dist){
		var newpos=[Math.floor(player.x),Math.floor(player.y)];
		if(newpos!==this.playerpos){
			/*this.path=solve(player,this);*/
			this.playerpos=[Math.floor(player.x),Math.floor(player.y)];
			//this.traveled=[];
		}
		dist=dist*Math.abs(this.z-player.z);
		this.stateTimer+=(this.instate===2?0.05:this.speed)*3*mul*stuff[this.instate];
		this.state = Math.floor(this.stateTimer);
		this.atkooldown = Math.max(this.atkooldown-mul*gameCycleDelay,0);
		if(this.instate===1){
			if(this.stateTimer>=5){
				this.stateTimer = 1;
			}
		}else if(this.instate===2){
			if(this.stateTimer>=16){
				this.burstTimer++;
				if(this.burstTimer >= this.burst){
					this.burstTimer=0;
					this.stateTimer = 1;
					this.state = 1;
					this.instate = 1;
					this.atkooldown = this.cool*1000;

				}else{
					this.stateTimer=14;
					this.state=14;
					this.instate=2;
				}
				if((this.melee&&dist < player.range[0]/36) || (!this.melee)){
				  if(this.melee){
						if(Math.abs(this.z-player.z)<player.range[0]/48){
							playsound('weapons/'+sounds[this.weapon][0]);
					  	player.hurt(Math.ceil(8+8*Math.random()));
						}
				  }else{
				    if(256*Math.random()<(256-dist*Math.abs(this.z-player.z)*16)&&canSee(this)){
							playsound('weapons/'+sounds[this.weapon]);
				      player.hurt((player.damage[1]-(player.dropoff[1]*dist*Math.abs(this.z-player.z)*24/player.range[1]))*0.5);
				    }
					}
				}
			}
		}else if(this.instate===3){
			if(this.stateTimer>=9){
				this.stateTimer = 9;
				this.state = 9;
				this.instate = 3;
			}
		}
	}
	this.ai = function(mul){
		var dist = ((player.x-this.x)**2+(player.y-this.y)**2)**0.5;
		this.update(mul,dist);
		if(this.hp>0){
			if(this.alert){
				if(this.instate!==2){
					var neighs = neighbors([this.x,this.y,this.z,this.traveled]);
					if(neighs.length){
						if(this.melee){
							neighs=neighs.toSorted(function(a,b){
								return /*(Math.abs(a[2]-player.z)+1)**/((a[0]-player.x)**2+(a[1]-player.y)**2)**0.5-/*(Math.abs(b[2]-player.z)+1)**/((b[0]-player.x)**2+(b[1]-player.y)**2)**0.5
							})
						}else{
							if(((this.x-player.x)**2+(this.y-player.y)**2)**0.5 > 2){
								neighs=neighs.toSorted(function(a,b){
									return /*(Math.abs(a[2]-player.z)+1)**/((a[0]-player.x)**2+(a[1]-player.y)**2)**0.5-/*(Math.abs(b[2]-player.z)+1)**/((b[0]-player.x)**2+(b[1]-player.y)**2)**0.5
								})
							}else{
								neighs=neighs.toSorted(function(a,b){
									return -/*(Math.abs(a[2]-player.z)+1)**/(((a[0]-player.x)**2+(a[1]-player.y)**2)**0.5-/*(Math.abs(b[2]-player.z)+1)**/((b[0]-player.x)**2+(b[1]-player.y)**2)**0.5)
								})
							}
						}
						this.target = neighs[0];
					}

					if(this.melee){
						if(dist < player.range[0]/36&&this.atkooldown===0){
							this.attack();
						}else if (dist>player.range[0]/36){
							if(astar){this.rot = Math.atan2(this.target[1]-this.y,this.target[0]-this.x);}
							else{this.rot = Math.atan2(-this.y+player.y,-this.x+player.x);}
							this.fd(mul);
						}else{
							this.instate=0;
							this.state=13;
							this.stateTimer=13;
						}
					}else{
						if(Math.random()<1/(1+2*dist)&&this.atkooldown===0&&canSee(this)){
							this.attack();
						}else{
							if(astar){this.rot = Math.atan2(this.target[1]-this.y,this.target[0]-this.x);}
							else{this.rot = Math.atan2(-this.y+player.y,-this.x+player.x);}
							this.fd(mul);
						}
					}
				}
			}else{
				if(dist<(player.isCrouching?4:10)&&canSee(this)){
					this.alert = true;
					playsoundWAV('enemies/'+this.name+'alert');
					for(var i = 0; i < enemies.length;i++){
						enemy=enemies[i];
						if(canSee(enemy,this)){
							enemy.alert=true;
							playsoundWAV('enemies/'+enemy.name+'alert');
						}
					}
				}else{
					this.alert = false;
				}
			}
		}
	};
	this.fd = function(mul){
		if(this.hp>0){
			if(this.state===0) this.state = 1;
			this.instate = 1;
			this.xSpeed = Math.cos(this.rot)*this.speed;
			this.ySpeed = Math.sin(this.rot)*this.speed;
			if(map[Math.floor(this.y+this.ySpeed*mul)]!==undefined){
				if(map[Math.floor(this.y+this.ySpeed*mul)][Math.floor(this.x+this.xSpeed*mul)] === 8 ||
				map[Math.floor(this.y+this.ySpeed*mul)][Math.floor(this.x+this.xSpeed*mul)] === 9 ||
				map[Math.floor(this.y+this.ySpeed*mul)][Math.floor(this.x+this.xSpeed*mul)] === 10){
					doorStates[Math.floor(this.y+this.ySpeed*mul)][Math.floor(this.x+this.xSpeed*mul)] = 1;
				}
			}
			var pos = checkCollision(this.x,this.y,this.x+this.xSpeed*mul,this.y+this.ySpeed*mul,0.05,this.z-gravity);
			this.x = pos.x;
			this.y = pos.y;
			this.z = pos.z;
			var newpos=[Math.floor(this.x),Math.floor(this.y)];
			if(this.playerpos===[Math.floor(this.target[0]),Math.floor(this.target[1])]){
				//this.target=this.path.pop();
			}
		}
	}
	this.hurt = function(amnt,dist){
		for(var i = 0; i < enemies.length;i++){
			enemy=enemies[i];
			if(canSee(enemy,this)){
				enemy.alert=true;
				playsoundWAV('enemies/'+enemy.name+'alert');
			}
		}
		var headshot=Math.random()>0.5;
		if(this.hp !== 0){
			this.alert=true;
			playsound('hp/hit_0');
			if(this.hp-Math.round(amnt*(headshot?1.5:1)) > 0){
				this.hp=this.hp-Math.round(amnt*(headshot?1.5:1));
				if(this.flinch){
					this.state = 12;
					this.stateTimer=12;
					this.instate=2;
				}
			}else{
				playsoundWAV('enemies/'+this.name+'death');
				if(headshot){
					playsound('hp/headshot_0');
				}else{
					playsound('hp/hit_0');
				}
				this.hp = 0;
				if(player.weapon===0){
					player.increaseScore((player.hp<20?20:0)+(player.isFloor?0:25)+(dist>8?0:25)+(headshot?50:0)+150);
				}else if(player.weapon===1){
					player.increaseScore((player.hp<20?20:0)+(player.isFloor?0:25)+(dist>8?0:25)+(headshot?50:0)+75);
				}else{
					player.increaseScore((player.hp<20?20:0)+(player.isFloor?0:25)+(dist>8?0:25)+(headshot?50:0)+50);
				}
				//add drop to pickupslist
				for(var i = 0; i < this.drops.length;i++){
					pickups.push(new Pickup(this.x,this.y,this.drops[i][0],this.z,this.z,this.drops[i][1]))
				}
				if(blood){
					this.state = 5;
					this.stateTimer=5;
					this.instate = 3;
				}else{
					enemies.splice(enemies.indexOf(this),1);
				}
			}
		}
	}
	this.attack = function(){
		if(this.instate!==2){
			this.state = 13;
			this.stateTimer=13;
			this.instate = 2;
		}
	}
}
var SpriteStripe = function(tex,xOffset,stripe,y,height,dist){
  this.tex = tex;
  this.y = y;
  this.stripe = stripe;
  this.xOffset = xOffset;
  this.height = height;
  this.dist = dist;
  this.draw = function(){
    ctx.drawImage(this.tex, Math.floor((this.xOffset%1)*this.tex.width), 0,
      1, this.tex.height,
      this.stripe, this.y, stripWidth, this.height);
  }
}
var EnemyStripe = function(tex,xOffset,stripe,y,height,dist,state,num){
  this.tex = tex;
  this.y = y;
  this.stripe = stripe;
  this.xOffset = xOffset;
  this.height = height;
  this.dist = dist;
	this.state = state;
	this.num = num;
  this.draw = function(){
    ctx.drawImage(this.tex, Math.floor(this.xOffset), Math.floor(65*this.state),
      1, 64,
      this.stripe, this.y, stripWidth, this.height);
  }
}
var WallStripeHalf = function(wallX,wallY,xOffset,x,shade,dist){
  this.tex = map[wallY][wallX];
	this.wallY = wallY;
	this.wallX = wallX;
  this.x = x;
  this.dist = dist;
  this.seg=Math.round(viewDist/this.dist);
	if(heightMap[wallY][wallX]===0){
		this.height = this.seg
	}else{
  	this.height = Math.round(viewDist*heightMap[wallY][wallX]/this.dist);
	}
  this.y = Math.round(screenHeight/2 - this.height+(player.z+player.height)*viewDist/this.dist)+player.pitch;
  this.xOffset=xOffset;
  this.shade=shade;
  this.draw = function(){
    for(var drawTop = this.y+this.height-this.seg; drawTop >= this.y-2; drawTop-=this.seg){
      drawWallSliceRectangle(this.x,drawTop,stripWidth,this.seg,this.xOffset+(this.shade?1:0),this.tex);
    }
    if(drawTop<this.y){
      ctx.drawImage(wallTextures[this.tex-1], Math.floor((this.xOffset+(this.shade?1:0))*wallTextures[this.tex-1].width/2), Math.round(wallTextures[this.tex-1].height*(1-(this.height/this.seg)%1)),
        1, Math.round(wallTextures[this.tex-1].height*((this.height/this.seg)%1)),
        this.x, this.y, stripWidth, (this.height%this.seg)+3);
    }
  }
}
var GlassPaneStripe = function(wallX,wallY,x,dist){
	this.wallY = wallY;
	this.wallX = wallX;
  this.x = x;
  this.dist = dist;
  this.height = Math.round(viewDist*heightMap[wallY][wallX]/this.dist);
  this.y = Math.round(screenHeight/2 - this.height+(player.z+player.height)*viewDist/this.dist)+player.pitch;
  this.draw = function(){
		drawFillRectangleRGBA(this.x,this.y,stripWidth,this.height,[157,234,244,0.5])
  }
}
var WallStripe = function(front,backdist){
	this.front = front;
	this.backdist = backdist;
	this.wallX = this.front.wallX;
	this.wallY = this.front.wallY;
	this.x=this.front.x;
  this.backheight = Math.round(viewDist*heightMap[this.wallY][this.wallX]/this.backdist);
  this.backy = Math.round(screenHeight/2 - this.backheight+(player.z+player.height)*viewDist/this.backdist)+player.pitch;
	this.dist = this.front.dist;
	this.height = this.front.height;
	this.y = this.front.y;
	this.draw = function(){
		if(this.front.y > this.backy&&this.backy<=screenHeight){
			//topside
			var drawEnd = Math.min(this.front.y,screenHeight);
			if(floor){
				for(var y = this.backy; y<=drawEnd; y+=stripWidth){
					// Current y position compared to the center of the screen (the horizon)
					var p = y - screenHeight / 2 - player.pitch;
					// Vertical position of the camera.
					// Horizontal distance from the camera to the floor for the current row.
					// 0.5 is the z position exactly in the middle between floor and ceiling.
					var rowDistance = (posZ-heightMap[this.wallY][this.wallX]*screenHeight) / (p);
			    var floorX = player.x + rowDistance * (dirX+(this.x/stripWidth-numRays/2)*planeX/(numRays/2));
			    var floorY = player.y + rowDistance * (dirY+(this.x/stripWidth-numRays/2)*planeY/(numRays/2));
		      // get the texture coordinate from the fractional part
		      var tx = floorX%1;
		      var ty = floorY%1;
		      var floorTexture=this.front.tex;
		      // floor drawing
		      drawCeilRectangle(this.x,y,stripWidth,stripWidth,tx,ty,floorTexture);
				}
			}else{
			 	drawFillRectangle(this.front.x,this.backy,stripWidth,this.front.y-this.backy,fill=rgb(wallTypes[this.front.tex]));// <= this was temporary
			}
		}
		if(this.front.y<=screenHeight){this.front.draw();}
	}
}
var map = [
  [2,2,2,2,2,2,2,2,2,2,2,4,4,6,4,4,6,4,6,4,4,4,6,4],
  [2,0,0,0,0,0,0,0,0,0,2,4,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,0,0,2,2,4,0,0,0,0,0,0,0,0,0,0,0,6],
  [2,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,6],
  [2,0,0,0,0,0,0,0,0,2,2,4,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,0,0,0,2,4,0,0,0,0,0,6,6,6,8,6,4,6],
  [2,7,7,7,8,7,7,7,7,2,2,4,4,4,11,4,4,6,0,0,0,0,0,6],
  [7,0,0,0,0,0,0,0,0,0,2,0,0,4,0,0,2,4,0,4,0,6,0,6],
  [7,0,0,0,0,0,0,0,7,2,0,0,0,4,0,0,2,6,0,0,0,0,0,6],
  [7,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,2,6,0,0,0,0,0,4],
  [7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,6,0,6,0,6,0,6],
  [7,0,0,0,0,0,0,0,7,2,0,2,0,2,0,2,2,6,4,6,0,6,6,6],
  [7,7,7,7,9,7,7,7,7,2,2,4,0,6,2,4,2,3,3,3,8,3,3,3],
  [2,2,2,2,0,2,2,2,2,4,6,4,0,0,6,0,6,3,0,0,0,0,0,3],
  [2,2,0,0,0,0,0,2,2,4,0,0,0,0,0,0,4,3,0,0,0,0,0,3],
  [2,0,0,0,0,0,0,0,2,4,0,0,0,0,0,0,4,3,0,0,0,0,0,3],
  [1,0,0,0,0,0,0,0,1,4,4,4,4,4,6,0,6,3,3,0,0,0,3,3],
  [2,0,0,0,0,0,0,0,2,2,2,1,2,2,2,6,6,0,0,5,8,5,0,5],
  [2,5,0,0,0,0,0,2,2,2,0,0,0,2,2,0,5,0,0,0,0,0,0,5],
  [2,4,0,0,0,0,0,0,2,0,0,0,0,0,2,5,0,5,0,0,0,0,0,5],
  [1,3,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,2,2,12,5],
  [2,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,10,0,0,5],
  [2,2,1,3,4,5,0,2,2,2,0,0,0,2,2,0,5,0,5,0,2,0,5,5],
  [2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,5,5,5,5,5,5,5,5,5]
];
var heightMap = [
  [2,1.5,2,1.5,2,1.5,2,1.5,2,1.5,2,2,1.5,2,1.5,2,1.5,2,1.5,2,1.5,2,1.5,2],
  [1.5,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,1.5],
  [2,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,2],
  [1.5,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1.5],
  [2,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,2],
  [1.5,0,0,0,0,0,0,0,0,0,2,1,0,0,0,0,0,2,2,2,1,2,1,1.5],
  [2,2,2,2,1,2,2,2,2,2,2,1,1,1,1,1,1,2,0,0,0,0,0,2],
  [1.5,0,0,0,0,0,0,0,0,0,2,0,0,1,0,0,2,1,0,1,0,2,0,1.5],
  [2,0,0,0,0,0,0,0,2,2,0,0,0,0,1,0,0,2,0,0,0,0,0,2],
  [1.5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0,0,0,0,1.5],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,2,0,2,0,2],
  [1.5,0,0,0,0,0,0,0,2,2,0,2,0,2,0,2,2,2,1,2,0,2,2,1.5],
  [2,2,2,2,1,2,2,2,2,2,2,1,0,2,2,1,2,2,2,2,1,2,2,2],
  [2,2,2,2,0,2,2,2,2,1,2,1,0,0,2,0,2,2,0,0,0,0,0,1.5],
  [2,2,0,0,0,0,0,2,2,1,0,0,0,0,0,0,1,2,0,0,0,0,0,2],
  [1.5,0,0,0,0,0,0,0,2,1,0,0,0,0,0,0,1,2,0,0,0,0,0,1.5],
  [2,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0,2,2,2,0,0,0,2,2],
  [1.5,0.1,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,0,0,2,1,2,0,1.5],
  [2,0.2,0,0,0,0,0,2,2,2,0,0,0,2,2,0,2,0,0,0,0,0,0,2],
  [1.5,0.4,0,0,0,0,0,0,2,0,0,0,0,0,2,2,0,2,0,0,0,0,0,1.5],
  [2,0.6,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2],
  [1.5,0.8,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,0,1.5],
  [2,1,0.8,0.6,0.4,0.2,0,2,2,2,0,0,0,2,2,0,2,0,2,0,1,0,1,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];
var endX=21;
var endY=21;
var maxHeight = 2;
var mapWidth = map[0].length;
var mapHeight = map.length;
var useGPU = false;
var lode=false;
var doorStates = new Array(mapHeight);
// 1 is opening, 0 is closing, 0.5 is for stationary
for (var i = 0; i < mapHeight; i++) {
  doorStates[i] = new Array(mapWidth);
  for (var j = 0; j < mapWidth; j++) {
    doorStates[i][j] = 0.5;
  }
}
var doorOffsets = new Array(mapHeight);
//how much is extended
for (var i = 0; i < mapHeight; i++) {
  doorOffsets[i] = new Array(mapWidth);
  for (var j = 0; j < mapWidth; j++) {
    doorOffsets[i][j] = 0;
  }
}
var doorTimers = new Array(mapHeight);
//timers for door closing
for (var i = 0; i < mapHeight; i++) {
  doorTimers[i] = new Array(mapWidth);
  for (var j = 0; j < mapWidth; j++) {
    doorTimers[i][j] = 0;
  }
}
var doorDirs = new Array(mapHeight);
//directions for doors, 0 is vertical, 1 is horizontal
for (var i = 0; i < mapHeight; i++) {
  doorDirs[i] = new Array(mapWidth);
  for (var j = 0; j < mapWidth; j++) {
    doorDirs[i][j] = 0;
  }
}
/*
8, 9, and 10 - doors,
11 - secret push wall, wood texture
12 - glass
13 - iron bars
*/
var skydomeTexture = new Image();
skydomeTexture.crossOrigin = "Anonymous";
skydomeTexture.src = `sprites/pano.png`;
var weaponIcons = new Image();
weaponIcons.crossOrigin = "Anonymous";
weaponIcons.src = `sprites/icons/weapons.png`;

var playerhpIcons = new Image();
playerhpIcons.crossOrigin = "Anonymous";
playerhpIcons.src = `sprites/icons/faces.png`;

var playerKeysIcons = new Image();
playerKeysIcons.crossOrigin = "Anonymous";
playerKeysIcons.src = `sprites/icons/keys.png`;
var floorlayout = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];
var ceilinglayout = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
];

var player = {
	x : 5.5,		// current x, y position
	y : 3.1,
	camerax : 5.5,		// current x, y position
	cameray : 3.1,
	dir : 0,		// the direction that the player is turning, either -1 for left or 1 for right.
	rotDeg : 45,		// the current angle of rotation
	rot : 0,		// rotation in radians
	speed : 0,		// is the playing moving forward (speed = 1) or backwards (speed = -1).
  strafeSpeed : 0, //strafing
	momentum:0,//momentum for slidehop
	moveSpeed : 0.05,	// how far (in map units) does the player move each step/update
	rotSpeed : 5,		// how much does the player rotate each step/update (in degrees)
  pitch : 0, // pitch
  pitchChange : 0,
  z: 0, //feet to floor dist
  height: 0.5, // player height
  zSpeed: 0,
  isJumping: false,
	isFloor:true,
  speedMult: 1,
	isCrouching:false,
  weapon:1,
  weaponState:0,
	weaponTimer:0,
	weaponIsActive:false,
	maxWeapon:1,
	ammo:['-',10,28,60,2],
	maxAmmo:['-',10,28,60,2],
	ammoPack:-1,
	reloadTimes:[0,700,1500,3300,1100],
	damage:[50,20,23,19,250],
	dropoff:[0,10,5,10,50],
	range:[12,700,700,700,160],
	firerate:[125,90,130,200,450],
	pierce:[0,1,1,1,0],
	secondary:function(){
		if(this.weapon===1){
			this.weapon = this.maxWeapon;
		}else{
			this.weapon = 1;
		}
	},
	primary:function(){
		this.weapon = this.maxWeapon;
	},
	melee:function(){
		if(this.weapon===0){
			this.weapon=this.maxWeapon;
		}else{
			this.weapon = 0;
			playsound('weapons/melee_equip');
		}
	},
	reload:function(){
		if(this.weapon!==0 && this.ammo[this.weapon]!==this.maxAmmo[this.weapon] && player.ammoPack >= (player.maxAmmo[player.weapon]-player.ammo[player.weapon])){
			this.weaponState = -1;
			playsound('weapons/reload_3');
			setTimeout(function(){
				if(player.weapon !== 0){
					player.ammoPack -= (player.maxAmmo[player.weapon]-player.ammo[player.weapon]);
					player.ammo[player.weapon] = player.maxAmmo[player.weapon];
					player.weaponState = 0;
				}
			},this.reloadTimes[this.weapon]);
		}
	},
	hp:100,
	maxHp:100,
	lives:5,
	timer:0,
	regen:0,
	atkount:0,
	doesRegen:true,
	score:0,
	increaseScore:function(amnt){
		this.score+=amnt;
		scoretext='+'+amnt;
		setTimeout(function(){
			scoretext='';
		},1000)
	},
	fire:function(stripe){
		if(this.weapon===0){
			playsound('weapons/'+sounds[this.weapon][this.atkount%2]);
		}else{
			playsound('weapons/'+sounds[this.weapon]);
		}
		if(this.weapon === 0){
			enemies.forEach(enemy => function(enemy){
				if(((enemy.x-player.x)**2+(enemy.y-player.y)**2)**0.5 < player.range[player.weapon]/24 && enemy.hp!==0){
					enemy.hurt(player.damage[0],0);
				}
			}(enemy));
		}else{
			var num,dist,enemy;
			var dmgMult = 1;
			for(var i = 0; i<stripe.length;i++){
				if(stripe[i].state!==undefined){
					num = stripe[i].num;
					enemy = enemies[num];
					if(enemy!==undefined){
						dist = ((enemy.x-this.x)**2+(enemy.y-this.y)**2)**0.5;
						if(dist <= this.range[this.weapon]/24 && stripe[i].y<=screenHeight/2 && stripe[i].y+stripe[i].height>=screenHeight/2 && enemy.hp!==0){
							enemy.hurt((this.damage[this.weapon]-(this.dropoff[this.weapon]*dist*24/this.range[this.weapon]))*dmgMult,dist);
						}
					}
				}else{
					dmgMult*=(1-this.pierce[this.weapon]/2);
				}
			}
		}
	},
	hurt:function(amnt){
		if(this.timer>3000){
			this.regen=0;
			this.hp-=Math.floor(amnt);
			playsound('hp/takedmg_0');
			if(this.hp<=0){
				this.hp=0;
				this.lives -=1;
				if(this.maxWeapon!==1){
					pickups.push(new Pickup(this.x,this.y,weapon_names[this.maxWeapon],this.z,this.z,0))
				}
				this.maxWeapon=1;
				this.weapon=1;
				gameIsOn=false;
				textscreen='You Died';
				if(this.lives>=0){
					panorama=true;
					this.timer=0;
					setTimeout(function(){
						player.timer=0;
						player.hp=player.maxHp;
						player.x=5.5;
						player.y=3.1;
						gameIsOn=true;
						panorama=false;
					},1000)
				}
			}
		}
	},
	update:function(delt){
		var mul=delt/gameCycleDelay;
		if(this.doesRegen){
			this.regen=this.regen+1/(this.maxHp*Math.max(this.hp,this.maxHp/2))*delt;
			if(this.hp+this.regen/gameCycleDelay <= this.maxHp){
				this.hp+=this.regen/gameCycleDelay;
			}else{
				this.regen=0;
				this.hp=this.maxHp;
			}
		}
		if(this.hp>0) this.timer+=delt;
	},
	keys:0,
}

var sprites = [
  new Sprite(21.5,10,"lamp",false,0.6,0,0,0),
  new Sprite(18,3,"lamp",false,0.6,0,0,0),
  new Sprite(9.5,3.5,"lamp",false,0.6,0,0,0),
  new Sprite(9.5,10,"lamp",false,0.6,0,0,0),
  new Sprite(3,3.5,"lamp",false,0.6,0,0,0),
  new Sprite(3,19.5,"lamp",false,0.6,0,0,0),
  new Sprite(3,13,"lamp",false,0.6,0,0,0),
  new Sprite(14,19,"lamp",false,0.6,0,0,0),
  new Sprite(2,8,"pillar",true,0.6,1,0,0),
  new Sprite(2,9,"pillar",true,0.6,1,0,0),
  new Sprite(2,10,"pillar",true,0.6,1,0,0),
  new Sprite(21,2,"barrel",true,0.6,0.4,0,0),
  new Sprite(15.73,2.1,"barrel",true,0.6,0.4,0,0),
  new Sprite(15.27,2.1,"barrel",true,0.6,0.4,0,0),
  new Sprite(15.5,2.3,"barrel",true,0.6,0.4,0.4,0.4),
  new Sprite(15.5,2.7,"barrel",true,0.6,0.4,0,0),
  new Sprite(3,2,"barrel",true,0.6,0.4,0,0),
  new Sprite(9,10,"barrel",true,0.6,0.4,0,0),
  new Sprite(9.5,10,"barrel",true,0.6,0.4,0,0),
  new Sprite(10,10,"barrel",true,0.6,0.4,0,0)
];
var enemies = [
	new Enemy(15.5,4.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(16.0,4.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(16.5,4.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(17.0,4.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(15.5,3.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(16.0,3.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(16.5,3.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(17.0,3.5,0,"dog",15,Math.PI,0.075,0,true,0.5,1,false,0),
	new Enemy(4.5,7.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(4.5,15.5,0,"ss",100,3*Math.PI/2,0.035,0,false,0.4,4,true,2,[['ammo',2],['smg',0]]),
	new Enemy(5.5,17.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(6.0,17.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(6.5,17.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(7.0,17.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(5.5,16.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(6.0,16.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(6.5,16.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(7.0,16.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(10.0,20.0,0,"guard",50,Math.PI,0.075,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(11.0,20.0,0,"guard",50,Math.PI,0.075,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(10.0,21.0,0,"ss",100,Math.PI,0.075,0,false,0.4,4,true,2,[['ammo',2],['smg',0]]),
	new Enemy(11.0,21.0,0,"ss",100,Math.PI,0.075,0,false,0.4,4,true,2,[['ammo',2],['smg',0]]),
	new Enemy(7.0,16.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,0),
	new Enemy(21.5,8.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(12.5,9.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(12.5,10.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(12.5,11.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(12.5,12.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(12.5,13.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(12.5,14.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(12.5,15.5,0,"dog",15,3*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(11.5,14.5,0,"dog",15,0*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(11.5,15.5,0,"dog",15,0*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(13.5,14.5,0,"dog",15,2*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(13.5,15.5,0,"dog",15,2*Math.PI/2,0.075,0,true,0.5,1,false,1,[]),
	new Enemy(10.5,14.5,0,"dog",15,0*Math.PI,0.075,0,true,0.5,1,false,1,[['ammo',2]]),
	new Enemy(10.5,15.5,0,"dog",15,0*Math.PI,0.075,0,true,0.5,1,false,1,[['ammo',2]]),
	new Enemy(14.5,14.5,0,"dog",15,Math.PI/2,0.075,0,true,0.5,1,false,1,[['ammo',2]]),
	new Enemy(14.5,15.5,0,"dog",15,Math.PI/2,0.075,0,true,0.5,1,false,1,[['ammo',2]]),
	new Enemy(19.5,8.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(21.5,6.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(19.5,6.5,0,"guard",50,3*Math.PI/2,0.02,0,false,0.5,1,true,1,[['ammo',2]]),
	new Enemy(21.0,15.5,0,"ss",100,3*Math.PI/2,0.02,0,false,0.4,4,true,2,[['ammo',2],['smg',0]]),
	new Enemy(20.0,15.5,0,"ss",100,3*Math.PI/2,0.02,0,false,0.4,4,true,2,[['ammo',2],['smg',0]]),
	new Enemy(19.0,15.5,0,"boss",500,3*Math.PI/2,0.02,0,false,0.4,10,false,2,[['ammo',2],['chaingun',0],['bluekey',1]]),
];
var sounds=[['swsh_0_0','swsh_0_1'],'weapon_3','weapon_2','weapon_26'];
var pickups = [
	new Pickup(15.5,7.5,'chaingun',0,0,0),
	new Pickup(15.5,7.5,'lives',0,0,4),
	//new Pickup(15.5,7.5,'goldkey',0,0,1),
	new Pickup(15.5,16.5,'goldkey',0,0,1),
	new Pickup(15.5,13.5,'chaingun',0,0,0),
	new Pickup(15.5,3.5,'backpack',0,0,5),
];
var weapons_imgs = [];
for(var texture = 0; texture < weapon_names.length;texture++){
    var weaponTexture = new Image();
  	weaponTexture.crossOrigin = "Anonymous";
  	weaponTexture.src = `sprites/weapons/${weapon_names[texture]}.png`;
    weapons_imgs.push(weaponTexture);
}
window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
var wallTextures = [];
var wallTypes = [0,[0,0,88],[106,0,0],[147, 147, 147],[108,69,39],[180, 179, 82],[89,0,90],[0,142,142],[0,142,142],[202,202,202],[124,124,124],[108,69,39]];
for(var texture = 1; texture < 12;texture++){
    var wallTexture = new Image();
  	wallTexture.crossOrigin = "Anonymous";
  	wallTexture.src = `walls_${texture}.png`;
    wallTextures.push(wallTexture);
}
var floorTextures = []
for(var texture = 1; texture < 11;texture++){
    var floorTexture = new Image();
  	floorTexture.crossOrigin = "Anonymous";
  	floorTexture.src = `floor_${texture}.png`;
    floorTextures.push(floorTexture);
}
//var floorData=getimagedata(floorTextures[1]);
var weapon_size = screenWidth*2/3;
mobile = window.mobileAndTabletCheck();
var canvas = $("screen");
var screenWidth = canvas.width;
var screenHeight = canvas.height;
var pickupIsPresent = false;
var pickupNum;
var offcanvas = new OffscreenCanvas(screenWidth,screenHeight);//document.createElement('canvas');//
var ctxfin = canvas.getContext('2d');
var ctx = offcanvas.getContext('2d');
var contentpause = $('text');
var gravity = 0.01;
var stripWidth = 2;
var blood = false;
var panorama=true;
var miniMapScale = 8;
var doorIsPresent = false;
var doorTarget = [0,0];
var truefov=60 * Math.PI / 180;
var adsmul = 1;
var fov = truefov*adsmul;
var numRays = Math.ceil(screenWidth / stripWidth);
var fovHalf = fov / 2;
var viewDist = (screenWidth/2) / Math.tan((fov / 2));
var ceiling = false;
var twoPI = Math.PI * 2;
var fps = 0;
var joyMoving;
var joyMovingDir;
var posZ = (player.height+player.z) * screenHeight;
var dirX = Math.cos(player.rot)/(Math.tan(fovHalf));
var dirY = Math.sin(player.rot)/(Math.tan(fovHalf));
var planeX = -Math.sin(player.rot);
var planeY = Math.cos(player.rot);
var rayDirX0;
var rayDirY0;
var rayDirX1;
var rayDirY1;
var floor=true;
var slider = document.getElementById("myRange");
var floorToggle = document.getElementById("floor");
var rowdistlookup = new Array(Math.ceil(screenHeight));
var orzbuffer = new Array(screenWidth);
var centerStripe = [];
for(var i = 0; i < screenWidth+10;i++){
  orzbuffer[i]=[];
}
function updateFOV(){
  truefov = slider.value*Math.PI/180;
	fov=truefov*adsmul;
  fovHalf = fov/2;
  viewDist = (screenWidth/2) / Math.tan((fov / 2));
  $("fov").innerText = Math.round(truefov*180/Math.PI);
	invDet = 1.0 / (planeX * dirY - dirX * planeY);
	setTimeout(function(){
	  truefov = slider.value*Math.PI/180;
		fov=truefov*adsmul;
	  fovHalf = fov/2;
	  viewDist = (screenWidth/2) / Math.tan((fov / 2));
	  $("fov").innerText = Math.round(truefov*180/Math.PI);
		invDet = 1.0 / (planeX * dirY - dirX * planeY);
	},5)
}
function updateVol(){
  vol = $('volslider').value;
  $("vol").innerText = 100*vol;
}
function togglefps(){
	chromebook=!chromebook;
}
function updateSens(){
  sens = $('sensslider').value;
  $("sens").innerText = sens;
}
function toggleFloor(){
  floor = !floor;
	if(!chromebook){
		stripWidth=3-stripWidth;
		numRays=Math.round(screenWidth/stripWidth);
	}
}
function toggleBlood(){
  blood = !blood;
}
function init() {
  if(mobile){
    joyMoving = new JoyStick('moving',{
        // The ID of canvas element
        title: 'joystick',
        // width/height
        width: 100,
        height: 100,
        // varernal color of Stick
        varernalFillColor: '//00AA00',
        // Border width of Stick
        varernalLineWidth: 2,
        // Border color of Stick
        varernalStrokeColor: '//003300',
        // External reference circonference width
        externalLineWidth: 2,
        //External reference circonference color
        externalStrokeColor: '//008000',
        // Sets the behavior of the stick
        autoReturnToCenter: true

    });
    joyMovingDir = joyMoving.GetDir();
  }

  canvas.addEventListener("click", async () => {
		if(textscreen!=='You Won!'){
	    await canvas.requestPointerLock();
			panorama=false;
			contentpause.style.display = "none";
	    document.addEventListener("mousemove", updateMousePosition, false);
			gameIsOn=true;
		}
  });
  drawFillRectangle(0,0,screenWidth,screenHeight/2,'//429bf5');
  drawFillRectangle(0,screenHeight/2,screenWidth,screenHeight/2,'//c0a570');
	bind();
	weapon_size = screenWidth/2;
  for (var y=0;y<mapHeight;y++) {
    for (var x=0;x<mapWidth;x++) {
      var wall = map[y][x];
      if(wall === 8 || wall === 9 || wall === 10 || wall === 11 || wall===12){
        if(map[y][x-1]>0){
          doorDirs[y][x] = 1;
        }
      }
    }
  }
	ctx.imageSmoothingEnabled = false;
	drawMiniMap();
	var bgsound = document.createElement("audio");
	//bgsound.src = 'sounds/'+'background/track1'+'.mp3';
	//sound.setAttribute("preload", "auto");
	//bgsound.setAttribute("controls", "none");
	//bgsound.style.display = "none";
	//bgsound.volume=Math.min(vol,1);
	//bgsound.loop=true;
	//document.body.appendChild(sound);
	//bgsound.play();
	gameCycle();
	renderCycle();
}


var lastGameCycleTime = 0;
var gameCycleDelay = 1000 / 60; // aim for 60 fps for game logic
var mousePos = [0,0];
var prevMousePos = [0,0];
function gameCycle() {
	var now = new Date().getTime();
	// time since last game logic
	var timeDelta = now - lastGameCycleTime;
	if(panorama){
		player.dir=0.03;
		player.pitchChange=0;
		player.pitch=0;
		player.xSpeed=0;
		player.ySpeed=0;
		move(timeDelta);
	}
	if(gameIsOn){
	  if(mobile){
	    if(joyMoving.GetDir() !== joyMovingDir){
	      joyMovingDir = joyMoving.GetDir();
	      switch(joyMovingDir){
	        case 'N': // up, move player forward, ie. increase speed
	  				player.speed = 1;
	          player.strafeSpeed = 0;
	  				break;

	  			case 'S': // down, move player backward, set negative speed
	  				player.speed = -1;
	          player.strafeSpeed = 0;
	  				break;

	        case 'W': // strafe left
	    			player.speed = 0;
	  				player.strafeSpeed = 1;
	  				break;

	  			case 'E': // strafe right
	    			player.speed = 0;
	  				player.strafeSpeed = -1;
	          break;
	        case 'NW': // up, move player forward, ie. increase speed
	  				player.speed = 1;
	          player.strafeSpeed = 1;
	  				break;

	  			case 'NE': // down, move player backward, set negative speed
	  				player.speed = 1;
	          player.strafeSpeed = -1;
	  				break;

	        case 'SW': // strafe left
	    			player.speed = -1;
	  				player.strafeSpeed = 1;
	  				break;

	  			case 'SE': // strafe right
	    			player.speed = -1;
	  				player.strafeSpeed = -1;
	  				break;
	        case 'C':
	          player.speed = 0;
	          player.strafeSpeed = 0;
	          break;

	      }
	    }
	  }
	  if(document.pointerLockElement === canvas){
	    temp = JSON.parse(JSON.stringify(mousePos));
	    diffX = temp[0]-prevMousePos[0];
	    diffY = temp[1]-prevMousePos[1];
	    if(diffX > 0.5){player.dir = 0.05*(diffX*sens*(4*adsmul-3)-0.5);}
	    if(diffX < -0.5){player.dir = 0.05*(diffX*sens*(4*adsmul-3)+0.5);}
	    if(Math.abs(diffX)<=0.5){player.dir = 0;}
	    if(diffY > 0){player.pitchChange = -diffY*sens*0.75;}
	    if(diffY < 0){player.pitchChange = -diffY*sens*0.75;}
	    if(diffY === 0){player.pitchChange = 0;}
	    prevMousePos = JSON.parse(JSON.stringify(temp));
	  }
		else{
			contentpause.style.display = "block";
			gameIsOn=false;
		}
	  var x_target,y_target;
	  var x_move,y_move;
	  x_target = Math.floor(player.x);
	  y_target = Math.floor(player.y);
	  if(Math.abs(dirX)>Math.abs(dirY)){
	    x_move = Math.round(dirX/Math.abs(dirX));
	    y_move = Math.round(dirY/Math.abs(dirX));
	  }
	  else if(Math.abs(dirX)<=Math.abs(dirY)){
	    x_move = Math.round(dirX/Math.abs(dirY));
	    y_move = Math.round(dirY/Math.abs(dirY));
	  }
	  count = 0;
	  x_target+=x_move;
	  y_target+=y_move;
	  while(1){
			if(y_target < 0 || y_target >= mapHeight || x_target < 0 || x_target >= mapWidth){
				break;
		  }
	    if(map[Math.floor(y_target)][Math.floor(x_target)] === 8 || map[Math.floor(y_target)][Math.floor(x_target)] === 9 || map[Math.floor(y_target)][Math.floor(x_target)] === 10 || map[Math.floor(y_target)][Math.floor(x_target)] === 11){
	      doorIsPresent = true;
	      doorTarget = [x_target,y_target];
	      break;
	    }else{
	      x_target+=x_move;
	      y_target+=y_move;
	    }
	    count++;
	    if(count>2||Math.floor(y_target)>=mapHeight||Math.floor(y_target)<0||Math.floor(x_target)>=mapWidth||Math.floor(x_target)<0){doorIsPresent = false;break;}
	  }
		pickupIsPresent = false;
		pickups.forEach(pickup => function(pickup){
			if(((pickup.x-player.x)**2+(pickup.y-player.y)**2)**0.5 < 1){
				if((pickup.type===0&&pickup.gun!==player.maxWeapon)||pickup.type!==0){
					pickupIsPresent = true;
					pickupNum = pickups.indexOf(pickup);
				}
			}
		}(pickup));
		move(timeDelta);
		player.update(timeDelta);
		//handle weapon
		if(player.weaponIsActive || player.weaponTimer > 0){
			if(player.ammo[player.weapon]<=0){
				player.weaponTimer=Math.min(player.weaponTimer,0);
				player.weaponState=Math.min(player.weaponState,0);
				player.weaponIsActive = false;
			}
			else{
				player.weaponTimer+=timeDelta*5/(2*player.firerate[player.weapon]);
				if(player.weaponTimer>4){
					if(player.weapon > 1){
						if(player.weaponIsActive){
							player.weaponTimer=2;
						}else{
							if(player.weaponTimer>5){
								player.weaponTimer = 0;
							}
						}
					}else if(player.weapon < 1){
						if(player.weaponTimer > 5){
							player.weaponTimer=0;
						}
					}else if(player.weaponTimer > 5){
						player.weaponTimer=0;
						player.weaponIsActive = false;
					}
				}
				var newthing = Math.floor(player.weaponTimer);
				if(newthing!==player.weaponState){
					if(player.weapon===0){
						if(newthing==3){
							//fire knife
							player.fire(centerStripe);
							player.atkount++;
						}
					}else if(player.weapon===1){
						if(newthing===2){
							player.ammo[1]-=1;
							//bullet
							player.fire(centerStripe);
						}
					}else if(player.weapon===2){
						if(newthing===2){
							player.ammo[2]-=1;
							//bullet
							player.fire(centerStripe);
						}
					}else{
						if(newthing===3||newthing===2){
							player.ammo[3]-=1;
							//bullet
							player.fire(centerStripe);
						}
					}
				}
				player.weaponState = newthing;
			}
		}
	}
	if(player.lives>=0){
		setTimeout(gameCycle, cycleDelay);
		lastGameCycleTime = now;
	}
	var cycleDelay = gameCycleDelay;
	// the timer will likely not run that fast due to the rendering cycle hogging the cpu
	// so figure out how much time was lost since last cycle
	if(timeDelta > cycleDelay) {
		cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
	}
}
function sign(num){
  return Math.round(num/Math.abs(num));
}
function between(a,x,b){
  return (a<=x && x<=b)||(b<=x && x<=a)
}
var posZ;
var invDet = 1.0 / (planeX * dirY - dirX * planeY); //required for correct matrix multiplication;
var lastRenderCycleTime = 0;
var drawFillRectangle = function(x, y, width, height, cssColor){
		ctx.fillStyle = cssColor;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
    ctx.fill();
};
var drawFillRectangleRGBA = function(x, y, width, height,cssColor){
		ctx.fillStyle = `rgba(${cssColor[0]},${cssColor[1]},${cssColor[2]},${cssColor[3]})`;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
    ctx.fill();
};
var drawWallSliceRectangle = function(x, y, width, height, xOffset,texture){
  var wallTexture = wallTextures[texture-1]
	ctx.drawImage(wallTexture, Math.floor(xOffset*wallTexture.width/2), 0,
		1, wallTexture.height,
		x, y, width, height);
}
var drawFloorRectangle = function(x, y, width, height, xOffset,yOffset,texture){
  var floorTexture = floorTextures[texture-1]
	ctx.drawImage(floorTexture, Math.floor(((xOffset%0.5)+0.5)*floorTexture.width), Math.floor((yOffset%1)*floorTexture.height),
		1, 1,
		x, y, width, height);
}
var drawCeilRectangle = function(x, y, width, height, xOffset,yOffset,texture){
  var ceilTexture = wallTextures[texture-1]
	ctx.drawImage(ceilTexture, Math.floor((xOffset%0.5)*ceilTexture.width), Math.floor((yOffset%0.5)*ceilTexture.height),
		1, 1,
		x, y, width, height);
}
var circle = function(x,y,radius){
  ctx.beginPath();
  ctx.arc(x,y,radius,0,Math.PI * 2, false);
  ctx.fill();
};
function renderCycle() {
		if(true){
			ctx.clearRect(0,0,screenWidth,screenHeight);
		  posZ = (player.height+player.z) * screenHeight;
		  dirX = Math.cos(player.rot)/(Math.tan(fovHalf));
		  dirY = Math.sin(player.rot)/(Math.tan(fovHalf));
		  planeX = -Math.sin(player.rot);
		  planeY = Math.cos(player.rot);
			if(!lode){
				for(var y = 0; y<=screenHeight; y+=stripWidth){
					if(y===screenHeight/2+player.pitch){break;}
					rowdistlookup[y] = posZ/(y - screenHeight / 2 - player.pitch);
				}
			}
		  updateMiniMap();
			drawFillRectangle(0,0,screenWidth,screenHeight,fill="#FFFFFF");
		  if(!floor){
				drawFillRectangle(0,0,screenWidth,screenHeight,'#787878');
			}else{
				if(useGPU){
				  var rayDirX0 = dirX - planeX;
				  var rayDirY0 = dirY - planeY;
				  var rayDirX1 = dirX + planeX;
				  var rayDirY1 = dirY + planeY;
					var floorImage = renderFloorCeilLode(player,screenHeight,screenWidth,planeX,planeY,rayDirX0,rayDirY0,floorData).getCanvas();
					ctx.drawImage(floorImage,0,0);
				}
				if(lode){
				  var rayDirX0 = dirX - planeX;
				  var rayDirY0 = dirY - planeY;
				  var rayDirX1 = dirX + planeX;
				  var rayDirY1 = dirY + planeY;
				  // rayDir for leftmost ray (x = 0) and rightmost ray (x = w)
				  var posZ = (player.height+player.z) * screenHeight;
				  for(var y = screenHeight/2+player.pitch+stripWidth; y < screenHeight; y+=stripWidth){
				    var p = y - screenHeight / 2 - player.pitch;
				    // Vertical position of the camera.
				    // Horizontal distance from the camera to the floor for the current row.
				    // 0.5 is the z position exactly in the middle between floor and ceiling.
				    var rowDistance = (posZ)/ (p);
				    // calculate the real world step vector we have to add for each x (parallel to camera plane)
				    // adding step by step avoids multiplications with a weight in the inner loop
				    var floorStepX = stripWidth * rowDistance * (2*0.847826*planeX) / (screenWidth);
				  	var floorStepY = stripWidth * rowDistance * (2*0.847826*planeY) / (screenWidth);
				    // real world coordinates of the leftmost column. This will be updated as we step to the right.
				    var floorX = player.x + rowDistance * 0.847826 * rayDirX0;
				    var floorY = player.y + rowDistance * 0.847826 * rayDirY0;

				    for(var x = 0; x < screenWidth; x+=stripWidth){
				      var tx = floorX%1;
				      var ty = floorY%1;
				      floorX += floorStepX;
			      	floorY += floorStepY;
			        // floor drawing
			        drawFloorRectangle(x,y,stripWidth,stripWidth,tx,ty,2);
					  }
					}
				}
			}
			drawFillRectangle(0,0,screenWidth,screenHeight/2+player.pitch+25*(player.height+player.z-0.5),'#87CEEB');
			castWallRays();
			//weapon
			ctx.drawImage(weapons_imgs[player.weapon],(1+weapon_sizes[player.weapon])*player.weaponState,0,weapon_sizes[player.weapon],weapon_sizes[player.weapon],screenWidth/2-weapon_size/2*1/adsmul,screenHeight-weapon_size*(1.5-0.5*adsmul),weapon_size*1/adsmul,weapon_size*1/adsmul);
			//crosshair
		  {
				drawFillRectangle(screenWidth/2-50/2,screenHeight/2-2/2,40/2,4/2,'#00FF00');
			  drawFillRectangle(screenWidth/2+10/2,screenHeight/2-2/2,40/2,4/2,'#00FF00');
			  drawFillRectangle(screenWidth/2-2/2,screenHeight/2-50/2,4/2,40/2,'#00FF00');
			  drawFillRectangle(screenWidth/2-2/2,screenHeight/2+10/2,4/2,40/2,'#00FF00');
				circle(screenWidth/2,screenHeight/2,4/2);
			}
			if(pickupIsPresent){
					ctx.font = "bold 20px Courier New";
					ctx.fillStyle = "#FFFF66";
					ctx.textAlign = "center";
					ctx.fillText("Press [G] pick up "+pickups[pickupNum].name, screenWidth/2, screenHeight-25);
			}
		  else if(doorIsPresent&&(map[doorTarget[1]][doorTarget[0]] === 8 || map[doorTarget[1]][doorTarget[0]] === 9 || map[doorTarget[1]][doorTarget[0]] === 10)){
		      ctx.font = "bold 20px Courier New";
		      ctx.fillStyle = "#FFFF66";
		      ctx.textAlign = "center";
		      ctx.fillText("Press [G] to interact with door", screenWidth/2, screenHeight-25);
		  }
			// time since last rendering
			var now = new Date().getTime();
			var timeDelta = now - lastRenderCycleTime;
			var cycleDelay = 1000 / 60;
			if(timeDelta > cycleDelay) {
				cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
			}
			lastRenderCycleTime = now;
			fps = 1000 / timeDelta;
			drawFillRectangleRGBA(screenWidth-50,screenHeight-15,50,15,[170,170,170,0.8]);
			drawFillRectangleRGBA(39,screenHeight-15,75,15,[170,170,170,0.8]);
		  ctx.font = "15px monospace";
		  ctx.fillStyle = "white";
		  ctx.textAlign = "left";
		  ctx.fillText("FPS: "+Math.round(fps),50,50);
		  ctx.textAlign = "center";
		  ctx.fillText(player.ammo[player.weapon]+'/'+player.maxAmmo[player.weapon],screenWidth-25,screenHeight);
		  ctx.fillText(Math.round(player.hp)+'/'+player.maxHp,39+75/2,screenHeight);
		  ctx.fillText('LIVES: '+player.lives,screenWidth/2-75,screenHeight);
		  ctx.fillText('SCORE: '+player.score,screenWidth/2-25/2+75,screenHeight);
			ctx.drawImage(playerhpIcons,25,33*(7-Math.ceil(player.hp*7/player.maxHp)),24,31,15,screenHeight-30,24,30);
			ctx.drawImage(weaponIcons,0,0,48,24,screenWidth-50,screenHeight-30,50,15);
			ctx.drawImage(weaponIcons,49*1,0,48,24,screenWidth-50,screenHeight-45,50,15);
			if(player.maxWeapon > 1) ctx.drawImage(weaponIcons,49*player.maxWeapon,0,48,24,screenWidth-50,screenHeight-60,50,15);
			for(var i = 0; i < player.keys; i++){
				ctx.drawImage(playerKeysIcons,i*9,0,8,16,screenWidth-66,screenHeight-30*(2-i),16,30);
			}
		  ctx.fillText(scoretext,screenWidth/2-25/2,screenHeight/2-5);
			drawFillRectangleRGBA(screenWidth-50,screenHeight-15*(2+Math.min(2,player.weapon)),50,15,[170,170,170,0.4]);
			drawFillRectangleRGBA(0,0,screenWidth,screenHeight,[255,0,0,0.5*Math.max(1-player.hp/(player.maxHp*3/4),0)]);
		}
		if(!gameIsOn){
			//draw the text thing
			//drawFillRectangle(0,0,screenWidth,screenHeight,'rgb(8,144,144)');
		  ctx.font = "15px monospace";
		  ctx.fillStyle = "white";
		  ctx.textAlign = "left";
		  ctx.textAlign = "center";
		  ctx.fillText(textscreen,screenWidth/2-25/2,screenHeight/2-5);
		  ctx.fillText('LIVES: '+player.lives,screenWidth/2-25/2,screenHeight*3/4);
		}
		ctxfin.drawImage((offcanvas.transferToImageBitmap()),0,0,screenWidth,screenHeight);
		setTimeout(renderCycle, 1);
}

function updateMousePosition(e) {
  if(document.pointerLockElement === canvas){
    mousePos[0] += e.movementX;
    mousePos[1] += e.movementY;
  }
}

// bind keyboard events to game functions (movement, etc)
function bind() {
	document.onmousedown = function(e){
		if(document.pointerLockElement === canvas){
			if(e.which === 3 || e.which===2){
				playsound('weapons/aim_1')
				adsmul=0.8;
				fov=truefov*adsmul;
			  fovHalf = fov/2;
			  viewDist = (screenWidth/2) / Math.tan((fov / 2));
			  dirX = Math.cos(player.rot)/(Math.tan(fovHalf));
			  dirY = Math.sin(player.rot)/(Math.tan(fovHalf));
			  planeX = -Math.sin(player.rot);
			  planeY = Math.cos(player.rot);
				invDet = 1.0 / (planeX * dirY - dirX * planeY);
			}else if(e.which===1){
				player.weaponIsActive = true;
			}
		}
	}
	document.onmouseup = function(e){
		if(e.which===3 || e.which===2){
			playsound('weapons/aim_0');
			adsmul=1;
			fov=truefov*adsmul;
			fovHalf = fov/2;
			viewDist = (screenWidth/2) / Math.tan((fov / 2));
			dirX = Math.cos(player.rot)/(Math.tan(fovHalf));
			dirY = Math.sin(player.rot)/(Math.tan(fovHalf));
			planeX = -Math.sin(player.rot);
			planeY = Math.cos(player.rot);
			invDet = 1.0 / (planeX * dirY - dirX * planeY);
		}else if(e.which===1){
			player.weaponIsActive = false;
		}
	}
	document.onkeydown = function(e) {
		e = e || window.event;
		switch (e.keyCode) { // which key was pressed?
			case 49:
				playsound('weapons/melee_equip');
				player.weapon=Math.min(player.maxWeapon,0);
				break;
			case 50:
				player.weapon=Math.min(player.maxWeapon,1);
				break;
			case 51:
				player.weapon=Math.min(player.maxWeapon,2);
				break;
			case 52:
				player.weapon=Math.min(player.maxWeapon,3);
				break;
      case 71:
        isPressingG = true;
        break;
			case 84:
        player.primary();
				player.weaponState = 0;
				player.weaponTimer = 0;
        break;
			case 69:
        player.secondary();
				player.weaponState = 0;
				player.weaponTimer = 0;
        break;
			case 81:
        player.melee();
				player.weaponState = 0;
				player.weaponTimer = 0;
        break;
			case 27:
			    contentpause.style.display = "block";
					gameIsOn=false;
					textscreen='Paused';
				break;
  		case 16: // crouch
  			player.isCrouching = true;
  			break;
			case 82://reload
				player.reload();
				break;
			case 13: // fire
  			player.weaponIsActive=true;
  			break;
			case 32: // jump
        player.isJumping = true;
				break;
			case 38: // up
				player.pitchChange = 2;
				break;
			case 40: // down
				player.pitchChange = -2;
				break;
      case 87: // up, move player forward, ie. increase speed
  				player.speed = 1;
  				break;
			case 83: // down, move player backward, set negative speed
				player.speed = -1;
				break;
      case 65: // strafe left
				player.strafeSpeed = 1;
				break;
			case 68: // strafe right
				player.strafeSpeed = -1;
				break;
			case 37: // left, rotate player left
				player.dir = -1;
				break;
			case 39: // right, rotate player right
				player.dir = 1;
				break;
		}
	}
	document.onkeyup = function(e) {
		e = e || window.event;

		switch (e.keyCode) {
      case 71:
        isPressingG = false;
        break;
			case 13: // fire
  			player.weaponIsActive=false;
  			break;
  		case 16:
				player.isCrouching = false;
  			player.height = 0.5;
        player.speedMult = 1;
  			break;
      case 32:
        player.isJumping = false;
		 case 38: // up
     case 40: // down
        player.pitchChange = 0;
      	break;
			case 87:
			case 83:
				player.speed = 0;	// stop the player movement when up/down key is released
				break;
			case 65:
			case 68:
				player.strafeSpeed = 0;	// stop the player movement when up/down key is released
				break;
			case 37:
			case 39:
				player.dir = 0;
				break;
		}
	}
}
if(useGPU){
	const gpu = new GPU.GPU();
	const renderFloorCeilLode = gpu.createKernel(function(player,screenHeight,screenWidth,planeX,planeY,rayDirX0,rayDirY0,data){
  // rayDir for leftmost ray (x = 0) and rightmost ray (x = w)
  const posZ = (player.height+player.z) * screenHeight;
  const is_floor = this.thread.y > screenHeight / 2 + player.pitch;
  // Current y position compared to the center of the screen (the horizon)
  const p = is_floor?(this.thread.y - screenHeight / 2 - player.pitch):(screenHeight / 2 - this.thread.y + player.pitch);
  // Vertical position of the camera.
  // Horizontal distance from the camera to the floor for the current row.
  // 0.5 is the z position exactly in the middle between floor and ceiling.
  const rowDistance = (is_floor?(posZ):(screenHeight-posZ)) / (p);
  // calculate the real world step vector we have to add for each x (parallel to camera plane)
  // adding step by step avoids multiplications with a weight in the inner loop
  const floorStepX = stripWidth * rowDistance * (2*0.847826*planeX) / (screenWidth);
	const floorStepY = stripWidth * rowDistance * (2*0.847826*planeY) / (screenWidth);
  // real world coordinates of the leftmost column. This will be updated as we step to the right.
  let floorX;
  let floorY;
  floorX = player.x + rowDistance * ((2*this.thread.x/screenWidth-1)*planeX);
  floorY = player.y + rowDistance * ((2*this.thread.x/screenWidth-1)*planeY);
  // choose texture and draw the pixel
  if(is_floor){
    //drawFloorRectangle(this.thread.x,this.thread.y,stripWidth,stripWidth,floorX%1,floorY%1,2);
		this.color(100,8,100);
		var n = 4 * (this.thread.x + this.constants.w * (this.constants.h - this.thread.y) );
		this.color(data[n]/256, data[n+1]/256,data[n+2]/256,1);
  }else{
    //drawCeilRectangle(x,y,stripWidth,stripWidth,tx,ty,4);
  }}).setOutput([screenWidth,screenHeight]).setGraphical(true);
}
function castWallRays() {
  var stripIdx = 0;
	var zbufferenem = renderEnemies();
	var spritesl = renderSprites();
	var pickupsl = renderPickups();
	var zbuffer = JSON.parse(JSON.stringify(orzbuffer))
	for(var thing = 0;thing<numRays;thing++){
		zbuffer[thing]=zbufferenem[thing].concat(spritesl[thing]).concat(pickupsl[thing]);
	}
	for (var i=0;i<numRays;i++) {
    if(!ceiling){
      //skybox
      /*ctx.drawImage(skydomeTexture, Math.floor((skydomeTexture.width)*((player.rot + rayAngle+2*Math.PI)/(Math.PI)%1)), 0,
    		1, skydomeTexture.height,
    		stripIdx*stripWidth, 0, stripWidth, screenHeight);*/

    }
		castSingleRay(
			stripIdx++,
			zbuffer
		);
	}
}
function castSingleRay(stripIdx,zbuffer) {
  // determine the hit point
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
		//var sideDistX = right?((mapX + 1.0 - player.x) * deltaDistX):((player.x - mapX) * deltaDistX);
		//var sideDistY = up?((player.y - mapY) * deltaDistY):((mapY + 1.0 - player.y) * deltaDistY);
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
		//var hit;
    var slope = rayDirY / rayDirX; 	// the slope of the straight line made by the ray
  	var dXVer = right ? 1 : -1; 	// we move either 1 map unit to the left or right
  	var dYVer = dXVer * slope; 	// how much to move up or down
  	var dYHor = up ? -1 : 1;
  	var dXHor = dYHor / slope;
    var x = (right) ? Math.ceil(player.camerax) : Math.floor(player.camerax);	// starting horizontal position, at one of the edges of the current map block
    var y = player.cameray + (x - player.camerax) * slope;// starting vertical position. We add the small horizontal step we just made, multiplied by the slope.
    while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
    		var wallX = Math.floor(x + (right ? 0 : -1));
    		var wallY = Math.floor(y);
    		// is this point inside a wall block?
    		if(map[wallY][wallX] !== 0){
          if(map[wallY][wallX]===8||map[wallY][wallX]===9 ||map[wallY][wallX]===10){
						if(doorDirs[wallY][wallX]===0){
	            x_maybe=x+dXVer/2;
	            y_maybe=y+dYVer/2;
	            if((y_maybe-wallY) <= 1-doorOffsets[wallY][wallX]){
	              var distX = x_maybe - player.camerax;
	        			var distY = y_maybe - player.cameray;
	        			textureX = (y_maybe+doorOffsets[wallY][wallX]) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
	        			textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
								var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,planeY * distX - planeX * distY);
	              hits.push(front);
	              if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
	        			    break;
	              }
	            }
	          }
					}
          else if(map[wallY][wallX]===11){
              x_maybe=x+dXVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
              y_maybe=y+dYVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
            if(y_maybe-wallY <= 1 && y_maybe-wallY >= 0){
              var distX = x_maybe - player.camerax;
              var distY = y_maybe - player.cameray;
                textureX = (y_maybe) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
                if(!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
								var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,planeY * distX - planeX * distY);
								if(up){
									if(Math.abs(dXVer)>Math.abs(dXHor*(y%1))){
										var distXNew = x+dXHor*(y%1)-player.camerax;
										var distYNew = y+dYHor*(y%1)-player.cameray;
									}else{
										var distXNew = x+dXVer-player.camerax;
										var distYNew = y+dYVer-player.cameray;
									}
								}else{
									if(Math.abs(dXVer)>Math.abs(dXHor*(1-y%1))){
										var distXNew = x+dXHor*(1-y%1)-player.camerax;
										var distYNew = y+dYHor*(1-y%1)-player.cameray;
									}else{
										var distXNew = x+dXVer-player.camerax;
										var distYNew = y+dYVer-player.cameray;
									}
								}
								var back = planeY * distXNew - planeX * distYNew;
                hits.push(new WallStripe(front,back));
                if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
          			    break;
              }
            }
          }
					else if(map[wallY][wallX]===12){
						if(doorDirs[wallY][wallX]===0){
							var x_maybe=x+dXVer/2;
							var y_maybe=y+dYVer/2;
							if(y_maybe<=1+wallY){
								var distX = x_maybe - player.camerax;
								var distY = y_maybe - player.cameray;
								var front = new GlassPaneStripe(wallX,wallY,stripIdx*stripWidth,planeY * distX - planeX * distY);
								hits.push(front);
							}
						}
					}
					else if(map[wallY][wallX]<8){
	          var distX = x - player.x;
	    			var distY = y - player.y;
	      			textureX = y % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
	      			if(!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,true,planeY * distX - planeX * distY);
							if(up){
								if(Math.abs(dXVer)>Math.abs(dXHor*(y%1))){
									var distXNew = x+dXHor*(y%1)-player.camerax;
									var distYNew = y+dYHor*(y%1)-player.cameray;
								}else{
									var distXNew = x+dXVer-player.camerax;
									var distYNew = y+dYVer-player.cameray;
								}
							}else{
								if(Math.abs(dXVer)>Math.abs(dXHor*(1-y%1))){
									var distXNew = x+dXHor*(1-y%1)-player.camerax;
									var distYNew = y+dYHor*(1-y%1)-player.cameray;
								}else{
									var distXNew = x+dXVer-player.camerax;
									var distYNew = y+dYVer-player.cameray;
								}
							}
							var back = planeY * distXNew - planeX * distYNew;
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
    var y = (up) ? Math.floor(player.cameray) : Math.ceil(player.cameray);
    var x = player.camerax + (y - player.cameray) / slope;
  	while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
  		var wallY = Math.floor(y + (up ? -1 : 0));
  		var wallX = Math.floor(x);
  		if(map[wallY][wallX]  !== 0) {
        if(map[wallY][wallX]===8 || map[wallY][wallX]===9 || map[wallY][wallX]===10){
					if(doorDirs[wallY][wallX]===1){
	          x_maybe=x+dXHor/2;
	          y_maybe=y+dYHor/2;
	          if(x_maybe-wallX <= 1-doorOffsets[wallY][wallX] && x_maybe-wallX >= 0){
	            var distX = x_maybe - player.camerax;
	            var distY = y_maybe - player.cameray;
	              textureX = (x_maybe+doorOffsets[wallY][wallX]) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
	              textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed

								var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,planeY * distX - planeX * distY);
								hits.push(front);
								if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
	                  break;
	              }
	          }
					}
        }
        else if(map[wallY][wallX]===11){
            x_maybe=x+dXHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
            y_maybe=y+dYHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
          if(x_maybe-wallX <= 1 && x_maybe-wallX >= 0){
            var distX = x_maybe - player.camerax;
            var distY = y_maybe - player.cameray;
              textureX = (x_maybe) % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
              if(up) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed
							var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,planeY * distX - planeX * distY);
							if(!right){
								if(Math.abs(dYHor)>Math.abs(dYVer*(x%1))){
									var distXNew = x+dXVer*(x%1)-player.camerax;
									var distYNew = y+dYVer*(x%1)-player.cameray;
								}else{
									var distXNew = x+dXHor-player.camerax;
									var distYNew = y+dYHor-player.cameray;
								}
							}else{
								if(Math.abs(dYHor)>Math.abs(dYVer*(1-x%1))){
									var distXNew = x+dXVer*(1-x%1)-player.camerax;
									var distYNew = y+dYVer*(1-x%1)-player.cameray;
								}else{
									var distXNew = x+dXHor-player.camerax;
									var distYNew = y+dYHor-player.cameray;
								}
							}
							var back = planeY * distXNew - planeX * distYNew;
							hits.push(new WallStripe(front,back));
              if(heightMap[wallY][wallX]>=maxHeight&&(player.height+player.z)<maxHeight){
                  break;
              }
          }
        }
				else if(map[wallY][wallX]===12){
					if(doorDirs[wallY][wallX]===1){
						var x_maybe=x+dXHor/2;
						var y_maybe=y+dYHor/2;
						if(x_maybe<=wallX+1){
							var distX = x_maybe - player.camerax;
							var distY = y_maybe - player.cameray;
							var front = new GlassPaneStripe(wallX,wallY,stripIdx*stripWidth,planeY * distX - planeX * distY);
							hits.push(front);
						}
					}
				}
				else if(map[wallY][wallX]<8){
          var distX = x - player.x;
    			var distY = y - player.y;
    				textureX = x % 1;
    				if(up) textureX = 1 - textureX
						var front = new WallStripeHalf(wallX,wallY,textureX,stripIdx*stripWidth,false,planeY * distX - planeX * distY);
						if(!right){
							if(Math.abs(dXHor)>Math.abs(dXVer*(x%1))){
								var distXNew = x+dXVer*(x%1)-player.camerax;
								var distYNew = y+dYVer*(x%1)-player.cameray;
							}else{
								var distXNew = x+dXHor-player.camerax;
								var distYNew = y+dYHor-player.cameray;
							}
						}else{
							if(Math.abs(dXHor)>Math.abs(dXVer*(1-x%1))){
								var distXNew = x+dXVer*(1-x%1)-player.camerax;
								var distYNew = y+dYVer*(1-x%1)-player.cameray;
							}else{
								var distXNew = x+dXHor-player.camerax;
								var distYNew = y+dYHor-player.cameray;
							}
						}
						var back = planeY * distXNew - planeX * distYNew;
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
		if(!useGPU && !lode){
			if(floor){
				var floorX,floorY,floorTexture;
	      for(var y = stripWidth*Math.round((top+height-stripWidth)/stripWidth); y < screenHeight; y+=stripWidth){
	        var rowDistance = rowdistlookup[y];
	        // calculate the real world step vector we have to add for each x (parallel to camera plane)
	        // adding step by step avoids multiplications with a weight in the inner loop
	        // real world coordinates of the leftmost column. This will be updated as we step to the right.
	        floorX = player.x + rowDistance * (dirX+cameraX*planeX);
	        floorY = player.y + rowDistance * (dirY+cameraX*planeY);
	        // choose texture and draw the pixel
	        /*if((floorX >= mapWidth || floorY >= mapHeight) || (floorX < 0 || floorY < 0) || floorlayout[cellY] === undefined){floorTexture = 2;}else{floorTexture = floorlayout[cellY][cellX];}
	        if(floorTexture === 0 || floorTexture === undefined){floorTexture = 2;}*/
	        // floor drawing
	        drawFloorRectangle(stripIdx*stripWidth,y,stripWidth,stripWidth,floorX%1,floorY%1,2);
	      }
	    }
		}
		hits = hits.concat(zbuffer[stripIdx]).sort(function(x,y){return y.dist-x.dist});
		hits.forEach((element) => element.draw());
		if(stripIdx === Math.floor(numRays/2)){
			centerStripe = hits.toReversed();
		}
  }
}
function canSee(enemy) {
	if(Math.floor(enemy.x)===Math.floor(player.x)&&Math.floor(enemy.y)===Math.floor(player.y)) return true;
  // determine the hit point
  {
		var dist = ((enemy.x-player.x)**2+(enemy.y-player.y)**2)**0.5
		var rayDirX = (player.x-enemy.x)/dist;
		var rayDirY = (player.y-enemy.y)/dist;
		var right = (rayDirX>=0);
		var up = (rayDirY<=0);
    //WALL CASTING
  	var wallType = 0;
		var deltaDistX = Math.abs(1 / rayDirX);
		var deltaDistY = Math.abs(1 / rayDirY);
		//length of ray from current position to next x or y-side
		//var sideDistX = right?((mapX + 1.0 - player.x) * deltaDistX):((player.x - mapX) * deltaDistX);
		//var sideDistY = up?((player.y - mapY) * deltaDistY):((mapY + 1.0 - player.y) * deltaDistY);
  	// first check against the vertical map/wall lines
  	// we do this by moving to the right or left edge of the block we're standing in
  	// and then moving in 1 map unit steps horizontally. The amount we have to move vertically
  	// is determined by the slope of the ray, which is simply defined as sin(angle) / cos(angle).
    var slope = rayDirY / rayDirX; 	// the slope of the straight line made by the ray
  	var dXVer = right ? 1 : -1; 	// we move either 1 map unit to the left or right
  	var dYVer = dXVer * slope; 	// how much to move up or down
  	var dYHor = up ? -1 : 1;
  	var dXHor = dYHor / slope;
    var x = right ? Math.ceil(enemy.x) : Math.floor(enemy.x);	// starting horizontal position, at one of the edges of the current map block
    var y = enemy.y + (x - enemy.x) * slope;// starting vertical position. We add the small horizontal step we just made, multiplied by the slope.
    while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
    		var wallX = Math.floor(x + (right ? 0 : -1));
    		var wallY = Math.floor(y);
				if(((right && wallX>=Math.floor(player.x)) || (!right && wallX<=Math.floor(player.x)))&&((up&&wallY<=Math.floor(player.y))||(!up&&wallY>=Math.floor(player.y)))) break;
	  		// is this point inside a wall block?
    		if(map[wallY][wallX] !== 0){
          if(map[wallY][wallX]===8||map[wallY][wallX]===9 ||map[wallY][wallX]===10){
						if(doorDirs[wallY][wallX]===0){
	            x_maybe=x+dXVer/2;
	            y_maybe=y+dYVer/2;
	            if((y_maybe-wallY) <= 1-doorOffsets[wallY][wallX]){
	              return false;
	            }
	          }
					}
          else if(map[wallY][wallX]===11){
              x_maybe=x+dXVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
              y_maybe=y+dYVer*doorOffsets[wallY][wallX]*(1-doorDirs[wallY][wallX]);
            if(y_maybe-wallY <= 1 && y_maybe-wallY >= 0){
              return false;
            }
          }
					else if(map[wallY][wallX]===12){
						if(doorDirs[wallY][wallX]===0){
							var x_maybe=x+dXVer/2;
							var y_maybe=y+dYVer/2;
							if(y_maybe<=1+wallY){
								return false;
							}
						}
					}
					else if(map[wallY][wallX]<8){
	          return false;
					}
    		}
        x += dXVer;
    		y += dYVer;
  	}
  	// now check against horizontal lines. It's basically the same, just "turned around".
  	// the only difference here is that once we hit a map block,
  	// we check if there we also found one in the earlier, vertical run. We'll know that if dist != 0.
  	// If so, we only register this hit if this distance is smaller.
      var y = up ? Math.floor(enemy.y) : Math.ceil(enemy.y);
    var x = enemy.x + (y - enemy.y) / slope;
  	while (x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
  		var wallY = Math.floor(y + (up ? -1 : 0));
  		var wallX = Math.floor(x);
			if(wallX===Math.floor(player.x)&&wallY===Math.floor(player.y)) break;
			if(((right && wallX>=Math.floor(player.x)) || (!right && wallX<=Math.floor(player.x)))&&((up&&wallY<=Math.floor(player.y))||(!up&&wallY>=Math.floor(player.y)))) break;
  		if(map[wallY][wallX]  !== 0) {
        if(map[wallY][wallX]===8 || map[wallY][wallX]===9 || map[wallY][wallX]===10){
					if(doorDirs[wallY][wallX]===1){
	          x_maybe=x+dXHor/2;
	          y_maybe=y+dYHor/2;
	          if(x_maybe-wallX <= 1-doorOffsets[wallY][wallX] && x_maybe-wallX >= 0){
	            return false;
	          }
					}
        }
        else if(map[wallY][wallX]===11){
            x_maybe=x+dXHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
            y_maybe=y+dYHor*doorOffsets[wallY][wallX]*(doorDirs[wallY][wallX]);
          if(x_maybe-wallX <= 1 && x_maybe-wallX >= 0){
						return false;
          }
        }
				else if(map[wallY][wallX]===12){
					if(doorDirs[wallY][wallX]===1){
						var x_maybe=x+dXHor/2;
						var y_maybe=y+dYHor/2;
						if(x_maybe<=wallX+1){
							return false;
						}
					}
				}
				else if(map[wallY][wallX]<8){
          return false;
        }
  		}
  		x += dXHor;
  		y += dYHor;
  	}
  }
	return true;
}
function renderSprites(){
	var zbuffer=JSON.parse(JSON.stringify(orzbuffer));
  var tempVar = new Array(sprites.length);
  for(var i = 0; i < sprites.length; i++){
    tempVar[i] = [i,((player.camerax - sprites[i].x) * (player.camerax - sprites[i].x) + (player.cameray - sprites[i].y) * (player.cameray - sprites[i].y))]; //sqrt not taken, unneeded
  }
  tempVar.sort(function(a, b){return b[1] - a[1]});
  for(var i = 0; i < sprites.length; i++){
      //translate sprite position to relative to camera
      var num = tempVar[i][0];
      var spriteX = sprites[num].x - player.camerax;
      var spriteY = sprites[num].y - player.cameray;

      //transform sprite with the inverse camera matrix
      // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
      // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
      // [ planeY   dirY ]                                          [ -planeY  planeX ]

      var transformX = invDet * (dirY * spriteX - dirX * spriteY);
      var transformY = invDet * (-planeY * spriteX + planeX * spriteY); //this is actually the depth inside the screen, that what Z is in 3D, the distance of sprite to player, matching sqrt(spriteDistance[i])
			var vMoveScreen = Math.round(-sprites[num].vmove *screenHeight/ transformY);
      var spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));

      //calculate height of the sprite on screen
      var spriteHeight = Math.abs(Math.floor(screenHeight) / (transformY)) / 1; //using "transformY" instead of the real distance prevents fisheye
      //calculate lowest and highest pixel to fill in current stripe
      var drawStartY = Math.round(screenHeight/2 - (1-(player.z+player.height))*spriteHeight-(player.z+player.height))+player.pitch+vMoveScreen;

      //calculate width of the sprite
      var spriteWidth = Math.abs( Math.floor (screenHeight / (transformY)));
      var drawStartX = spriteScreenX-spriteWidth/2;
      var drawEndX = drawStartX+spriteWidth;
      //loop through every vertical stripe of the sprite on screen
      for(var stripe = Math.floor(drawStartX/stripWidth)*stripWidth; stripe < drawEndX; stripe+=stripWidth){
        var texX = (stripe - drawStartX) / spriteWidth
        //the conditions in the if are:
        //1) it's in front of camera plane so you don't see things behind you
        //2) it's on the screen (left)
        //3) it's on the screen (right)
        //4) ZBuffer, with perpendicular distance
        if(transformY > 0 && stripe >= 0 && stripe < screenWidth){
          zbuffer[Math.round(stripe/stripWidth)].push(new SpriteStripe(sprites[num].texture,texX,stripe,drawStartY,spriteHeight,transformY/Math.tan(fovHalf)))
        }
      }
    }
	return zbuffer;
}
function renderEnemies(){
	var zbuffer=JSON.parse(JSON.stringify(orzbuffer));
  var tempVar = new Array(enemies.length);
  for(var i = 0; i < enemies.length; i++){
    tempVar[i] = [i,((player.camerax - enemies[i].x) * (player.camerax - enemies[i].x) + (player.cameray - enemies[i].y) * (player.cameray - enemies[i].y))]; //sqrt not taken, unneeded
  }
  tempVar.sort(function(a, b){return b[1] - a[1]});
  for(var j = 0; j < enemies.length; j++){
    //translate sprite position to relative to camera
    var num = tempVar[j][0];
    var spriteX = enemies[num].x - player.camerax;
    var spriteY = enemies[num].y - player.cameray;

    //transform sprite with the inverse camera matrix
    // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
    // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
    // [ planeY   dirY ]                                          [ -planeY  planeX ]

    var transformX = invDet * (dirY * spriteX - dirX * spriteY);
    var transformY = invDet * (-planeY * spriteX + planeX * spriteY); //this is actually the depth inside the screen, that what Z is in 3D, the distance of sprite to player, matching sqrt(spriteDistance[i])
		var vMoveScreen = Math.round(-enemies[num].z * screenHeight/ transformY);
		var spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));

    //calculate height of the sprite on screen
    var spriteHeight = Math.abs(Math.floor(screenHeight) / (transformY)) / 1; //using "transformY" instead of the real distance prevents fisheye
    //calculate lowest and highest pixel to fill in current stripe
    var drawStartY = Math.round(screenHeight/2 - (1-(player.z+player.height))*spriteHeight-(player.z+player.height))+player.pitch+vMoveScreen;

    //calculate width of the sprite
    var spriteWidth = Math.abs( Math.floor (screenHeight / (transformY)));
    var drawStartX = spriteScreenX-spriteWidth/2;
    var drawEndX = drawStartX+spriteWidth;
		if(enemies[num].state > 4){
			state = 5+Math.floor((enemies[num].state-5)/8);
			var angleOffset = (enemies[num].state-5)%8;
		}else{
			state = enemies[num].state;
			var angleOffset = Math.floor((Math.round(8*(-Math.atan2(-enemies[num].y+player.cameray,-enemies[num].x+player.camerax)+enemies[num].rot)/(2*Math.PI))+8)%8);
		}
    //loop through every vertical stripe of the sprite on screen
    for(var stripe = Math.max(Math.floor(drawStartX/stripWidth)*stripWidth,0); stripe < Math.min(screenWidth,drawEndX); stripe+=stripWidth){
      var texX = Math.max(Math.floor(64*(stripe - drawStartX) / (spriteWidth))%64,0)+65*angleOffset;
      if(transformY > 0){
        zbuffer[Math.round(stripe/stripWidth)].push(new EnemyStripe(enemies[num].texture,texX,stripe,drawStartY,spriteHeight,transformY/Math.tan(fovHalf),state,num))
      }
    }
  }
	return zbuffer;
}
function renderPickups(){
	var zbuffer=JSON.parse(JSON.stringify(orzbuffer));
  var tempVar = new Array(pickups.length);
  for(var i = 0; i < pickups.length; i++){
    tempVar[i] = [i,((player.camerax - pickups[i].x) * (player.camerax - pickups[i].x) + (player.cameray - pickups[i].y) * (player.cameray - pickups[i].y))]; //sqrt not taken, unneeded
  }
  tempVar.sort(function(a, b){return b[1] - a[1]});
  for(var i = 0; i < pickups.length; i++){
      //translate sprite position to relative to camera
      var num = tempVar[i][0];
      var spriteX = pickups[num].x - player.camerax;
      var spriteY = pickups[num].y - player.cameray;

      //transform sprite with the inverse camera matrix
      // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
      // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
      // [ planeY   dirY ]                                          [ -planeY  planeX ]

      var transformX = invDet * (dirY * spriteX - dirX * spriteY);
      var transformY = invDet * (-planeY * spriteX + planeX * spriteY); //this is actually the depth inside the screen, that what Z is in 3D, the distance of sprite to player, matching sqrt(spriteDistance[i])
			var vMoveScreen = Math.round(-pickups[num].vmove *screenHeight/ transformY);
      var spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));

      //calculate height of the sprite on screen
      var spriteHeight = Math.abs(Math.floor(screenHeight) / (transformY)) / 1; //using "transformY" instead of the real distance prevents fisheye
      //calculate lowest and highest pixel to fill in current stripe
      var drawStartY = Math.round(screenHeight/2 - (1-(player.z+player.height))*spriteHeight-(player.z+player.height))+player.pitch+vMoveScreen;

      //calculate width of the sprite
      var spriteWidth = Math.abs( Math.floor (screenHeight / (transformY)));
      var drawStartX = spriteScreenX-spriteWidth/2;
      var drawEndX = drawStartX+spriteWidth;
      //loop through every vertical stripe of the sprite on screen
      for(var stripe = Math.floor(drawStartX/stripWidth)*stripWidth; stripe < drawEndX; stripe+=stripWidth){
        var texX = (stripe - drawStartX) / spriteWidth
        //the conditions in the if are:
        //1) it's in front of camera plane so you don't see things behind you
        //2) it's on the screen (left)
        //3) it's on the screen (right)
        //4) ZBuffer, with perpendicular distance
        if(transformY > 0 && stripe >= 0 && stripe < screenWidth){
          zbuffer[Math.round(stripe/stripWidth)].push(new SpriteStripe(pickups[num].texture,texX,stripe,drawStartY,spriteHeight,transformY/Math.tan(fovHalf)))
        }
      }
    }
	return zbuffer;
}
function drawRay(rayX, rayY) {
	var miniMapObjects = $("minimapobjects");
	var objectCtx = miniMapObjects.getContext("2d");

	objectCtx.strokeStyle = "rgba(0,100,0,0.3)";
	objectCtx.lineWidth = 0.5;
	objectCtx.beginPath();
	objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
	objectCtx.lineTo(
		rayX * miniMapScale,
		rayY * miniMapScale
	);
	objectCtx.closePath();
	objectCtx.stroke();
}

function move(timeDelta) {
  // time timeDelta has passed since we moved last time. We should have moved after time gameCycleDelay,
  // so calculate how much we should multiply our movement to ensure game speed is constant
  var mul = timeDelta / gameCycleDelay;
	if(gameIsOn&&!panorama) ai(mul);
  if(isPressingG){
		isPressingG=false;
		if(pickupIsPresent){
			if(pickups[pickupNum].type===0){
				player.maxWeapon = Math.max(player.maxWeapon,pickups[pickupNum].gun);
				player.primary();
				playsoundWAV('pickups/ALCGUNUP');
			}else if(pickups[pickupNum].type===1){
				player.keys+=1;
				playsoundWAV('pickups/ALGETKEY');
			}else if(pickups[pickupNum].type===2){
				if(player.ammoPack>=0&&(player.maxAmmo[player.weapon]-player.ammo[player.weapon])<8){
					player.ammoPack+=8;
					playsoundWAV('pickups/ALAMMOUP');
				}else if(player.weapon!==0){
					//stuff
					player.ammo[player.weapon] = Math.min(player.ammo[player.weapon]+8,player.maxAmmo[player.weapon]);
					playsoundWAV('pickups/ALAMMOUP');
				}
			}else if(pickups[pickupNum].type===3){
				player.hp=Math.min(player.hp+10,player.maxHp);
				playsoundWAV('pickups/ALFOODUP');
			}else if(pickups[pickupNum].type===4){
				player.lives++;
				player.hp=100;
				player.ammoPack+=25;
				playsoundWAV('pickups/ALBNS1UP');
			}else if(pickups[pickupNum].type===5){
				player.ammoPack=10;
				playsoundWAV('pickups/ALAMMOUP');
			}
			pickups.splice(pickupNum, 1);
			pickupIsPresent = false;
		}else{
	    var x_target = doorTarget[0];
	    var y_target = doorTarget[1];
	    if(doorIsPresent){
	      if(map[Math.floor(y_target)][Math.floor(x_target)]!==11&&(map[Math.floor(y_target)][Math.floor(x_target)]!==10||player.keys>=2)){
	        doorStates[Math.floor(y_target)][Math.floor(x_target)] = 1-Math.round(doorOffsets[Math.floor(y_target)][Math.floor(x_target)]);
					playsoundWAV('environ/Door');
	      }else if(true){
	        if(doorDirs[Math.floor(y_target)][Math.floor(x_target)]==1){
	          if(player.y>y_target){
	            doorStates[Math.floor(y_target)][Math.floor(x_target)]=1;
	          }else{
	            doorStates[Math.floor(y_target)][Math.floor(x_target)]=0;
	          }
	        }else{
	          if(player.x>y_target){
	            doorStates[Math.floor(y_target)][Math.floor(x_target)]=1
	          }else{
	            doorStates[Math.floor(y_target)][Math.floor(x_target)]=0;
	          }
	        }
				}
	    }
		}
  }
  for (var y=0;y<mapHeight;y++) {
    for (var x=0;x<mapWidth;x++) {
      wall = map[y][x];
      if(wall === 8 || wall === 9 || wall === 10){
        if(doorOffsets[y][x]+(doorStates[y][x]-0.5)*mul*0.02 >= 0.95){doorOffsets[y][x] = 0.95;doorStates[y][x]=0.5;}
        else if(doorOffsets[y][x]+(doorStates[y][x]-0.5)*mul*0.02 <= 0){doorOffsets[y][x] = 0;doorStates[y][x]=0.5;}
        else{
          if(doorStates[y][x] === 1){doorOffsets[y][x]+=(doorStates[y][x]-0.5)*mul*0.02;}
          else if(doorStates[y][x] === 0 && !(x < player.x && player.x < x+1 && y<player.y && player.y <y+1 )){
            doorOffsets[y][x]+=(doorStates[y][x]-0.5)*mul*0.02;
          }
        }
        if(doorStates[y][x]==0.5 && doorOffsets[y][x] >= 0.95){
          if(doorTimers[y][x]+mul*0.01 >= 1){doorTimers[y][x]=0;doorStates[y][x]=0;}
          else{
            doorTimers[y][x]+=mul*0.01;
          }
        };
      }
      else if(wall===11){
        doorOffsets[y][x]+=Math.abs(doorStates[y][x]-0.5)*mul*0.02;
        if(doorOffsets[y][x]>=1){
          var next_x = x+(1-doorDirs[y][x])*sign(doorStates[y][x]-0.5);
          var next_y = y-(doorDirs[y][x])*sign(doorStates[y][x]-0.5);
          if(map[next_y][next_x] === 0){
            doorStates[next_y][next_x] = doorStates[y][x];
            doorDirs[next_y][next_x]=doorDirs[y][x];
            doorOffsets[next_y][next_x]=0;
            map[next_y][next_x]=11;
          }
          map[y][x]=0;
          doorStates[y][x]=0.5;
          doorOffsets[y][x]=0;
        }
      }
    }
  }
  {
		if(Math.floor(player.x)===endX && Math.floor(player.y)===endY){
			setTimeout(function(){
				gameIsOn=false;
				textscreen='You Won!';
				panorama=true;
			},1000);
		}
		player.speedMult = 1;
		var newfloor=player.z<=0.05||isBlocking(player.x,player.y,player.z-0.05);
		if(!player.isFloor&&newfloor){
			playsound('misc/land_1',5);
		}
		player.isFloor=newfloor;
		if(player.isFloor){
			if(player.isJumping){
				player.zSpeed = 0.1125;
				player.isJumping = false;
				playsound('misc/jump_0');
				//player.isCrouching=false;
			}
			if(player.isCrouching){
				player.speedMult = 0.3;
				player.height=0.375;
				player.momentum=Math.max(player.momentum-0.14*player.momentum*mul,0);
			}
			else{
				player.height=0.5;
				player.momentum = 0;
			}
		}else{
			if(player.moveSpeed !== 0 || player.strafeSpeed !== 0){
				player.momentum=Math.min(player.momentum+0.015*mul,2);
			}
		}
    if (player.y >= 0.001){player.moveSpeed = 0.05;}else{player.moveSpeed = 0.069}
  	var moveStep = mul * player.speed * player.moveSpeed*(player.speedMult+player.momentum)*Math.max((3*adsmul-2),0.1);	// player will move this far along the current direction vector

    var moveStepStrafe = mul * player.strafeSpeed * player.moveSpeed*(player.speedMult+player.momentum)*Math.max((3*adsmul-2),0.1);

  	player.rotDeg = player.rotDeg + mul * player.dir * player.rotSpeed; // add rotation if player is rotating (player.dir != 0)

  	player.rotDeg = player.rotDeg % 360;
    if(true/*ceiling*/){
      if(-screenHeight/2 < player.pitch+mul*player.pitchChange && player.pitch+mul*player.pitchChange < screenHeight/2){
      player.pitch += mul*player.pitchChange;
      }else{
        if(player.pitch+mul*player.pitchChange<-screenHeight/2 && player.pitchChange > 0){
          player.pitch += mul*player.pitchChange;
        }else{
          if(player.pitch+mul*player.pitchChange>screenHeight/2 && player.pitchChange < 0){
            player.pitch += mul*player.pitchChange;
          }
        }
    }
    }
  	player.rot = player.rotDeg * Math.PI / 180;

  	var newX = player.x + Math.cos(player.rot) * moveStep + Math.sin(player.rot) * moveStepStrafe;	// calculate new player position with simple trigonometry
  	var newY = player.y + Math.sin(player.rot) * moveStep - Math.cos(player.rot) * moveStepStrafe;
    player.zSpeed-=mul*gravity;
		var newZ = player.z+mul*player.zSpeed;
		if(!panorama){
	  	var pos = checkCollision(player.x, player.y, newX, newY, 0.05, player.z, newZ);
	  	player.z = pos.z;
			player.x = pos.x;
			player.y = pos.y;
			if(pos.zSpeed){player.zSpeed = pos.zSpeed;}
		}
  }
	player.cameray=player.y;
	player.camerax=player.x;
}
function ai(mul){
	enemies.forEach(enemy => function(enemy){
		enemy.ai(mul);
	}(enemy))
}
function checkCollision(fromX,fromY,toX,toY,radius,fromZ,toZ){
	var pos = checkCollisionHor(fromX,fromY,toX,toY,radius,fromZ);
	var x = pos.x;
	var y = pos.y;
	var ix = Math.floor(x);
	var iy = Math.floor(y);
	if(map[iy]===undefined) return {x:fromX,y:fromY,z:fromZ}//pos;
	// return true if the map block is not 0, ie. if there is a blocking wall.
	if(map[iy][ix] !== 0){
		if(map[iy][ix] !== 8 && map[iy][ix] !== 9 && map[iy][ix] !== 10 && map[iy][ix] !== 11){
			if(fromZ>=heightMap[iy][ix]){
				if(toZ<=heightMap[iy][ix]){
					pos.z = heightMap[iy][ix];
					pos.zSpeed = 0;

					return pos;
				}
			}else{
				if(Math.abs(heightMap[iy][ix]-fromZ) <= 0.25){
					pos.z = heightMap[iy][ix];
					pos.zSpeed = 0;

					return pos;
				}
			}
		}
		else if(map[iy][ix] === 11){
			if(doorDirs[iy][ix]===1){
				//horizontal
				if(doorStates[iy][ix]===1){
					if((y-iy)<1-doorOffsets[iy][ix]){
						if(fromZ>=heightMap[iy][ix]){
							if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos;}
						}
					}
				}else{
					if((y-iy)>doorOffsets[iy][ix]){
						if(fromZ>=heightMap[iy][ix]){
							if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos}
						}
					}
				}
			}else{
				//vertical
				if(doorStates[iy][ix]===1){
					if((x-ix)<1-doorOffsets[iy][ix]){
						if(fromZ>=heightMap[iy][ix]){
							if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos}
						}
					}
				}else{
					if((x-ix)>doorOffsets[iy][ix]){
						if(fromZ>=heightMap[iy][ix]){
							if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos}
						}
					}
				}
			}
		}
		else{
			if(doorDirs[iy][ix]===0){
				//horizontal
				if(1-(y-iy)>=doorOffsets[iy][ix]){
					if(fromZ>=heightMap[iy][ix]){
						if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos}
					}
				}
			}else if(doorDirs[iy][ix]===1){
				//vertical
				if(1-(x-ix)>=doorOffsets[iy][ix]){
					if(fromZ>=heightMap[iy][ix]){
						if(toZ<=heightMap[iy][ix]){pos.z = heightMap[iy][ix];pos.zSpeed = 0;return pos}
					}
				}
			}
		}
	}
	for(var i = 0; i < sprites.length;i++){
		sprite = sprites[i];
		if(sprite.block){
			spriteDist = ((x-sprite.x)**2 + 1*(y-sprite.y)**2)**0.5;
			if (spriteDist<=sprite.hitbox/2){
				if(toZ<=sprite.z+sprite.h){
					if(toZ>=sprite.z||fromZ>=sprite.z+sprite.h){
							pos.z = sprite.z+sprite.h;
							pos.zSpeed = 0;

							return pos;
					}else{
						if(toZ+player.height>=sprite.z){
							pos.z = sprite.z;
							pos.zSpeed = 0;

							return pos;
						}
					}
				}
			}
		}
	}
	if(toZ>=0){pos.z = toZ;return pos;}
	else{pos.z = 0;pos.zSpeed = 0;return pos;}
}

function checkCollisionHor(fromX, fromY, toX, toY, radius,fromZ) {
	var pos = {
		x : fromX,
		y : fromY
	};
	if(toY < 0 || toY >= mapHeight || toX < 0 || toX >= mapWidth){
		return pos;
  }
  if(isBlocking(fromX,fromY,fromZ+0.25)){return {x:toX,y:toY}}

	var blockX = Math.floor(toX);
	var blockY = Math.floor(toY);
	var coolPos = {
		x:JSON.parse(JSON.stringify(toX)),
		y:JSON.parse(JSON.stringify(toY))
	}

	if(isBlocking(toX,toY,fromZ+0.25)) {
		return pos;
	}
	pos.x = toX;
	pos.y = toY;

	var blockTop = isBlocking(blockX+0.5,blockY-1+0.5,fromZ+0.25);
	var blockBottom = isBlocking(blockX+0.5,blockY+1+0.5,fromZ+0.25);
	var blockLeft = isBlocking(blockX-1+0.5,blockY+0.5,fromZ+0.25);
	var blockRight = isBlocking(blockX+1+0.5,blockY+0.5,fromZ+0.25);

	if(blockTop && toY - blockY < radius) {
		toY = pos.y = blockY + radius;
	}
	if(blockBottom && blockY+1 - toY < radius) {
		toY = pos.y = blockY + 1 - radius;
	}
	if(blockLeft && toX - blockX < radius) {
		toX = pos.x = blockX + radius;
	}
	if(blockRight && blockX+1 - toX < radius) {
		toX = pos.x = blockX + 1 - radius;
	}

	// is tile to the top-left a wall
	if(isBlocking(blockX-1+0.5,blockY-1+0.5,fromZ+0.25) && !(blockTop && blockLeft)) {
		var dx = toX - blockX;
		var dy = toY - blockY;
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + radius;
		}
		return pos;
	}
	// is tile to the top-right a wall
	if(isBlocking(blockX+1.5,blockY-0.5,fromZ+0.25) && !(blockTop && blockRight)) {
		var dx = toX - (blockX+1);
		var dy = toY - blockY;
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + radius;
		}
		return pos;
	}
	// is tile to the bottom-left a wall
	if(isBlocking(blockX-1+0.5,blockY+1+0.5,fromZ+0.25) && !(blockBottom && blockLeft)) {
		var dx = toX - blockX;
		var dy = toY - (blockY+1);
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
		return pos;
	}
	// is tile to the bottom-right a wall
	if(isBlocking(blockX+1+0.5,blockY+1+0.5,fromZ+0.25) && !(blockBottom && blockRight)) {
		var dx = toX - (blockX+1);
		var dy = toY - (blockY+1);
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
		return pos;
	}
	return coolPos;
}

function isBlocking(x,y,z) {

	// first make sure that we cannot move outside the boundaries of the level
	if(y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
		return true;
	var ix = Math.floor(x);
	var iy = Math.floor(y);
	if(map[iy]===undefined) return false;
	// return true if the map block is not 0, ie. if there is a blocking wall.
	if(map[iy][ix] !== 0&&((heightMap[iy][ix]===0)?1:heightMap[iy][ix])>z){
    if(map[iy][ix] !== 8 && map[iy][ix] !== 9 && map[iy][ix] !== 10 && map[iy][ix] !== 11){return true;}
    else if(map[iy][ix] === 11){
      return true;
			if(doorDirs[iy][ix]===1){
        //horizontal
        if(doorStates[iy][ix]===1){
          if((y-iy)<1-doorOffsets[iy][ix]){return true;}
        }else{
          if((y-iy)>doorOffsets[iy][ix]){return true;}
        }
      }else{
        //vertical
        if(doorStates[iy][ix]===1){
          if((x-ix)<1-doorOffsets[iy][ix]){return true;}
        }else{
          if((x-ix)>doorOffsets[iy][ix]){return true;}
        }
      }
    }
		else{
      if(doorDirs[iy][ix]===0){
        //horizontal
        if(1-(y-iy)>=doorOffsets[iy][ix]){return true;}
      }else if(doorDirs[iy][ix]===1){
        //vertical
        if(1-(x-ix)>=doorOffsets[iy][ix]){return true;}
      }
    }
  }
  for(var i = 0; i < sprites.length;i++){
    sprite = sprites[i];
    if(sprite.block){
      spriteDist = ((x-sprite.x)**2 + 1*(y-sprite.y)**2)**0.5;
      if (spriteDist<=sprite.hitbox/2){
        if(
          between(z+player.height,sprite.h+sprite.z,z)||
          between(z+player.height,sprite.z,z)||
          between(sprite.z+sprite.h,z,sprite.z)||
          between(sprite.z+sprite.h,player.height+z,sprite.z)
        ){
          return true;
        }
      }
    }
  }
  return false;
}

function updateMiniMap() {

  if(debug){drawMiniMap();}
	var miniMap = $("minimap");
	var miniMapObjects = $("minimapobjects");

	var objectCtx = miniMapObjects.getContext("2d");
	miniMapObjects.width = miniMapObjects.width;

	objectCtx.fillStyle = "red";
	objectCtx.fillRect(		// draw a dot at the current player position
		player.x * miniMapScale - 2,
		player.y * miniMapScale - 2,
		4, 4
	);

	objectCtx.strokeStyle = "red";
	objectCtx.beginPath();
	objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
	objectCtx.lineTo(
		(player.x + dirX * 4) * miniMapScale,
		(player.y + dirY * 4) * miniMapScale
	);
	objectCtx.closePath();
	objectCtx.stroke();
	for (var i=0;i<enemies.length;i++) {
		var enemy = enemies[i];

		objectCtx.fillStyle = "blue";
		objectCtx.fillRect(		// draw a dot at the enemy position
			enemy.x * miniMapScale - 1,
			enemy.y * miniMapScale - 1,
			2, 2
		);
	}
}

function drawMiniMap() {

	// draw the topdown view minimap

	var miniMap = $("minimap");			// the actual map
	var miniMapCtr = $("minimapcontainer");		// the container div element
	var miniMapObjects = $("minimapobjects");	// the canvas used for drawing the objects on the map (player character, etc)

	miniMap.width = mapWidth * miniMapScale;	// resize the varernal canvas dimensions
	miniMap.height = mapHeight * miniMapScale;	// of both the map canvas and the object canvas
	miniMapObjects.width = miniMap.width;
	miniMapObjects.height = miniMap.height;

	var w = (mapWidth * miniMapScale) + "px" 	// minimap CSS dimensions
	var h = (mapHeight * miniMapScale) + "px"
	miniMap.style.width = miniMapObjects.style.width = miniMapCtr.style.width = w;
	miniMap.style.height = miniMapObjects.style.height = miniMapCtr.style.height = h;

	var ctx = miniMap.getContext("2d");

	ctx.fillStyle = "white";
	ctx.fillRect(0,0,miniMap.width,miniMap.height);

	// loop through all blocks on the map
	for (var y=0;y<mapHeight*miniMapScale;y++) {
		for (var x=0;x<mapWidth*miniMapScale;x++) {
        if(isBlocking(x/miniMapScale,y/miniMapScale,0.1)){
          ctx.fillStyle = 'gray';
  				ctx.fillRect(				// ... then draw a block on the minimap
  					x,
  					y,
  					1,1
  				);
        }
		}
	}
}

setTimeout(init, 1);
