/**
* Controller on the elements
* Very similar to native elements
*/

//TODO: add document-level listener pluginName:event
//TODO: think how should it work within components group, like active tab

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

		//Intrude into el's prototype chain
		//save original element’s prototype, like HTMLDivElement or whatever
		var originalProto = self.__proto__;
		//`this` loses here
		self.__proto__ = this.constructor.prototype;

		//init options
		self.initOptions.call(self, opts);

		//keep track of instances;
		self._id = this.constructor.instances.length;
		this.constructor.instances.push(self);

		//init state
		self.initStates.apply(self);
		self.state = 'default';

		//treat element
		self.classList.add(pluginName);

		self.trigger("create")
		//console.log(self.getBoundingClientRect())
		//console.log("HTMLCustomElement constructor")
		return self;
	}


	//--------------Options
	//TODO: hook up getters and setters for options, to reflect instantly element-write
	//TODO: hook up attributeChanged listeners, to reflect values of attributes
	//TODO: keep callbacks
	initOptions(extOpts){
		//read dataset attributes

		//for every instance option create attribute reflection
		for (var key in extOpts){
			this[key] = extOpts[key];
		}

		//register observers for data-attributes
		this._observer = new MutationObserver(function(mutations) {
			for (var i = 0; i < mutations.length; i++){
				var mutation = mutations[i];
				if (mutation.type === "attributes"){
					var attr = mutation.attributeName;
					//if option attr changed - upd self value
					if (this.constructor.defaults[attr]){
						this["_" + attr] = parseAttr(this.getAttribute(attr));
					}
				}
			}
		}.bind(this));
		this._observeConfig = {
			attributes: true
		}
		this._observer.observe(this, this._observeConfig);
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
		for (var key in this.defaults){
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

		console.log("Change state from `" + this._state + "` to `" + newStateName + "`")

		//handle exit
		if (oldState) {
			//trigger exit
			oldState.after && oldState.after.fn.call(this);
			this.trigger("after" + this._state[0].toUpperCase() + this._state.slice(1) + "State");
			this.trigger("afterState");

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
		this.trigger("before" + newStateName[0].toUpperCase() + newStateName.slice(1) + "State");
		this.trigger("beforeState");

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
		var protoStates = this.constructor.prototype.states;
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
				var evt = undefined, src = undefined, delegate = undefined, fn = undefined;

				var evtParams = evtId.split(" "),
					fnRef = protoState[evtId];

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

				//bind fn
				if (typeof fnRef === "function")
					fn = fnRef.bind(this);
				else if (typeof fnRef === "string")
					fn = function(){ this._state = fnRef }.bind(this);
				//console.log(evt, fnRef, fn)

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
		_observer.disconnect();
	}
	enable(){
		this.disabled = false;
		_observer.observe(this, this._observeConfig)
	}
	set disabled(val){
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
	}

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
	trigger(eName, data){
		//TODO: handle jQuery-way, if there is such
		//TODO: pass data
		//TODO: ie’s work
		//TODO: options callbacks
		//TODO: call document specific call
		//trigger()
		var event = new CustomEvent(eName, data)
		if (this['on' + eName]) this['on' + eName].apply(this, event);
		this.dispatchEvent(event);
	}


	//------------------------------Behaviour
	enable (){
		this.disabled = false;
		this.trigger('disable');
	}

	disable (){
		this.disabled = true;
		this.trigger('enable')
	}



	//-------------------------Autolaunch
	//register descedant, make it autoload, call additional init (custom feature-detection etc)
	static registerComponent(constructor, cb){
		//check whether component exists
		if (Component.registry[constructor.name]) throw new Error("Component `" + Component.name + "` does already exist");

		//save to registry
		Component.registry[constructor.name] = constructor;

		//keep track of instances
		constructor.instances = [];
		constructor.preinit = cb;

		//init default options as prototype getters/setters with trigger
		var propsDescriptor = {};
		for (var key in constructor.defaults){
			//make defaults - prototypical properties
			constructor.prototype["_" + key] = constructor.defaults[key];

			//make instance getter/setters
			var get = (function(key){
				return function(){
					return this['_' + key]
				}
			})(key)

			var set = (function(key){
				return function(value){
					this['_' + key ] = value;
					this.setAttribute(key, value);
					this.trigger("optionChanged")
					this.trigger(value + "Changed")
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
		Object.defineProperties(constructor.prototype, propsDescriptor);
	}

}

//Keyed by name set of components
Component.registry = {}

//Autolaunch registered components when document is ready
document.addEventListener("DOMContentLoaded", function(){
	for (var name in Component.registry){
		var Descendant = Component.registry[name];

		//make callbacks, if any
		Descendant.preinit && Descendant.preinit.apply(Descendant);

		var lname = name.toLowerCase(),
			selector = ["[", lname, "], [data-", lname, "], .", lname, ""].join("");

		//init all elements in DOM
		var targets = document.querySelectorAll(selector);
		for (var i = 0; i < targets.length; i++){
			new Descendant(targets[i]);
		}
	}
})
//init every element [classname], [data-classname] or .classname