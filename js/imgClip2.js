/**
 * 
 * @authors liujia
 * @date    2015-06-30 17:23:09
 * @version 0.3
 */

// constructor----------------------------------------
var ImgClip = function(opt){
    this.canvas = null; // canvas对象
    this.fileObj = null; // file对象
    this.cutBtn = null; // 触发剪切的按钮对象
    this.resultObj = null; // 输出图片对象
    this.winSize = { w: 300, h: 300}; // canvas大小，正方形

    this.ctx = null;
    this.img = null;
    this.dataURL;
    this.dis = { x:0, y:0};
	this.pre = { x:0, y:0};
	this.prex = this.prey = 0;
	this.flagX = true; // 宽高标记
	this.r = 1; // 图片缩放显示比例
	this.imageSize = {w:0,h:0} 
	this.cutSize = {w:0,h:0}; // 输出图片大小
	this.cutFast = false; // 快速剪切标记
	this.tstate = 'end'; // 拖拽事件状态
	// end：default默认初始值，ok：结束了，可以开始，start：开始了，可拖动，
	this.zoom = {}; // 缩放
	
    /*this.settings = { // 预留方法
        toDown : function(){},
        toMove : function(){},
        toUp : function(){}
    };*/
    opt && this.init(opt); 
};

// method----------------------------------------
ImgClip.prototype = {
	init: function(opt) { // 初始化
		if (!opt) { return false;}
		this.canvas = this.getObj(opt.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.fileObj = this.getObj(opt.fileObj);
		this.cutBtn = this.getObj(opt.cutBtn);
		this.resultObj = this.getObj(opt.resultObj);
		this.winSize = { w: this.canvas.width, h: this.canvas.height};
		if(this.winSize.w != this.winSize.h) this.winSize.h = this.winSize.w;
		opt.cutSize ? (this.cutSize = opt.cutSize,this.cutFast = false) : (this.cutSize = this.winSize,this.cutFast = true) ;

		// this.extend( this.settings , opt );
		this.setCanvas(this.canvas);
		this.clearCanvas(this.canvas);
		var This = this;
		if(window.File && window.FileList && window.FileReader && window.Blob) {
	        addEvent(this.fileObj,'change', function(e){ This.run(e,This); });
	        addEvent(this.cutBtn,'click', function(e){ This.getResults(e); });
	    } else {
		    document.write('您的浏览器不支持File Api');
		}
	},
	run: function(e,obj){ // 运行
    	e = e || window.event;
	    var files = e.target.files;  //FileList Objects    
	    var f = files[0];
		// clear
		obj.pre.x = obj.pre.y = obj.prex = obj.prey = 0;
		obj.img = null;
		resolveObjectURL(obj.dataURL);
		obj.dataURL = createObjectURL(f);
		obj.drawImg(0,0,function(){
		    obj.tstate = 'ok';
		    addEvent(obj.canvas,'touchstart',function(e){
		    	obj.fntouchstart(e);
		    	addEvent(document,'touchmove', function(e){ obj.fntouchmove(e); });
				addEvent(document,'touchend', function(e){ obj.fntouchend(e); });
		    });
		    addEvent(obj.canvas,'mousedown',function(e){
		    	obj.fntouchstart(e);
		    	addEvent(document,'mousemove', function(e){ obj.fntouchmove(e); });
				addEvent(document,'mouseup', function(e){ obj.fntouchend(e); });
		    });
		});
	},
	fntouchstart: function (e){ // touchstart
		var e = e || window.event;
		e.preventDefault();
		if(this.tstate!='ok'){return};
		this.tstate = 'start';

		if (e.type == 'mousedown'){
			this.dis.x = e.clientX - e.target.offsetLeft;
			this.dis.y = e.clientY - e.target.offsetTop;
		} else if (e.touches.length == 1){
			this.dis.x = e.touches[0].clientX - e.target.offsetLeft;
			this.dis.y = e.touches[0].clientY - e.target.offsetTop;
		} else if (e.touches.length == 2){
			this.dis.x = e.touches[0].clientX - e.target.offsetLeft;
			this.dis.y = e.touches[0].clientY - e.target.offsetTop;
			this.dis.x2 = e.touches[1].clientX - e.target.offsetLeft;
			this.dis.y2 = e.touches[1].clientY - e.target.offsetTop;
		}

		// this.dis.x = (e.type == 'mousedown' ? e.clientX : e.touches[0].clientX) - e.target.offsetLeft;
		// this.dis.y = (e.type == 'mousedown' ? e.clientY : e.touches[0].clientY) - e.target.offsetTop;
	    return false;
	},
	fntouchmove: function (e){ // touchmove
		var e = e || window.event;
		var This = this;
		if(this.tstate!='start'){return};
	    var x = (e.type == 'mousemove' ? e.clientX : e.touches[0].clientX) - this.dis.x;
	    var y = (e.type == 'mousemove' ? e.clientY : e.touches[0].clientY) - this.dis.y;
	    // 显示拖拽范围
	    x = x+this.pre.x > 0? 0: x+this.pre.x;
	    x = x<(this.canvas.width-this.imageSize.w) ?this.canvas.width-this.imageSize.w: x;
	    y = y+this.pre.y > 0? 0: y+this.pre.y;
	    y = y<(this.canvas.height-this.imageSize.h) ?this.canvas.height-this.imageSize.h: y;
	    this.drawImg(x,y,function(){This.prex=x;This.prey=y;});
	},
	fntouchend: function (e){ // touchend
		this.tstate = 'ok';
		document.onmousemove = null;
		document.ontouchmove = null;
		this.pre.x = this.prex;
		this.pre.y = this.prey;
	},
	drawImg: function (offsetX,offsetY,fn){ // 更新画布
		if(this.img === null){
			this.img = new Image();
			this.img.src = this.dataURL;
			var This = this;
			this.img.onload = function() {
				This.clearCanvas(This.canvas);
				if (this.width > this.height) { // 横向
					This.r = This.winSize.h / this.height;
					This.imageSize.w = Math.round(This.winSize.h * this.width / this.height);
					This.imageSize.h = This.winSize.h; 
					This.flagX = true;
				} else {
					This.r = This.winSize.w / this.width;
					This.imageSize.h = Math.round(This.winSize.w * this.height / this.width);
					This.imageSize.w = This.winSize.w;
					This.flagX = false;
				}	
				if(This.flagX) offsetY = 0;
				else offsetX = 0;
				This.ctx.drawImage(this, offsetX, offsetY, This.imageSize.w, This.imageSize.h);
			};
		} else {
			this.ctx.drawImage(this.img, offsetX, offsetY, this.imageSize.w, this.imageSize.h);
		}
		fn && fn();
	},
	getResults: function () { // 裁剪结果输出
		if(!this.dataURL) return;
		var vData = this.canvas;

		// 是否需要创建新画布
		if(!this.cutFast){ 
			var canvas2 = document.createElement('canvas');
			canvas2.style.display = 'none';
			this.resultObj.parentNode.appendChild(canvas2);
			// var canvas2 = document.getElementById('canvas2');
			var ctx2 = canvas2.getContext('2d');
			var img = new Image();
			img.src = this.dataURL;
			var cut = {
				x: (-this.pre.x) /this.r,
				y: (-this.pre.y) /this.r,
				w: 0,
				h: 0
			}
			canvas2.width = this.cutSize.w;
			canvas2.height = this.cutSize.h;
			if(this.flagX){ //横向
				cut.h = img.height;
				cut.w = img.height;
			} else {
				cut.w = img.width;
				cut.h = img.width;
			}
		    ctx2.drawImage(img, cut.x, cut.y, cut.w-1, cut.h-1, 0, 0, this.cutSize.w, this.cutSize.h);
		    vData = canvas2;
		}	

	    // 导出图片
	    this.resultObj.src = vData.toDataURL();
	},
	getObj: function(name){
		return 'string'==(typeof name) ? document.getElementById(name) : name;
	},
	clearCanvas: function(can){// 清除画布
		var con = can.getContext('2d');
		con.clearRect(0, 0, can.width, can.height);
	},
	setCanvas: function(can){// 设置画布大小
		can.width = this.winSize.w;
		can.height = this.winSize.h;
	}
};

// public method----------------------------------------
// extend
function extend(obj1,obj2) {
    for(var attr in obj2){ obj1[attr] = obj2[attr];}
}
// addEvent
function addEvent(obj,eventType,func){ 
    if(obj.attachEvent){
        obj.attachEvent("on" + eventType,func);
    }else{
        obj.addEventListener(eventType,func,false);
    }
}
function removeEvent(obj,eventType,func){
    if(obj.detachEvent){
        obj.detachEvent("on" + eventType,func);
    }else{
        obj.removeEventListener(eventType,func,false);
    }
}
// 获取fileURL
var createObjectURL = function(blob){
  return window[window.URL?'URL':'webkitURL']['createObjectURL'](blob);
};
var resolveObjectURL = function(blob){
  window[window.URL?'URL':'webkitURL']['revokeObjectURL'](blob);
};