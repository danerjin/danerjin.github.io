var isPressingG = false;
// just a few helper functions
var $ = function(id) { return document.getElementById(id); };
var dc = function(tag) { return document.createElement(tag); };
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
var Sprite = function(x,y,texture,block,hitbox,h,z){
  this.x = x;
  this.y = y;
  this.texture = new Image();
  this.texture.crossOrigin = "Anonymous";
  this.texture.src = `sprites/objects/${texture}.png`;
  this.block = block;
  this.hitbox = hitbox;
  this.h = h;
  this.z = z;
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
var WallStripe = function(wallX,wallY,xOffset,x,shade,dist){
  this.tex = map[wallY][wallX];
  this.x = x;
  this.dist = dist;
  this.height = Math.round(viewDist*heightMap[wallY][wallX]/this.dist);
  this.seg=Math.round(viewDist/this.dist);
  this.y = Math.round(screenHeight/2 - this.height+(player.z+player.height)*viewDist/this.dist)+player.pitch;
  this.xOffset=xOffset;
  this.shade=shade;
  this.draw = function(){
    for(var drawTop = this.y+this.height-this.seg; drawTop >= this.y-10; drawTop-=this.seg){
      drawWallSliceRectangle(this.x,drawTop,stripWidth,this.seg,this.xOffset+(this.shade?1:0),this.tex);
    }
    if(drawTop<this.y){
      ctx.drawImage(wallTextures[this.tex-1], Math.floor((this.xOffset+(this.shade?1:0))*wallTextures[this.tex-1].width/2), Math.round(wallTextures[this.tex-1].height*(1-(this.height/this.seg)%1)),
        1, Math.round(wallTextures[this.tex-1].height*((this.height/this.seg)%1)),
        this.x, this.y, stripWidth, (this.height%this.seg)+3);
    }
  }
}
var map = [
  [2,2,2,2,2,2,2,2,2,2,2,4,4,6,4,4,6,4,6,4,4,4,6,4],
  [2,0,0,0,0,0,0,0,0,0,2,4,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,0,0,2,2,4,0,0,0,0,0,0,0,0,0,0,0,6],
  [2,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,6],
  [2,0,0,0,0,0,0,0,0,2,2,4,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,0,0,0,2,4,0,0,0,0,0,6,6,6,8,6,4,6],
  [2,7,7,7,8,7,7,7,7,2,2,4,4,4,11,4,4,6,0,0,0,0,0,6],
  [7,0,0,0,0,0,0,0,0,0,2,0,0,4,0,0,2,4,0,4,0,6,0,6],
  [7,0,0,0,0,0,0,0,7,2,0,0,0,4,0,0,2,6,0,0,0,0,0,6],
  [7,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,2,6,0,0,0,0,0,4],
  [7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,6,0,6,0,6,0,6],
  [7,7,0,0,0,0,0,0,7,2,0,2,0,2,0,2,2,6,4,6,0,6,6,6],
  [7,7,7,7,9,7,7,7,7,2,2,4,0,6,2,4,2,3,3,3,10,3,3,3],
  [2,2,2,2,0,2,2,2,2,4,6,4,0,0,6,0,6,3,0,0,0,0,0,3],
  [2,2,0,0,0,0,0,2,2,4,0,0,0,0,0,0,4,3,0,0,0,0,0,3],
  [2,0,0,0,0,0,0,0,2,4,0,0,0,0,0,0,4,3,0,0,0,0,0,3],
  [1,0,0,0,0,0,0,0,1,4,4,4,4,4,6,0,6,3,3,0,0,0,3,3],
  [2,0,0,0,0,0,0,0,2,2,2,1,2,2,2,6,6,0,0,5,8,5,0,5],
  [2,5,0,0,0,0,0,2,2,2,0,0,0,2,2,0,5,0,0,0,0,0,0,5],
  [2,4,0,0,0,0,0,0,2,0,0,0,0,0,2,5,0,5,0,0,0,0,0,5],
  [1,3,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
  [2,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,5],
  [2,2,0,0,0,0,0,2,2,2,0,0,0,2,2,0,5,0,5,0,0,0,5,5],
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
  [2,0,0,0,0,0,0,0,2,2,0,0,0,1,0,0,2,2,0,0,0,0,0,2],
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
  [2,0.6,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [1.5,0.8,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1.5],
  [2,1,0,0,0,0,0,2,2,2,0,0,0,2,2,0,2,0,2,0,0,0,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];
var mapWidth = map[0].length;
var mapHeight = map.length;
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
*/
var skydomeTexture = new Image();
skydomeTexture.crossOrigin = "Anonymous";
skydomeTexture.src = `sprites/pano.png`;
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
var sprites = [
  new Sprite(21.5,10,"greenlight",false,0.6,0,0),
  new Sprite(18,3,"greenlight",false,0.6,0,0),
  new Sprite(9.5,3.5,"greenlight",false,0.6,0,0),
  new Sprite(9.5,10,"greenlight",false,0.6,0,0),
  new Sprite(3,3.5,"greenlight",false,0.6,0,0),
  new Sprite(3,19.5,"greenlight",false,0.6,0,0),
  new Sprite(3,13,"greenlight",false,0.6,0,0),
  new Sprite(14,19,"greenlight",false,0.6,0,0),
  new Sprite(2,8,"pillar",true,0.6,1,0),
  new Sprite(2,9,"pillar",true,0.6,1,0),
  new Sprite(2,10,"pillar",true,0.6,1,0),
  new Sprite(21,2,"barrel",true,0.6,0.4,0),
  new Sprite(15,3,"barrel",true,0.6,0.4,0),
  new Sprite(15.5,2.2,"barrel",true,0.6,0.4,0),
  new Sprite(16.2,2.7,"barrel",true,0.6,0.4,0),
  new Sprite(3,2,"barrel",true,0.6,0.4,0),
  new Sprite(9,10,"barrel",true,0.6,0.4,0),
  new Sprite(9.5,10,"barrel",true,0.6,0.4,0),
  new Sprite(10,10,"barrel",true,0.6,0.4,0)
]
var weapons_imgs = [];
var weapon_names = ['knife','pistol','smg','chaingun'];
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
var wallTextures = []
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

mobile = window.mobileAndTabletCheck();
var wallTypes = [0,[202,196,176],[235,106,14],[100, 198, 107],[108,69,39],[180, 179, 82],[205,164,52],[121,85,61],[189,236,182],[61,100,45],[230,50,68],[200,200,200]]
var canvas = $("screen");
var ctx = canvas.getContext('2d');
var gravity = 0.01;
var stripWidth = 2;
var player = {
	x : 5.5,		// current x, y position
	y : 3.1,
	dir : 0,		// the direction that the player is turning, either -1 for left or 1 for right.
	rotDeg : 90.001,		// the current angle of rotation
	rot : 0,		// rotation in radians
	speed : 0,		// is the playing moving forward (speed = 1) or backwards (speed = -1).
  strafeSpeed : 0, //strafing
	moveSpeed : 0.05,	// how far (in map units) does the player move each step/update
	rotSpeed : 3,		// how much does the player rotate each step/update (in degrees)
  pitch : 0, // pitch
  pitchChange : 0,
  z: 0, //feet to floor dist
  height: 0.5, // player height
  zSpeed: 0,
  isJumping: false,
  speedMult: 1,
  weapon:0,
  weaponState:0,
  currSquare: 0
}
var screenWidth = canvas.width;
var screenHeight = canvas.height;
var miniMapScale = 8;
var doorIsPresent = false;
var doorTarget = [0,0];
var fov = 60 * Math.PI / 180;
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
var rowdistlookup = new Array(Math.ceil(screenHeight/stripWidth));
var orzbuffer = new Array(numRays);
for(var i = 0; i < numRays+10;i++){
  orzbuffer[i]=[];
}
var zbuffer = new Array(numRays);
for(var i = 0; i < numRays+10;i++){
  zbuffer[i]=[];
}
function updateFOV(){
  fov = slider.value*Math.PI/180;
  fovHalf = fov/2;
  viewDist = (screenWidth/2) / Math.tan((fov / 2));
  $("fov").innerText = Math.round(fov*180/Math.PI);
}
function toggleFloor(){
  floor = !floor;
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
        varernalFillColor: '#00AA00',
        // Border width of Stick
        varernalLineWidth: 2,
        // Border color of Stick
        varernalStrokeColor: '#003300',
        // External reference circonference width
        externalLineWidth: 2,
        //External reference circonference color
        externalStrokeColor: '#008000',
        // Sets the behavior of the stick
        autoReturnToCenter: true

    });
    joyMovingDir = joyMoving.GetDir();
    floor=false;
    $("floor").checked = false;
  }

  canvas.addEventListener("click", async () => {
    await canvas.requestPointerLock();
    document.addEventListener("mousemove", updateMousePosition, false);
  });
  drawFillRectangle(0,0,screenWidth,screenHeight/2,'#429bf5');
  drawFillRectangle(0,screenHeight/2,screenWidth,screenHeight/2,'#c0a570');
	bind();
  for (var y=0;y<mapHeight;y++) {
    for (var x=0;x<mapWidth;x++) {
      var wall = map[y][x];
      if(wall === 8 || wall === 9 || wall === 10 || wall === 11){
        if(map[y][x-1]>0){
          doorDirs[y][x] = 1;
        }
      }
    }
  }

	drawMiniMap();
	gameCycle();
	renderCycle();
}

var lastGameCycleTime = 0;
var gameCycleDelay = 1000 / 60; // aim for 60 fps for game logic
var mousePos = [0,0];
var temp = [0,0];
var prevMousePos = [0,0];
function gameCycle() {
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
    if(diffX > 3){player.dir = 1;}
    if(diffX < -3){player.dir = -1;}
    if(-3 <= diffX && diffX <= 3){player.dir = 0;}
    if(diffY > 0){player.pitchChange = -6;}
    if(diffY < 0){player.pitchChange = 6;}
    if(diffY === 0){player.pitchChange = 0;}
    prevMousePos = JSON.parse(JSON.stringify(temp));
  }
	var now = new Date().getTime();
	// time since last game logic
	var timeDelta = now - lastGameCycleTime;
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
	move(timeDelta);
	var cycleDelay = gameCycleDelay;
	// the timer will likely not run that fast due to the rendering cycle hogging the cpu
	// so figure out how much time was lost since last cycle
	if(timeDelta > cycleDelay) {
		cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
	}
	setTimeout(gameCycle, cycleDelay);
	lastGameCycleTime = now;
}
function sign(num){
  return Math.round(num/Math.abs(num));
}
function between(a,x,b){
  return (a<=x && x<=b)||(b<=x && x<=a)
}
var posZ;
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
function renderCycle() {
  zbuffer=JSON.parse(JSON.stringify(orzbuffer));
  player.currSquare=map[Math.floor(player.y)][Math.floor(player.x)];
  posZ = (player.height+player.z) * screenHeight;
  dirX = Math.cos(player.rot)/(Math.tan(fovHalf));
  dirY = Math.sin(player.rot)/(Math.tan(fovHalf));
  planeX = -Math.sin(player.rot);
  planeY = Math.cos(player.rot);
  rayDirX0 = dirX - planeX;
  rayDirY0 = dirY - planeY;
  rayDirX1 = dirX + planeX;
  rayDirY1 = dirY + planeY;
	for(var y = 0; y<=screenHeight; y+=stripWidth){
		if(y===screenHeight/2+player.pitch){break;}
		rowdistlookup[y] = posZ/(y - screenHeight / 2 - player.pitch);
	}
  ctx.clearRect(0,0,screenWidth*2,screenHeight*2)
  drawFillRectangle(0,0,screenWidth,screenHeight/2+player.pitch+25*(player.height+player.z-0.5),'#87CEEB');
  if(!floor){drawFillRectangle(0,0,screenWidth,screenHeight,'#787878');if(ceiling){drawFillRectangle(0,0,screenWidth,screenHeight/2+player.pitch+25*(player.height+player.z-0.5),'#555555');}}
  updateMiniMap();
  if(floor){//castFloorAndCeilingRaysLode();}
	}
  renderSprites();
	castWallRays();
  drawFillRectangle(screenWidth/2-50/2,screenHeight/2-2/2,40/2,4/2,'#00FF00');
  drawFillRectangle(screenWidth/2+10/2,screenHeight/2-2/2,40/2,4/2,'#00FF00');
  drawFillRectangle(screenWidth/2-2/2,screenHeight/2-50/2,4/2,40/2,'#00FF00');
  drawFillRectangle(screenWidth/2-2/2,screenHeight/2+10/2,4/2,40/2,'#00FF00');
  if(doorIsPresent&&(map[doorTarget[1]][doorTarget[0]] === 8 || map[doorTarget[1]][doorTarget[0]] === 9 || map[doorTarget[1]][doorTarget[0]] === 10)){
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
	setTimeout(renderCycle, 1);
	fps = 1000 / timeDelta;
  ctx.font = "15px monospace";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText("FPS: "+fps,50,50);
}

function updateMousePosition(e) {
  if(document.pointerLockElement === canvas){
    mousePos[0] += e.movementX;
    mousePos[1] += e.movementY;
  }
}

// bind keyboard events to game functions (movement, etc)
function bind() {
	document.onkeydown = function(e) {
		e = e || window.event;

		switch (e.keyCode) { // which key was pressed?
      case 71:
        isPressingG = true;
        break;
  		case 82: // sprint
        player.speedMult = 1.5
        player.height = 0.5
  			break;
  		case 16: // crouch
  			player.height = 0.2;
        player.speedMult = 0.2
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
      case 82:
  		case 16: // up
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
//floor casting
function castFloorAndCeilingRaysLode(){
  // rayDir for leftmost ray (x = 0) and rightmost ray (x = w)
	for(var y = screenHeight-stripWidth; true; y-=stripWidth){
		if(y<=screenHeight/2+player.pitch){break;}
		// Current y position compared to the center of the screen (the horizon)
		var p = y - screenHeight / 2 - player.pitch;
		// Vertical position of the camera.
		// Horizontal distance from the camera to the floor for the current row.
		// 0.5 is the z position exactly in the middle between floor and ceiling.
		var rowDistance = posZ / (p);
		// real world coordinates of the leftmost column. This will be updated as we step to the right.
		var floorStepX = stripWidth * rowDistance * (2*0.847826*planeX) / (screenWidth);
  	var floorStepY = stripWidth * rowDistance * (2*0.847826*planeY) / (screenWidth);
    var floorX = player.x + rowDistance * 0.847826 * rayDirX0;
    var floorY = player.y + rowDistance * 0.847826 * rayDirY0;
    for(var x = 0; x < screenWidth; x+=stripWidth){
			// the cell coord is simply got from the integer parts of floorX and floorY
      var cellX = Math.floor(floorX);
      var cellY = Math.floor(floorY);
      // get the texture coordinate from the fractional part
      var tx = floorX - cellX;
      var ty = floorY - cellY;
      floorX += floorStepX;
      floorY += floorStepY;
      var floorTexture;
      if((floorX >= mapWidth || floorY >= mapHeight) || (floorX < 0 || floorY < 0) || floorlayout[cellY] === undefined){continue;}else{floorTexture = floorlayout[cellY][cellX];}
      if(floorTexture+0 === 0 || floorTexture === undefined){floorTexture = 2;}
      // floor drawing
      drawFloorRectangle(x,y,stripWidth,stripWidth,tx,ty,floorTexture);
		}
	}
	if(ceiling){
		for(var y = 0; y < screenHeight/2+player.pitch-stripWidth; y+=stripWidth){
		if(y===screenHeight/2+player.pitch){break;}
		// Current y position compared to the center of the screen (the horizon)
		var p = screenHeight / 2 - y + player.pitch;
		// Vertical position of the camera.
		// Horizontal distance from the camera to the floor for the current row.
		// 0.5 is the z position exactly in the middle between floor and ceiling.
		var rowDistance = (3*screenHeight-posZ) / (p);
		// real world coordinates of the leftmost column. This will be updated as we step to the right.
		var floorStepX = stripWidth * rowDistance * (2*0.847826*planeX) / (screenWidth);
  	var floorStepY = stripWidth * rowDistance * (2*0.847826*planeY) / (screenWidth);
    // real world coordinates of the leftmost column. This will be updated as we step to the right.
    var floorX = player.x + rowDistance * 0.847826 * rayDirX0;
    var floorY = player.y + rowDistance * 0.847826 * rayDirY0;
    for(var x = 0; x < screenWidth; x+=stripWidth){
			// the cell coord is simply got from the integer parts of floorX and floorY
      var cellX = Math.floor(floorX);
      var cellY = Math.floor(floorY);
      // get the texture coordinate from the fractional part
      var tx = floorX - cellX;
      var ty = floorY - cellY;
      floorX += floorStepX;
      floorY += floorStepY;
      var floorTexture;
      // choose texture and draw the pixel
        if((floorX >= mapWidth || floorY >= mapHeight) || (floorX <= 0 || floorY <= 0) || ceilinglayout[cellY] === undefined){continue;}else{floorTexture = ceilinglayout[cellY][cellX];}
        if(floorTexture+0 === 0 || floorTexture === undefined){continue;}
        // floor drawing
        drawCeilRectangle(x,y,stripWidth,stripWidth,tx,ty,floorTexture);
      }
    }
	}
}
function castWallRays() {
  var stripIdx = 0;
	for (var i=0;i<numRays;i++) {
		// where on the screen does ray go through?
		var rayScreenPos = (-numRays/2 + i) * stripWidth;

		// the distance from the viewer to the point on the screen, simply Pythagoras.
		var rayViewDist = Math.sqrt(rayScreenPos*rayScreenPos + viewDist*viewDist);

		// the angle of the ray, relative to the viewing direction.
		// right triangle: a = sin(A) * c
		var rayAngle = Math.asin(rayScreenPos / rayViewDist);
    if(!ceiling){
      //skybox
      /*ctx.drawImage(skydomeTexture, Math.floor((skydomeTexture.width)*((player.rot + rayAngle+2*Math.PI)/(Math.PI)%1)), 0,
    		1, skydomeTexture.height,
    		stripIdx*stripWidth, 0, stripWidth, screenHeight);*/

    }
		castSingleRay(
			player.rot + rayAngle, 	// add the players viewing direction to get the angle in world space
			stripIdx++
		);
	}
}
function castSingleRay(rayAngle, stripIdx) {
  // determine the hit point
	var fisheyecorrection = Math.cos(player.rot - rayAngle);
  {
    {

    	// first make sure the angle is between 0 and 360 degrees
    	rayAngle %= twoPI;
    	if(rayAngle < 0) rayAngle += twoPI;

    	// moving right/left? up/down? Determined by which quadrant the angle is in.
    	var right = (rayAngle > twoPI * 0.75 || rayAngle < twoPI * 0.25);
    	var up = (rayAngle < 0 || rayAngle > Math.PI);
      //WALL CASTING
    	var wallType = 0;

    	// only do these once
    	var angleSin = Math.sin(rayAngle);
    	var angleCos = Math.cos(rayAngle);

    	var dist = 0;	// the distance to the block we hit
    	var xHit = 0; 	// the x and y coord of where the ray hit the block
    	var yHit = 0;
    	var xWallHit = 0;
    	var yWallHit = 0;

    	var textureX;	// the x-coord on the texture of the block, ie. what part of the texture are we going to render
    	var wallX;	// the (x,y) map coords of the block
    	var wallY;

    	var wallIsShaded = false;

    	// first check against the vertical map/wall lines
    	// we do this by moving to the right or left edge of the block we're standing in
    	// and then moving in 1 map unit steps horizontally. The amount we have to move vertically
    	// is determined by the slope of the ray, which is simply defined as sin(angle) / cos(angle).
    }
    var hits = [];
    var slope = angleSin / angleCos; 	// the slope of the straight line made by the ray
  	var dXVer = right ? 1 : -1; 	// we move either 1 map unit to the left or right
  	var dYVer = dXVer * slope; 	// how much to move up or down
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

              hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)*fisheyecorrection));
              if(heightMap[wallY][wallX]>=3){
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

                hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)));
                if(heightMap[wallY][wallX]>=3){
          			    break;
              }
            }
          }
          else{
            var distX = x - player.x;
      			var distY = y - player.y;
        			textureX = y % 1;	// where exactly are we on the wall? textureX is the x coordinate on the texture that we'll use later when texturing the wall.
        			if(!right) textureX = 1 - textureX; // if we're looking to the left side of the map, the texture should be reversed

              hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,true,((distX*distX + distY*distY)**0.5)*fisheyecorrection));
              if(heightMap[wallY][wallX]>=3){
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
  	var slope = angleCos / angleSin;
  	var dYHor = up ? -1 : 1;
  	var dXHor = dYHor * slope;
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
    var x = player.x + (y - player.y) * slope;
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

              hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection));
              if(heightMap[wallY][wallX]>=3){
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
              hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection));
              if(heightMap[wallY][wallX]>=3){
                  break;
              }
          }
        }
        else{
          var distX = x - player.x;
    			var distY = y - player.y;
    				textureX = x % 1;
    				if(up) textureX = 1 - textureX

            hits.push(new WallStripe(wallX,wallY,textureX,stripIdx*stripWidth,false,((distX*distX + distY*distY)**0.5)*fisheyecorrection));
            if(heightMap[wallY][wallX]>=3){
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
function renderSprites(){
  var tempVar = new Array(sprites.length);
  for(var i = 0; i < sprites.length; i++){
    tempVar[i] = [i,((player.x - sprites[i].x) * (player.x - sprites[i].x) + (player.y - sprites[i].y) * (player.y - sprites[i].y))]; //sqrt not taken, unneeded
  }
  tempVar.sort(function(a, b){return b[1] - a[1]});
  for(var i = 0; i < sprites.length; i++){
      //translate sprite position to relative to camera
      var num = tempVar[i][0];
      var spriteX = sprites[num].x - player.x;
      var spriteY = sprites[num].y - player.y;

      //transform sprite with the inverse camera matrix
      // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
      // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
      // [ planeY   dirY ]                                          [ -planeY  planeX ]

      var invDet = 1.0 / (planeX * dirY - dirX * planeY); //required for correct matrix multiplication

      var transformX = invDet * (dirY * spriteX - dirX * spriteY)/*tempVar[i][1]*Math.cos(Math.atan2(dirY,dirX)-Math.atan2(spriteY,spriteX))*/;
      var transformY = invDet * (-planeY * spriteX + planeX * spriteY)/*tempVar[i][1]*Math.sin(Math.atan2(dirY,dirX)-Math.atan2(spriteY,spriteX))*/; //this is actually the depth inside the screen, that what Z is in 3D, the distance of sprite to player, matching sqrt(spriteDistance[i])

      var spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));

      //calculate height of the sprite on screen
      var spriteHeight = Math.abs(Math.floor(screenHeight) / (transformY)) / 1; //using "transformY" instead of the real distance prevents fisheye
      //calculate lowest and highest pixel to fill in current stripe
      var drawStartY = Math.round(screenHeight/2 - (1-(player.z+player.height))*spriteHeight-(player.z+player.height))+player.pitch

      //calculate width of the sprite
      var spriteWidth = Math.abs( Math.floor (screenHeight / (transformY)));
      var drawStartX = spriteScreenX-spriteWidth/2;
      var drawEndX = drawStartX+spriteWidth;
      //loop through every vertical stripe of the sprite on screen
      for(var stripe = Math.floor(drawStartX/3)*3; stripe < drawEndX; stripe+=stripWidth){
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

  if(isPressingG){
    var x_target = doorTarget[0];
    var y_target = doorTarget[1];
    if(doorIsPresent){
      if(map[Math.floor(y_target)][Math.floor(x_target)]!==11){
        doorStates[Math.floor(y_target)][Math.floor(x_target)] = 1-Math.round(doorOffsets[Math.floor(y_target)][Math.floor(x_target)]);
      }else{
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
    if (player.y >= 0.001){player.moveSpeed = 0.05;}else{player.moveSpeed = 0.069}

  	var moveStep = mul * player.speed * player.moveSpeed*player.speedMult;	// player will move this far along the current direction vector

    var moveStepStrafe = mul * player.strafeSpeed * player.moveSpeed*player.speedMult;

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
    var snap = (player.rotDeg+360) % 90
  	if(snap < 2 || snap > 88) {
  		player.rotDeg = Math.round(player.rotDeg / 90) * 90;
  	}

  	player.rot = player.rotDeg * Math.PI / 180;

  	var newX = player.x + Math.cos(player.rot) * moveStep + Math.sin(player.rot) * moveStepStrafe;	// calculate new player position with simple trigonometry
  	var newY = player.y + Math.sin(player.rot) * moveStep - Math.cos(player.rot) * moveStepStrafe;
    player.zSpeed-=mul*gravity;
    if(0 <= player.z+mul*player.zSpeed&&!isBlockingVer(player.z+mul*player.zSpeed)){
        player.z+=mul*player.zSpeed;
    }else{
      player.zSpeed = 0;
    }
    if(player.isJumping){
    if(player.z<=0.01||isBlockingVer(player.z-0.01)){
      player.zSpeed = 0.1125;
    }}
  	var pos = checkCollision(player.x, player.y, newX, newY, 0.05);
  	player.x = pos.x; // set new position
  	player.y = pos.y;
  }
}

function checkCollision(fromX, fromY, toX, toY, radius) {
	var pos = {
		x : fromX,
		y : fromY
	};
	if(toY <= 0 || toY >= mapHeight || toX <= 0 || toX >= mapWidth){
		return pos;
  }
  if(isBlocking(fromX,fromY)){return {x:toX,y:toY}}

	var blockX = Math.floor(toX);
	var blockY = Math.floor(toY);


	if(isBlocking(toX,toY)) {
		return pos;
	}

	pos.x = toX;
	pos.y = toY;

	var blockTop = isBlocking(blockX,blockY-1);
	var blockBottom = isBlocking(blockX,blockY+1);
	var blockLeft = isBlocking(blockX-1,blockY);
	var blockRight = isBlocking(blockX+1,blockY);

	if(blockTop != 0 && toY - blockY < radius) {
		toY = pos.y = blockY + radius;
	}
	if(blockBottom != 0 && blockY+1 - toY < radius) {
		toY = pos.y = blockY + 1 - radius;
	}
	if(blockLeft != 0 && toX - blockX < radius) {
		toX = pos.x = blockX + radius;
	}
	if(blockRight != 0 && blockX+1 - toX < radius) {
		toX = pos.x = blockX + 1 - radius;
	}

	// is tile to the top-left a wall
	if(isBlocking(blockX-1,blockY-1) != 0 && !(blockTop != 0 && blockLeft != 0)) {
		var dx = toX - blockX;
		var dy = toY - blockY;
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + radius;
		}
	}
	// is tile to the top-right a wall
	if(isBlocking(blockX+1,blockY-1) != 0 && !(blockTop != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - blockY;
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + radius;
		}
	}
	// is tile to the bottom-left a wall
	if(isBlocking(blockX-1,blockY+1) != 0 && !(blockBottom != 0 && blockBottom != 0)) {
		var dx = toX - blockX;
		var dy = toY - (blockY+1);
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
	}
	// is tile to the bottom-right a wall
	if(isBlocking(blockX+1,blockY+1) != 0 && !(blockBottom != 0 && blockRight != 0)) {
		var dx = toX - (blockX+1);
		var dy = toY - (blockY+1);
		if(dx*dx+dy*dy < radius*radius) {
			if(dx*dx > dy*dy)
				toX = pos.x = blockX + 1 - radius;
			else
				toY = pos.y = blockY + 1 - radius;
		}
	}

	return pos;
}

function isBlockingVer(z){
  var y=player.y;
  var x=player.x;
  var ix = Math.floor(x);
	var iy = Math.floor(y);
	// return true if the map block is not 0, ie. if there is a blocking wall.
	if(map[iy][ix] !== 0&&heightMap[iy][ix]>=z){
    if(map[iy][ix] !== 8 && map[iy][ix] !== 9 && map[iy][ix] !== 10 && map[iy][ix] !== 11){return true;}
    else if(map[iy][ix] === 11){
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
      spriteDist = ((player.x-sprite.x)**2 + 1*(player.y-sprite.y)**2)**0.5;
      if (spriteDist<=sprite.hitbox/2){
        if(
          between(z+player.height,sprite.h+sprite.z,z)||
          between(z+player.height,sprite.h,z)||
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

function isBlocking(x,y) {

	// first make sure that we cannot move outside the boundaries of the level
	if(y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
		return true;
	var ix = Math.floor(x);
	var iy = Math.floor(y);
	// return true if the map block is not 0, ie. if there is a blocking wall.
	if(map[iy][ix] !== 0&&heightMap[iy][ix]>player.z){
    if(map[iy][ix] !== 8 && map[iy][ix] !== 9 && map[iy][ix] !== 10 && map[iy][ix] !== 11){return true;}
    else if(map[iy][ix] === 11){
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
          between(player.z+player.height,sprite.h+sprite.z,player.z)||
          between(player.z+player.height,sprite.h,player.z)||
          between(sprite.z+sprite.h,player.z,sprite.z)||
          between(sprite.z+sprite.h,player.height+player.z,sprite.z)
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
		(player.x + Math.cos(player.rot) * 4) * miniMapScale,
		(player.y + Math.sin(player.rot) * 4) * miniMapScale
	);
	objectCtx.closePath();
	objectCtx.stroke();
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
        if(isBlocking(x/miniMapScale,y/miniMapScale)){
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
