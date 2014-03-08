﻿(function(global){
	function drag($el, e) {
		//console.log("drag", e)

		var d = $el.dragstate;

		var difX = e.clientX - d.clientX;
		var difY = e.clientY - d.clientY;

		//capture dragstate
		d.isCtrl = e.ctrlKey;
		if (e.ctrlKey && $el.sniper) {
			//d.difX *= $el.options.sniperSpeed;
			//d.difY *= $el.options.sniperSpeed;
		}
		d.clientX = e.clientX;
		d.clientY = e.clientY;
		d.x = e.clientX + window.scrollX - $el.oX;
		d.y = e.clientY + window.scrollY - $el.oY;

		//move according to dragstate
		//$el.x = d.x - d.offsetX;
		//$el.y = d.y - d.offsetY;
		$el.x += difX;
		$el.y += difY;
	}

	function stopDrag($el, e){
		//console.log("stopDrag")
		delete $el.dragstate;
	}

	//set displacement according to the x & y
	function updatePosition($el){
		css($el, "transform", ["translate3d(", $el.x, "px,", $el.y, "px, 0)"].join(""));
	}

	//native-drag helper
	function setDropEffect(e){
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"
		return false;
	}


	//TODO: make ghost insteadof moving self

	//detect whether to use native drag
	//NOTE: native drag is faster though you can’t change drag cursor
	//NOTE: native-drag cursor is glitching if drag started on the edge
	var isNativeSupported = (function(){
		var div = document.createElement("div")
		var isNativeSupported = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
		return isNativeSupported
	})();

	var Draggable = Component.register('Draggable', {
		//default options - classical jquery-like notation
		options: {
			treshold: 10,

			autoscroll: false,

			//null is no restrictions
			within: {
				default: document.documentElement,
				set: function(within){
					if (within instanceof Element){
						return within
					} else if (typeof within === "string"){
						if (within === "parent")
							return this.parentNode;
						else if (within === "..")
							return this.parentNode;
						else if (within === "...")
							return this.parentNode.parentNode;
						else if (within === "root")
							return document.body.parentNode;
						else
							return $(within)[0];
					} else {
						return null
					}
				}
			},

			//what area of draggable should not be outside the restriction area
			//by default it’s whole draggable rect
			pin: {
				default: null,
				get: function(value){
					if (!value) return [0,0,this.offsetWidth, this.offsetHeight];
					else return value;
				},
				set: function(value){
					if (value.length === 2){
						value = [value[0], value[1], value[0], value[1]];
					} else if (value.length === 4){
					} else {
						throw new Error("Unknown pin area format")
					}

					return value;
				},
				change: function(){
					this.updateLimits();
				}
			},

			group: null,

			ghost: false,

			translate: true,

			//to what extent round position
			precision: 1,

			sniper: false,

			native: {
				default: isNativeSupported,
				attribute: false,
				global: true,
				change: function(value){
					if (value === false && this.state === "native"){
						this.state = "ready";
					} else if (this.state !== "init") {
						this.state = "native";
					}
				}
			},

			//jquery-exactly axis fn: false, x, y
			axis: false,

			//
			repeat: {
				default: null,
				set: function(repeat){
					if (repeat === "both" || repeat === "x" || repeat === "y"){
						//straight value passed
						return repeat;
					} else if (repeat instanceof Array){
						//vector passed
						if (repeat.length){
							if (repeat[0] && repeat[1])
								return "both";
							else if (repeat[0])
								return "x";
							else if (repeat[1])
								return "y";
						}
					} else if (repeat === true){
						//just repeat any possible way
						return this.axis ? this.axis : "both"
					} else {
						//unrecognized value passed
						return false;
					}
				}
			},

			//initial position
			x: {
				default: 0,
				set: function(value){
					if (this.repeat === 'both' || this.repeat === 'x'){
						//mind repeat
						if (value < this.limits.left){
							value += this.limits.right - this.limits.left;
						} else if (value > this.limits.right){
							value -= this.limits.right - this.limits.left;
						}
					} else if (!this.axis || this.axis === "x"){
						//mind axis
						value = between(value,
							this.limits.left,
							this.limits.right);
					} else {
						//ignore change
						return this._x;
					}

					value = round(value, this.precision)
					return value;
				},
				change: function(){
					updatePosition(this)
				}
			},
			y: {
				default: 0,
				set: function(value){
					if (this.repeat === 'both' || this.repeat === 'y'){
						//mind repeat
						if (value < this.limits.top){
							value += this.limits.bottom - this.limits.top;
						} else if (value > this.limits.bottom){
							value -= this.limits.bottom - this.limits.top;
						}
					} else if (!this.axis || this.axis === "y"){
						//mind axis
						value = between(value,
							this.limits.top,
							this.limits.bottom);
					} else {
						//ignore change
						return this._y
					}

					//console.log("set", value)
					value = round(value, this.precision)
					//console.log("→", value)
					return value;
				},
				change: function(){
					updatePosition(this)
				}
			}
		},

		//-------------------API (verbs)
		//starts drag from event passed
		startDrag: function(e){
			//define limits
			this.updateLimits();

			//if event is outside the self area
			//move self to that area
			//make offsets half of width
			var offsetX, offsetY,
				//event absolute coords
				eAbsoluteX = e.clientX + window.scrollX,
				eAbsoluteY = e.clientY + window.scrollY;

			//if drag started outside self area - move self to that place
			if (
				eAbsoluteX > this.offsets.right ||
				eAbsoluteX < this.offsets.left ||
				eAbsoluteY < this.offsets.top ||
				eAbsoluteY > this.offsets.bottom
			) {
				//pretend as if offsets within self are ideal
				offsetX = this.offsets.width * .5;
				offsetY = this.offsets.height * .5;
				//move to that new place
				if (!this.axis || this.axis === "x") this.x = eAbsoluteX - this.oX - offsetX;
				if (!this.axis || this.axis === "y") this.y = eAbsoluteY - this.oY - offsetY;
				//pretend as if drag has happened
				this.fire('dragstart', null, true)
				this.fire('drag', null, true)
			} else {
				offsetX = e.offsetX;
				offsetY = e.offsetY;
			}

			//init dragstate
			this.dragstate = {
				//previous mouse vp coords
				clientX: e.clientX,
				clientY: e.clientY,

				//offset within self
				offsetX: offsetX,
				offsetY: offsetY,

				//relative coords
				x: eAbsoluteX - this.oX,
				y: eAbsoluteY - this.oY
			};

			if (this.state !== "native") this.state = "drag";
		},


		//updates movement restrictions
		updateLimits: function(){
			//it is here because not always element is in DOM when constructor inits
			var limOffsets = offsets(this.within);

			this.offsets = offsets(this);
			var selfPads = paddings(this.within);

			//save relative coord system offsets
			this.oX = this.offsets.left - this.x;
			this.oY = this.offsets.top - this.y;

			var pin = this.pin;

			//pinArea-including version
			this.limits.top = limOffsets.top - this.oY + selfPads.top - pin[1];

			this.limits.bottom = limOffsets.bottom - this.oY - this.offsets.height - selfPads.bottom + (this.offsets.height - pin[3]);

			this.limits.left = limOffsets.left - this.oX + selfPads.left - pin[0];

			this.limits.right = limOffsets.right - this.oX - this.offsets.width - selfPads.right + (this.offsets.width - pin[2]);

		},

		//states: grouped events
		states: {
			init: {
				before: function(){
					//console.log("draggable before init")
					//init empty limits
					this.limits = {};

					disableSelection(this)
				},
				after: function(){
					//console.log("draggable after init")
				}
			},

			//non-native drag
			ready: {
				before: function(){
					//console.log("draggable before ready")
					this.updateLimits();

					//go native
					if (this.native) return "native";
				},

				mousedown: function(e){
					this.fire('dragstart', null, true)
					this.startDrag(e);
				}
			},

			drag: {
				before: function(){
					//handle CSSs
					disableSelection(this.within)
				},
				after: function(){
					enableSelection(this.within)
				},
				'document selectstart': preventDefault,
				'document mousemove': function(e){
					drag(this,e)
					this.fire('drag', null, true)
				},
				'document mouseup, document mouseleave': function(e){
					stopDrag(this, e);
					this.fire('dragend', null, true);
					this.state = "ready"
				}
			},

			scroll: {

			},
			tech: {

			},
			out: {

			},

			//native drag
			native: {
				before: function(){
					//console.log("draggable before native")
					//hang proper styles
					css(this, {
						"user-drag": "element",
						"cursor": "pointer!important"
					})

					//make restricting area allowable to drop
					on(this.within, 'dragover', setDropEffect)
				},
				after: function(){
					//console.log("after native")
					css(this, "user-drag", "none");
					off(this.within, 'dragover', setDropEffect)
				},

				dragstart:  function(e){
					//console.log(e)
					this.startDrag(e);
					e.dataTransfer.effectAllowed = 'all';

					//hook drag image stub (native image is invisible)
					this.$dragImageStub = document.createElement('div');
					this.parentNode.insertBefore(this.$dragImageStub, this);
					e.dataTransfer.setDragImage(this.$dragImageStub, 0, 0);
				},
				dragend:  function(e){
					stopDrag(this, e);

					//remove drag image stub
					this.$dragImageStub.parentNode.removeChild(this.$dragImageStub);
					delete this.$dragImageStub;
				},
				drag:  function(e){
					//ignore final native drag event
					if (e.x === 0 && e.y === 0) return;

					//ignore zero-movement
					if (this.dragstate.clientX === e.clientX && this.dragstate.clientY === e.clientY) return e.stopImmediatePropagation();

					drag(this, e);
					//this.ondrag && this.ondrag.call(this);
				},
				dragover: 'setDropEffect'
			}
		}
	});



	//exports
	global['Draggable'] = Draggable;

})(window)