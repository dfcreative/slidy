/**
* Controller on the elements
* Very similar to native elements
*/

//TODO: add document-level listener pluginName:event
//TODO: think how should it work within components group, like active tab
//TODO: private methods (_+...) should be hjidden on instances

class Component extends HTMLElement {

	//TODO: state criterias (visible/hidden) (active/inactive) (disabled/enabled) ...
	//TODO: state callbacks & declarative behaviour
	//TODO: adding states, declaratively
	//TODO: changing states through methods

	/**
	* Uses hack to extend native HTMLElement: swizzles element’s __proto__
	* It’s the only place where `this` isn’t actually an element.
	* All other methods use `this` as element reference
	*/
	constructor (el, opts){
		//ensure element created
		//ensure DOM extensibility
		//read options (el/passed)
		//hook up events
		//bind API methods
		//init instance states

		//Substitute `this` with DOM element
		//TODO: get rid of that hack when native `extends HTMLElement` will work
		var self;
		if (el instanceof HTMLElement) {
			self = el;
		} else {
			if (el){
				opts = el;
			}
			self = document.createElement('div');
		}

		//TODO: resolve prototype chain, if there’re more Component-ancestored elements
		//Intrude into el's prototype chain
		//save original element’s prototype, like HTMLDivElement or whatever
		var originalProto = self.__proto__;
		//`this` loses here
		self.__proto__ = this.constructor.prototype;

		//init API
		self.initAPI.call(self)

		//init options
		self.initOptions.call(self, opts);

		//keep track of instances;
		self._id = this.constructor.instances.length;
		this.constructor.instances.push(self);

		//init state
		self.initStates.apply(self);
		self.state = 'default';

		//treat element
		self.classList.add(this.constructor.lname);

		self.fire("create", null)
		//console.log(self.getBoundingClientRect())
		//console.log("HTMLCustomElement constructor")
		return self;
	}

	//simply binds methods to instance
	initAPI(){
		for (var meth in this){
			if (typeof this[meth] === "function")
				this[meth] = this[meth].bind(this);
		}
	}


	//--------------Options
	//TODO: hook up getters and setters for options, to reflect instantly element-write
	//TODO: hook up attributeChanged listeners, to reflect values of attributes
	//TODO: keep callbacks
	initOptions(extOpts){
		//read dataset attributes
		extOpts = extend(parseAttributes(this), extOpts);

		//for every instance option create attribute reflection (just set value)
		for (var key in extOpts){
			this[key] = extOpts[key];
		}

		//register observers for data-attributes
		this._observer = new MutationObserver(function(mutations) {
			if (this._preventOneAttrChange){
				this._preventOneAttrChange = true;
				return //console.log("attr change prevented");
			}

			for (var i = 0; i < mutations.length; i++){
				var mutation = mutations[i];
				if (mutation.type === "attributes"){
					var attr = mutation.attributeName;
					//if option attr changed - upd self value
					if (this.constructor.defaults[attr]){
						//TODO: catch attribute removal
						//TODO: avoid attr self-setup
						console.log("Attribute externally changed", parseAttr(this.getAttribute(attr)))
						this["_" + attr] = parseAttr(this.getAttribute(attr));
					}
				}
			}
		}.bind(this));
		this._observeConfig = {
			attributes: true
		}
		this.observeAttrChange();
	}

	/**
	* Gross attributes setter
	*/
	setAttributes(opts){
		for (var key in opts){
			this[key] = opts[key]
		}
	}
	/**
	* Get object settings
	*/
	getAttributes(){
		var result = {}
		for (var key in this.constructor.defaults){
			result[key] = this[key];
		}
		return result;
	}



