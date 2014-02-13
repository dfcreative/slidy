var pluginName = "slidy",
    $;
function extend(a) {
  for (var i = 1,
      l = arguments.length; i < l; i++) {
    var b = arguments[i];
    for (var k in b) {
      a[k] = b[k];
    }
  }
  return a;
}
function offsetBox($el) {
  var box = $el.getBoundingClientRect();
  box.height = $el.offsetHeight;
  box.width = $el.offsetWidth;
  box.center = [box.width * 0.5, box.height * 0.5];
  return box;
}
function paddingBox($el) {
  var box = {},
      style = getComputedStyle($el);
  box.top = ~~style.paddingTop.slice(0, - 2);
  box.left = ~~style.paddingLeft.slice(0, - 2);
  box.bottom = ~~style.paddingBottom.slice(0, - 2);
  box.right = ~~style.paddingRight.slice(0, - 2);
  return box;
}
function on(el, evt, delegate, fn) {
  if ($) {
    $(el).on.apply(el, arguments);
  } else if (arguments.length === 3) {
    el.addEventListener(evt, delegate);
  } else if (arguments.length === 4 && !delegate) {
    el.addEventListener(evt, fn);
  } else {
    el.addEventListener(evt, function(e) {}.bind(el));
  }
}
function off(el, evt, fn) {
  if ($) {
    $(el).off.apply(el, arguments);
  } else if (arguments.length === 3) {
    el.removeEventListener(evt, fn);
  }
}
function trigger(that, ename, data) {}
function between(a, min, max) {
  return Math.max(Math.min(a, max), min);
}
function data(el) {
  var data = {},
      v;
  for (var prop in el.dataset) {
    var v;
    if (multiple) {
      v = el.dataset[prop].split(",");
      for (var i = v.length; i--;) {
        v[i] = recognizeValue(v[i].trim());
        if (v[i] === "") v[i] = null;
      }
    } else {
      v = recognizeValue(el.dataset[prop]);
      if (v === "") v[i] = true;
    }
    data[prop] = v;
  }
  return data;
}
function recognizeValue(str) {
  if (str === "true") {
    return true;
  } else if (str === "false") {
    return false;
  } else if (!isNaN(v = parseFloat(str))) {
    return v;
  } else {
    return str;
  }
}
function detectCSSPrefix() {
  var puppet = document.documentElement;
  var style = document.defaultView.getComputedStyle(puppet, "");
  if (style.transform) return "";
  if (style["-webkit-transform"]) return "-webkit-";
  if (style["-moz-transform"]) return "-moz-";
  if (style["-o-transform"]) return "-o-";
  if (style["-khtml-transform"]) return "-khtml-";
  return "";
}
var cssPrefix = detectCSSPrefix();
function observeData(target, data) {
  var listeners = {},
      propRe = /\{\{\s([a-zA-Z_$][a-zA-Z_$0-9]*)\s\}\}/;
  for (var i = 0; i < target.attributes.length; i++) {
    var attrValue = target.attributes[i].value;
    var propIdx = undefined;
    while ((propIdx = attrValue.indexOf("{{")) >= 0) {
      var closeIdx = attrValue.indexOf("}}");
      var propName = attrValue.slice(propIdx + 2, closeIdx).trim();
      target.attributes[i].value = [target.attributes[i].value.slice(0, propIdx), data[propName], target.attributes[i].value.slice(closeIdx, attrValue.length - 1)].join('');
      if (!listeners[propName]) listeners[propName] = [];
      listeners[propName].push({
        target: target.attributes[i],
        template: attrValue,
        data: {}
      });
    }
  }
  var children = target.childNodes,
      l = children.length;
  for (var i = 0; i < l; i++) {
    var child = children(i);
    if (child.nodeType === 1) {
      if (propRe.test(child.texContent)) {
        listeners.push({
          target: child,
          template: target.texContent
        });
      }
    }
  }
  for (var prop in listeners) {
    var listener = listeners[prop];
    document.addEventListener(prop + "Changed", function(e) {
      var value = e.target.value;
      for (var i = 0; i < target.attributes.length; i++) {
        var attrName = target.attributes[i].name.replace();
        var attrValue = target.attributes[i].value.replace();
        if (re.test(attrName)) {}
      }
    });
  }
}
function findPropertyToInsert(str) {
  str.indexOf();
}
var Component = function Component(el, opts) {
  "use strict";
  var self;
  if (el instanceof HTMLElement) {
    self = el;
  } else {
    if (el) {
      opts = el;
    }
    self = document.createElement('div');
  }
  var originalProto = self.__proto__;
  self.__proto__ = this.constructor.prototype;
  self.initOptions(opts);
  self._id = this.constructor.instances.length;
  this.constructor.instances.push(self);
  self.initStates.apply(self);
  self.state = 'default';
  self.classList.add(pluginName);
  self.trigger("create");
  return self;
};
var $Component = Component;
($traceurRuntime.createClass)(Component, {
  initOptions: function(externalOptions) {
    "use strict";
    var staticName = this.constructor.name;
    var defaults = this.constructor.defaults;
    for (var key in defaults) {
      this.setAttribute(key, defaults[key]);
    }
  },
  setAttributes: function(opts) {
    "use strict";
    for (var key in opts) {
      this.setAttribute(key, opts[key]);
      this[key] = opts[key];
    }
  },
  getAttributes: function() {
    "use strict";
    var result = {};
    for (var key in this.defaults) {
      result[key] = this[key];
    }
    return result;
  },
  get state() {
    "use strict";
    return this._state;
  },
  set state(newStateName) {
    "use strict";
    var oldState = this.states[this._state];
    var newState = this.states[newStateName] || this.states['default'];
    if (!newState) throw new Error("Not existing state `" + newStateName + "`");
    console.log("Change state from `" + this._state + "` to `" + newStateName + "`");
    if (oldState) {
      oldState.after && oldState.after.fn.call(this);
      this.trigger("after" + this._state[0].toUpperCase() + this._state.slice(1) + "State");
      this.trigger("afterState");
      for (var evt in oldState) {
        var stateEvt = oldState[evt];
        off(stateEvt.src, stateEvt.evt, stateEvt.fn);
      }
    }
    newState.before && newState.before.fn.call(this);
    this.trigger("before" + newStateName[0].toUpperCase() + newStateName.slice(1) + "State");
    this.trigger("beforeState");
    for (var evt in newState) {
      var stateEvt = newState[evt];
      on(stateEvt.src, stateEvt.evt, stateEvt.delegate, stateEvt.fn);
    }
    this._state = newStateName;
  },
  initStates: function(states) {
    "use strict";
    var protoStates = this.constructor.prototype.states;
    this.states = {};
    for (var stateName in protoStates) {
      var protoState = protoStates[stateName],
          instanceState = {};
      for (var evtId in protoState) {
        var evt = undefined,
            src = undefined,
            delegate = undefined,
            fn = undefined;
        var evtParams = evtId.split(" "),
            fnRef = protoState[evtId];
        if (evtParams[0] === 'document') {
          src = document;
          evtParams = evtParams.slice(1);
        } else if (evtParams[0] === 'window') {
          src = window;
          evtParams = evtParams.slice(1);
        } else {
          src = this;
        }
        evt = evtParams[0];
        delegate = evtParams.slice(1).join('');
        if (typeof fnRef === "function") fn = fnRef.bind(this); else if (typeof fnRef === "string") fn = function() {
          this._state = fnRef;
        }.bind(this);
        if (fn && evt) {
          instanceState[evt] = {
            evt: evt,
            src: src,
            delegate: delegate,
            fn: fn
          };
        }
      }
      this.states[stateName] = instanceState;
    }
  },
  disable: function() {
    "use strict";
    this.disabled = true;
  },
  enable: function() {
    "use strict";
    this.disabled = false;
  },
  set disabled(val) {
    "use strict";
    if (val) {
      this.setAttribute("disabled", true);
      this.disabled = true;
    } else {
      this.removeAttribute("disabled");
      this.disabled = false;
    }
  },
  get disabled() {
    "use strict";
    return this.disabled;
  },
  preventDefault: function(e) {
    "use strict";
    e.preventDefault();
  },
  addOnceListener: function(evt, fn) {
    "use strict";
    this.addEventListener(evt, function() {
      fn.apply(this);
      this.removeEventListener(evt, fn);
    }.bind(this));
  },
  delegateListener: function(evt, delegate, fn) {
    "use strict";
    if (typeof delegate === 'string') {
      delegate = this.querySelectorAll(delegate);
    } else if (delegate instanceof Element) {
      delegate = [delegate];
    } else if (delegate instanceof NodeList || delegate instanceof Array) {} else {
      delegate = [this];
    }
    this.addEventListener(evt, function(e) {
      if (delegate.indexOf(e.currentTarget) >= 0) {
        fn.call(this, e);
      }
    }.bind(this));
  },
  trigger: function(eName, data) {
    "use strict";
    var event = new CustomEvent(eName, data);
    if (this['on' + eName]) this['on' + eName].apply(this, event);
    this.dispatchEvent(event);
  },
  enable: function() {
    "use strict";
    this.disabled = false;
    this.trigger('disable');
  },
  disable: function() {
    "use strict";
    this.disabled = true;
    this.trigger('enable');
  }
}, {registerComponent: function(component) {
    "use strict";
    if ($Component.registry[component.name]) throw new Error("Component `" + $Component.name + "` does already exist");
    $Component.registry[component.name] = component;
    component.instances = [];
  }}, HTMLElement);
