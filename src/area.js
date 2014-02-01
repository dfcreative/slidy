/* container class */
function Area(el, opts){
	var $el = this.$el = this.self = el || document.createElement('div')

	//intrude prototype to chain
	var elProto = $el.__proto__;
	$el.__proto__ = this;

	//forgot about this, keep in mind self
	var self = this.$el;

	//init options
	self.options = extend({}, self.options, opts);
	var o = self.options;

	//treat element
	self.classList.add(pluginName);

	//update element size
	self._captureSize();

	//create picker(s)
	self.pickers = [];
	var children = self.querySelectorAll("[data-picker]"),
		l = children.length,
		pNum = 0;

	//recognize inner elements as pickers
	if (l > 0){
		for (var i = 0; i<l; i++){
			self.addPicker(children.item(i))
		}
	}

	//TODO: append missing number of pickers
	/*var pNum = (o.pickers.length || o.pickers) || 0;
	for (var i = 0; i < pNum; i++){
		var el = document.createElement("div"); //TODO
		self.addPicker(el, o.pickers[i]);
	}*/

	//init drag state object
	self.dragstate = {
		initX:0,
		initY:0,
		x: 0,
		y: 0,
		difX: 0,
		difY: 0,
		clientX: 0,
		clientY: 0,
		box: {},
		area: self,
		isCtrl: false,
		picker: null //current picker to drag
	};

	self._listenEvents();

	self.dispatchEvent(new CustomEvent("create"));

	return self;
}


Area.defaults = {
	tag: 'div'
}


Area.prototype = Object.create(HTMLElement.prototype);

extend(Area.prototype, {
	options: {
		//pickers: 1, //could be custom pickers passed, each with it’s own settings

		//shape: "", //triangle, circular, SVG-shape in basic case; 2d/1d is different classifier
		readonly: false, //no events
		sniperSpeed: 0.25, //sniper key slowing down amt

		//classes
		dragClass: "dragging",

		//callbacks
		create: null,
		dragstart: null,
		drag: null,
		dragstop: null,
		destroy: null,
		change: null //picker callback
	},

	//add new picker
	addPicker: function(el){
		//prevent adding new filter
		this.pickers.push(new Picker(el, this.$el));
	},

	_listenEvents: function(){
		var o = this.options,
			self = this;

		//bind cb’s to this
		this._dragstart = this._dragstart.bind(this);
		this._drag = this._drag.bind(this);
		this._dragstop = this._dragstop.bind(this);

		this.$el.addEventListener("mousedown", this._dragstart);

		on(window, "resize", function(){
			self._captureSize();
			self.updatePickers();
		});
	},

	_dragstart: function(e){
		var o = this.options;

		this._captureSize();

		//init dragstate
		this.dragstate.x = e.clientX - this.offsetBox.left;
		this.dragstate.y = e.clientY - this.offsetBox.top;
		this.dragstate.clientX = e.clientX;
		this.dragstate.clientY = e.clientY;
		this.dragstate.picker = this.findClosestPicker(this.dragstate.x, this.dragstate.y);

		//init box
		this.dragstate.box.top = this.offsetBox.top + this.paddingBox.top;
		this.dragstate.box.left = this.offsetBox.left + this.paddingBox.left;
		this.dragstate.box.right = this.offsetBox.right - this.paddingBox.right;
		this.dragstate.box.bottom = this.offsetBox.bottom - this.paddingBox.bottom;
		this.dragstate.box.width = this.offsetBox.width - this.paddingBox.left - this.paddingBox.right;
		this.dragstate.box.height = this.offsetBox.height - this.paddingBox.top - this.paddingBox.bottom;


		this._captureDragstate(this.dragstate, e);

		this.$el.classList.add(this.options.dragClass);

		this.dragstate.picker.dragstart(this.dragstate);
		//this.dragstate.picker.startTracking();
		this.dispatchEvent(new CustomEvent("dragstart", this.dragstate))
		this.dispatchEvent(new CustomEvent("change", this.dragstate))

		//bind moving
		on(document, "selectstart", prevent);
		on(document, "mousemove", this._drag);
		on(document, "mouseup", this._dragstop);
		on(document, "mouseleave", this._dragstop);
	},

	_drag: function(e){
		//NOTE: try not finding out picker offset throught style/etc, instead, update it’s coords based on event obtained
		var o = this.options;

		this._captureDragstate(this.dragstate, e);

		this.dragstate.picker.drag(this.dragstate);
		this.dispatchEvent(new CustomEvent("drag", this.dragstate))
		this.dispatchEvent(new CustomEvent("change", this.dragstate))
	},

	_dragstop: function(e){
		this._drag(e);

		this.dragstate.picker.dragstop(this.dragstate);

		this.dispatchEvent(new CustomEvent("dragstop", this.dragstate));
		//this.dragstate.picker.stopTracking();

		this.$el.classList.remove(this.options.dragClass);

		//unbind events
		off(document,"selectstart", this._prevent);
		off(document,"mousemove", this._drag);
		off(document,"mouseup", this._dragstop);
		off(document,"mouseleave", this._dragstop);
	},

	//get picker closest to the passed coords
	findClosestPicker: function(x, y){
		var minL = 9999, closestPicker;
		for (var i = 0; i < this.pickers.length; i++){
			var picker = this.pickers[i],
				w = x - picker.x,
				h = y - picker.y,
				l = Math.sqrt(w*w + h*h);
			if (l < minL){
				minL = l;
				closestPicker = i;
			}
		}
		return this.pickers[closestPicker];
	},

	//set pickers reflect their’s real values
	updatePickers: function(){
		for (var i = 0; i < this.pickers.length; i++){
			//this.pickers[i].update();
		}
	},

	//keep that’s offsetBox updated
	_captureSize: function(){
		this.offsetBox = getOffsetBox(this.$el);
		this.paddingBox = getPaddingBox(this.$el);
	},

	//updates dragstate based on event
	_captureDragstate: function(dragstate, e){
		dragstate.isCtrl = e.ctrlKey;
		dragstate.difX = e.clientX - dragstate.clientX;
		dragstate.difY = e.clientY - dragstate.clientY;
		if (e.ctrlKey) {
			dragstate.difX *= this.options.sniperSpeed;
			dragstate.difY *= this.options.sniperSpeed;
		}
		dragstate.x += dragstate.difX;
		dragstate.y += dragstate.difY;
		dragstate.clientX = e.clientX;
		dragstate.clientY = e.clientY;
	}
});