	//-----------------States
	get state(){
		return this._state;
	}
	set state(newStateName){
		var oldState = this.states[this._state];
		var newState = this.states[newStateName] || this.states['default'];
		if (!newState) throw new Error("Not existing state `" + newStateName + "`");

		//console.log("Change state from `" + this._state + "` to `" + newStateName + "`")

		//handle exit
		if (oldState) {
			//trigger exit
			oldState.after && oldState.after.fn.call(this);
			this.fire("after" + this._state[0].toUpperCase() + this._state.slice(1) + "State");
			this.fire("afterState");

			//unbind old state events
			for(var evt in oldState){
				var stateEvt = oldState[evt]
				off(
					stateEvt.src,
					stateEvt.evt,
					stateEvt.fn
				);
			}
		}

		//handle enter
		//trigger enter
		newState.before && newState.before.fn.call(this);
		this.fire("before" + newStateName[0].toUpperCase() + newStateName.slice(1) + "State");
		this.fire("beforeState");

		//bind new state events
		for(var evt in newState){
			var stateEvt = newState[evt]
			on(
				stateEvt.src,
				stateEvt.evt,
				stateEvt.delegate,
				stateEvt.fn
			);

			//console.log(stateEvt)
		}

		this._state = newStateName;
	}

	/**
	* Instance states initilizer
	* Binds functions, recognizes objects to call
	* States parsed to object like
	* { state: { event: [src, delegate, fn], event: [src, delegate, fn], ... } }
	*/
	initStates(states){
		var protoStates = this.constructor.states;
		this.states = {};

		for (var stateName in protoStates){
			//create instance state based on proto states
			var protoState = protoStates[stateName],
				instanceState = {};

			//recognize events strings: src, evt, delegate
			//possible evt id:
			//`on('[document|window]? super:event .something > .which > is > #listening', fn)`
			//console.log("bind state", stateName , protoState)
			for (var evtId in protoState){
				//bind fn
				var fnRef = protoState[evtId], fn = undefined;
				if (typeof fnRef === "function"){
					fn = fnRef.bind(this);
				} else if (typeof fnRef === "string" && this[fnRef]){
					//NOTE: no need to bind `fn` here because it’s already been bound in `initAPI`
					fn = this[fnRef]//.bind(this);
					//console.log(evt, fnRef, fn)
				}

				var evtDirectives = evtId.split(',');
				for (var i = 0; i < evtDirectives.length; i++){
					var evtDirective = evtDirectives[i].trim();
					var evt = undefined, src = undefined, delegate = undefined;

					var evtParams = evtDirective.split(" ");

					//detect source
					if (evtParams[0] === 'document'){
						src = document;
						evtParams = evtParams.slice(1);
					} else if (evtParams[0] === 'window'){
						src = window
						evtParams = evtParams.slice(1);
					} else {
						src = this;
					}

					//detect evt name
					evt = evtParams[0];

					//is there delegatees?
					delegate = evtParams.slice(1).join('');

					//collect class instance state
					if (fn && evt){
						instanceState[evt] = {
							evt: evt,
							src: src,
							delegate: delegate,
							fn: fn
						};
					}
				}
			}
			//console.log("state", instanceState)
			this.states[stateName] = instanceState;


		}
		//console.log("States", this.states)
	}



	/**
	* Common component behaviour - enabled/disabled
	*/
	disable(){
		this.disabled = true;
		this.ignoreAttrChange();
		this.fire('disable');
	}
	enable(){
		this.disabled = false;
		this.observeAttrChange();
		this.fire('enable');
	}

	//attributes listeners
	observeAttrChange(){
		this._observer.observe(this, this._observeConfig)
	}

	ignoreAttrChange(){
		this._observer.disconnect();
	}

	//correct attribute setter - reflects value changed with throttling
	updateAttr(key, value){
		//TODO: throttle attr reflection
		if (!this._reflectAttrTimeout){
			//TODO: move this somewere to the beginning
			var prefix = Component.safeAttributes ? "data-" : "";

			//dashify case
			key = toDashedCase(key);

			//hide falsy attributes
			if (value === false){
				this.removeAttribute(key);
			} else {
				//avoid self attr-observer catch this attr changing
				this._preventOneAttrChange = true;
				this.setAttribute(prefix + key, stringify(value));
			}

			this._reflectAttrTimeout = setTimeout(function(){
				clearTimeout(this._reflectAttrTimeout);
				this._reflectAttrTimeout = null;

			}, 500);
		}
	}
	//TODO: these guys cause stack overflow because try to set themselves
	/*set disabled(val){
		if (val) {
			this.setAttribute("disabled", true);
			this.disabled = true;
		} else {
			this.removeAttribute("disabled")
			this.disabled = false;
		}
	}
	get disabled(){
		return this.disabled;
	}*/