Component.registry = {};
document.addEventListener("DOMContentLoaded", function() {
  for (var name in Component.registry) {
    var Descendant = Component.registry[name];
    var lname = name.toLowerCase(),
        selector = ["[", lname, "], [data-", lname, "], .", lname, ""].join("");
    var targets = document.querySelectorAll(selector);
    for (var i = 0; i < targets.length; i++) {
      new Descendant(targets[i]);
    }
  }
});
var Draggable = function Draggable(el, opts) {
  "use strict";
  var self = $traceurRuntime.superCall(this, $Draggable.prototype, "constructor", [el, opts]);
  self._x = 0;
  self._y = 0;
  return self;
};
var $Draggable = Draggable;
($traceurRuntime.createClass)(Draggable, {
  startDrag: function(e) {
    "use strict";
    var offsets = offsetBox(this);
    this.dragstate = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: e.offsetX,
      offsetY: e.offsetY
    };
    this.trigger('dragstart');
    this.state = "drag";
  },
  drag: function(e) {
    "use strict";
    console.log("drag");
    var d = this.dragstate;
    var difX = e.clientX - d.clientX;
    var difY = e.clientY - d.clientY;
    d.isCtrl = e.ctrlKey;
    if (e.ctrlKey) {}
    d.clientX = e.clientX;
    d.clientY = e.clientY;
    this.x += difX;
    this.y += difY;
    this.trigger('drag');
  },
  stopDrag: function(e) {
    "use strict";
    console.log("stopDrag");
    this.trigger('dragstop');
    delete this.dragstate;
    this.state = "default";
  },
  get x() {
    "use strict";
    return this._x;
  },
  set x(x) {
    "use strict";
    this._x = x;
    this.style[cssPrefix + "transform"] = ["translate3d(", this._x, "px,", this._y, "px, 0)"].join("");
  },
  get y() {
    "use strict";
    return this._y;
  },
  set y(y) {
    "use strict";
    this._y = y;
    this.style[cssPrefix + "transform"] = ["translate3d(", this._x, "px,", this._y, "px, 0)"].join("");
  }
}, {}, Component);
Draggable.prototype.states = {
  'default': {
    before: null,
    after: null,
    'mousedown': Draggable.prototype.startDrag
  },
  drag: {
    before: null,
    after: null,
    'document selectstart': Draggable.prototype.preventDefault,
    'document mousemove': Draggable.prototype.drag,
    'document mouseup': Draggable.prototype.stopDrag,
    'document mouseleave': Draggable.prototype.stopDrag
  },
  scroll: {},
  tech: {},
  out: {}
};
Draggable.defaults = {
  treshold: 10,
  autoscroll: false,
  within: null,
  group: null,
  ghost: false,
  translate: true
};
Component.registerComponent(Draggable);
var Area = function Area(el, opts) {
  "use strict";
  var self = $traceurRuntime.superCall(this, $Area.prototype, "constructor", [el, opts]);
  self.pickers = [];
  var children = self.querySelectorAll("[data-picker]"),
      l = children.length,
      pNum = 0;
  if (l > 0) {
    for (var i = 0; i < l; i++) {
      self.addPicker(children.item(i));
    }
  }
  var pNum = 0;
  for (var i = 0; i < pNum; i++) {
    var el = document.createElement("div");
    self.addPicker(el, o.pickers[i]);
  }
  self.dragstate = {
    initX: 0,
    initY: 0,
    x: 0,
    y: 0,
    difX: 0,
    difY: 0,
    clientX: 0,
    clientY: 0,
    box: {},
    area: self,
    isCtrl: false,
    picker: null
  };
  self._listenEvents();
  return self;
};
var $Area = Area;
($traceurRuntime.createClass)(Area, {
  captureSize: function() {
    "use strict";
    self.offsetBox = getOffsetBox(self);
    self.paddingBox = getPaddingBox(self);
  },
  addPicker: function(el) {
    "use strict";
    this.pickers.push(new Picker(el, this));
  },
  _listenEvents: function() {
    "use strict";
    var o = this.options;
    this._dragstart = this._dragstart.bind(this);
    this._drag = this._drag.bind(this);
    this._dragstop = this._dragstop.bind(this);
    this.addEventListener("mousedown", this._dragstart);
    on(window, "resize", function() {
      self._captureSize();
      self.updatePickers();
    });
  },
  _dragstart: function(e) {
    "use strict";
    var o = this.options;
    this._captureSize();
    this.dragstate.x = e.clientX - this.offsetBox.left;
    this.dragstate.y = e.clientY - this.offsetBox.top;
    this.dragstate.clientX = e.clientX;
    this.dragstate.clientY = e.clientY;
    this.dragstate.picker = this.findClosestPicker(this.dragstate.x, this.dragstate.y);
    this.dragstate.box.top = this.offsetBox.top + this.paddingBox.top;
    this.dragstate.box.left = this.offsetBox.left + this.paddingBox.left;
    this.dragstate.box.right = this.offsetBox.right - this.paddingBox.right;
    this.dragstate.box.bottom = this.offsetBox.bottom - this.paddingBox.bottom;
    this.dragstate.box.width = this.offsetBox.width - this.paddingBox.left - this.paddingBox.right;
    this.dragstate.box.height = this.offsetBox.height - this.paddingBox.top - this.paddingBox.bottom;
    this._captureDragstate(this.dragstate, e);
    this.classList.add(this.options.dragClass);
    this.dragstate.picker.dragstart(this.dragstate);
    on(document, "selectstart", prevent);
    on(document, "mousemove", this._drag);
    on(document, "mouseup", this._dragstop);
    on(document, "mouseleave", this._dragstop);
  },
  _drag: function(e) {
    "use strict";
    var o = this.options;
    this._captureDragstate(this.dragstate, e);
    this.dragstate.picker.drag(this.dragstate);
  },
  _dragstop: function(e) {
    "use strict";
    this._drag(e);
    this.dragstate.picker.dragstop(this.dragstate);
    this.classList.remove(this.options.dragClass);
    off(document, "selectstart", this._prevent);
    off(document, "mousemove", this._drag);
    off(document, "mouseup", this._dragstop);
    off(document, "mouseleave", this._dragstop);
  },
  findClosestPicker: function(x, y) {
    "use strict";
    var minL = 9999,
        closestPicker;
    for (var i = 0; i < this.pickers.length; i++) {
      var picker = this.pickers[i],
          w = x - picker.x,
          h = y - picker.y,
          l = Math.sqrt(w * w + h * h);
      if (l < minL) {
        minL = l;
        closestPicker = i;
      }
    }
    return this.pickers[closestPicker];
  },
  updatePickers: function() {
    "use strict";
    for (var i = 0; i < this.pickers.length; i++) {}
  },
  _captureSize: function() {
    "use strict";
    this.offsetBox = getOffsetBox(this);
    this.paddingBox = getPaddingBox(this);
  },
  _captureDragstate: function(dragstate, e) {
    "use strict";
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
}, {get defaults() {
    "use strict";
    return {
      readonly: false,
      sniperSpeed: 0.25,
      dragClass: "dragging",
      oncreate: null,
      ondragstart: null,
      ondrag: null,
      ondragstop: null,
      ondestroy: null,
      onchange: null
    };
  }}, Component);
var Picker = function Picker(el, area, opts) {
  "use strict";
  var self = $traceurRuntime.superCall(this, $Picker.prototype, "constructor", [el, opts]);
  self.area = area;
  self.x = 0;
  self.y = 0;
  self.offsetBox = getOffsetBox(self);
  self.drag = self.drag.bind(self);
  self.dragstart = self.dragstart.bind(self);
  self.dragstop = self.dragstop.bind(self);
  return self;
};
var $Picker = Picker;
($traceurRuntime.createClass)(Picker, {
  startTracking: function() {
    "use strict";
    this.area.addEventListener("dragstart", this.dragstart);
    this.area.addEventListener("change", this.change);
    this.offsetBox = getOffsetBox(this);
  },
  stopTracking: function() {
    "use strict";
    this.area.removeEventListener("dragstart", this.dragstart);
    this.area.removeEventListener("change", this.change);
  },
  dragstart: function(state) {
    "use strict";
    this.initOffsetX = this.offsetBox.left - state.x;
    this.initOffsetY = this.offsetBox.top - state.y;
    this.offsetBox = getOffsetBox(this);
  },
  drag: function(state) {
    "use strict";
    var x = between(state.x - this.initOffsetX, 0, state.box.width - this.offsetBox.width);
    var y = between(state.y - this.initOffsetY, 0, state.box.height - this.offsetBox.height);
    trigger(this, "change", [x, y]);
    this.move(x, y);
  },
  dragstop: function() {
    "use strict";
  },
  move: function(x, y, nX, nY) {
    "use strict";
    this.style[cssPrefix + "transform"] = ["translate3d(", x, "px,", y, "px, 0)"].join("");
  },
  addEventListener: function(evt, fn) {
    "use strict";
    addEventListenerTo(this, evt, fn);
  },
  _calcValue: function(x, y) {
    "use strict";
    var o = this.options,
        l = 0;
    l = this.mapToL();
    return this.transferLToValue(l, this);
  },
  transferValueToL: function(value) {
    "use strict";
    var l = [],
        o = this.options;
    for (var i = 0; i < this.dimensions; i++) {
      var min = o.min[i],
          max = o.max[i];
      l[i] = (value[i] - min) / (max - min);
    }
    return l;
  },
  transferLToValue: function(l) {
    "use strict";
    var v = [],
        o = this.options;
    for (var i = 0; i < this.dimensions; i++) {
      var min = o.min[i],
          max = o.max[i];
      v[i] = l[i] * (max - min) + (min);
    }
    return v;
  },
  mapToL: function() {
    "use strict";
    var l = [],
        o = this.options,
        area = this.area;
    for (var i = 0; i < this.dimensions; i++) {
      var direction = o.direction[i];
      switch (o.direction[i]) {
        case "top":
          l[i] = (1 - this.top / area.height);
          break;
        case "bottom":
          l[i] = (this.top / area.height);
          break;
        case "left":
          l[i] = (1 - this.left / area.width);
          break;
        case "right":
          l[i] = (this.left / area.width);
          break;
        default:
      }
    }
    return l;
  },
  mapFromL: function(l) {
    "use strict";
    var o = this.options;
    for (var i = 0; i < this.dimensions; i++) {
      var direction = o.direction[i];
      switch (direction[i]) {
        case "top":
          this.top = Math.round((1 - l[i]) * this.area.height);
          break;
        case "bottom":
          this.top = Math.round(l[i] * this.area.height);
          break;
        case "right":
          this.left = Math.round((l[i]) * this.area.width);
          break;
        case "left":
          this.left = Math.round((1 - l[i]) * this.area.width);
          break;
      }
    }
  }
}, {}, Component);
Picker.defaults = {special: true};

//# sourceMappingURL=slidy.map