	/**
	* Utils
	*/
	preventDefault(e){
		e.preventDefault()
	}


	//----------------------Events
	//as jquery one does
	addOnceListener(evt, fn){
		this.addEventListener(evt, function(){
			fn.apply(this);
			this.removeEventListener(evt, fn)
		}.bind(this))
	}

	//TODO: handle `:delegate` listener event, as x-tags does
	//listener wrapper, just makes chaining
	on(evt, fn){
		super.addEventListener(evt, fn);
		return this;
	}
	off(evt, fn){
		super.removeEventListener(evt, fn);
		return this;
	}

	//as jquery delegate does
	delegateListener(evt, delegate, fn){
		if (typeof delegate === 'string'){
			delegate = this.querySelectorAll(delegate)
		} else if (delegate instanceof Element){
			delegate = [delegate]
		} else if (delegate instanceof NodeList || delegate instanceof Array) {

		} else {
			delegate = [this];
		}

		this.addEventListener(evt, function(e){
			if (delegate.indexOf(e.currentTarget) >= 0) {
				fn.call(this, e);
			}
		}.bind(this))
	}

	//broadcaster
	fire(eName, data = undefined){
		fire(this, eName, data);
	}


	//autoinit found instances in DOM
	autoinit(){
		var lname =  this.constructor.lname,
			selector = ["[", lname, "], [data-", lname, "], .", lname, ""].join("");

		var targets = document.querySelectorAll(selector);
		for (var i = 0; i < targets.length; i++){
			new this.constructor(targets[i]);
		}
	}

}

/**
* Component registerer.
* Creates component based of constructor passed: inits it’s prototype, etc
* register descedant, make it autoload, call additional init (custom feature-detection etc)
*/
Component.register = function(constructor){
	//check whether component exists
	if (Component.registry[constructor.name]) throw new Error("Component `" + Component.name + "` does already exist");

	//save to registry
	Component.registry[constructor.name] = constructor;

	//keep track of instances
	constructor.instances = [];
	constructor.lname = constructor.name.toLowerCase();

	//init default options as prototype getters/setters with trigger
	var propsDescriptor = {};
	for (var key in constructor.defaults){
		//assign defaults - prototypical properties
		//NOTE: default values may be of other type than required, like number insteadof array
		constructor.prototype["_" + key] = constructor.defaults[key];

		//ignore already defined setter/getter
		if (Object.getOwnPropertyDescriptor(constructor.prototype,key)) continue;

		//make instance getter/setters
		var get = (function(key){
			return function(){
				return this['_' + key]
			}
		})(key)

		var set = (function(key){
			return function(value){
				//ignore same value
				if (this['_' + key ] === value) return;

				this['_' + key ] = value;
				this.updateAttr(key, value);
				this.fire("optionChanged")
				this.fire(value + "Changed")
			}
		})(key)

		propsDescriptor[key] = {
			//do not delete default properties
			configurable: false,
			//do not enumerate non-instance properties
			enumerable: false,
			get: get,
			set: set
		}
	}
	//console.log(propsDescriptor)
	Object.defineProperties(constructor.prototype, propsDescriptor);

	//Autoinit DOM elements
	constructor.prototype.autoinit();
}

//Keyed by name set of components
Component.registry = {}


//Component constructor, just to use as a fabric method
Component.create = function(el, opts){
	return new this.constructor(el, opts)
}



//Autolaunch registered components when document is ready
//TODO: probably it is better to init components before Ready - values, at least, should be there beforehead
/*document.addEventListener("DOMContentLoaded", function(){
	for (var name in Component.registry){
		var Descendant = Component.registry[name];

		var lname = Descendant.lname,
			selector = ["[", lname, "], [data-", lname, "], .", lname, ""].join("");

		//init all elements in DOM
		var targets = document.querySelectorAll(selector);
		for (var i = 0; i < targets.length; i++){
			new Descendant(targets[i]);
		}
	}
})*/
//init every element [classname], [data-classname] or .classname



//----------Init generic component behaviour

//whether to use data-attributes instead of straight ones, which may be invalid
Component.safeAttributes = Component.safeAttributes || false;

//whether to init components on
Component.autoinit = Component.autoinit || true;

//Whether to expose descendant classes to global
Component.exposeClasses = Component.exposeClasses || true;