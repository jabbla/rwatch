/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var rwatch = __webpack_require__(1);

var maping = function(context){
    return new rwatch(context);
};

maping.install = function(Regular){
    Regular.implement({
        rwatch: function(){
            return maping(this);
        }
    });
};

window.rwatch = maping;

module.exports = maping;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var utils = __webpack_require__(2);
var findInTree = utils.findInTree;
var throttle = utils.throttle;
var Typeof = utils.typeOf;
var thenable = __webpack_require__(3);
var Node = __webpack_require__(5);


function rWatch(context){
    this.context = context;
    this.depTree = {};
    this.nodesMap = {};
    this.root = null;
}

rWatch.prototype.judgeMapType = function(source, target, rule, async, Thenable){
    if(source instanceof Array && typeof target === 'string'){
        /**多对一映射 */
        this.multiToSingle(source, target, rule, async, Thenable);
    }else if(target instanceof Array && typeof source === 'string'){
        /**一对多 */
        this.singleToMulti(source, target, rule, async, Thenable);
    }else if(typeof source === 'string' && typeof target === 'string'){
        /**一对一 */
        this.singleToSingle(source, target, rule, async, Thenable);
    }
};

rWatch.prototype.wrapAsync = function(arg1, target, targetValue, context, rule){

    var callback = function(result){
        context.$update(target, result)
    };
    
    rule.call(context, arg1, targetValue, callback);
};

rWatch.prototype.singleToSingle = function(source, target, rule, async, Thenable){
    var context = this.context,
        self = this;
    
    this.recordNodesMap({source: source, target: target});
    context.$watch(source, throttle(function(newValue, oldValue){
        var targetValue = context.$get(target);
        if(async){
            self.wrapAsync(newValue, target, targetValue, context, rule);
        }else{
            var result = rule.call(context, newValue, targetValue);
            context.$update(target, result);
            Thenable.tapable.applyPluginsWaterfall('then', result, {newValue: newValue, oldValue: oldValue});
        }
    }));

};



rWatch.prototype.multiToSingle = function(sourceAttrs, targetAttr, rule, async, Thenable){
    var context = this.context,
        self = this;

    var attrs = sourceAttrs.map(function(item){
        self.buildDep(item, targetAttr);

        self.recordNodesMap({source: item, target: '_connector_'});
        var value = context.$get(item),
            result = {};

        if(typeof value !== 'object'){
            self.addPrimitiveWatcher(item, result);
        }

        return Object.assign(result, {
            name: item,
            value: value
        });
    });

    self.recordNodesMap({source: '_connector_', target: targetAttr});
    setTimeout(function(){
        self.attrsFilter(attrs).forEach(function(item) {
            var source = attrs[item.index];
            context.$watch(source.name, throttle(function(newValue, oldValue){
                source.value = newValue;

                var sources = attrs.map(function(item){return item.value});
                var targetValue = context.$get(targetAttr);

                if(async){
                    self.wrapAsync(sources, target, targetValue, context, rule);
                }else{
                    var result = rule.call(context, sources, targetValue);
                    context.$update(targetAttr, result);
                    Thenable.tapable.applyPluginsWaterfall('then', result, {newValue: newValue, oldValue: oldValue});
                }
            }));
        });
    }, 0);
};

rWatch.prototype.singleToMulti = function(source, targets, rules, async, Thenable){
    var context = this.context,
        self = this;

    targets.forEach(function(item){
        self.buildDep(source, item);
        self.recordNodesMap({source: source, target: item});
    });
    
    context.$watch(source, throttle(function(newValue, oldValue){
        var targetValues = [];
        targets.forEach(function(item, index){
            var targetValue = context.$get(item);
            if(async){
                self.wrapAsync(newValue, item, targetValue, context, rules[index]);
            }else{
                var result;
                if(rules instanceof Function){
                    result = rules.call(context, newValue, targetValue);
                }else{
                    result = rules[index].call(context, newValue, targetValue)
                }
                context.$update(item, result);
                targetValues.push(result);
            }
        });
        Thenable.tapable.applyPluginsWaterfall('then', targetValues, {newValue: newValue, oldValue: oldValue});
    }));
};

rWatch.prototype.addPrimitiveWatcher = function(name, obj){
    var context = this.context;

    context.$watch(name, function(newValue){
        obj.value = newValue;
    });
};

rWatch.prototype.watch = function(sourceAttrs, targetAttr, rule){
    if(!sourceAttrs.length) return;

    var Thenable = new thenable();
    this.judgeMapType(sourceAttrs, targetAttr, rule, false, Thenable);

    return Thenable;
};

rWatch.prototype.asyncWatch = function(sourceAttrs, targetAttr, rule){
    if(!sourceAttrs.length) return;
    this.judgeMapType(sourceAttrs, targetAttr, rule, true);
};

rWatch.prototype.buildDep = function(source, target){
    var depTree = this.depTree;
    var node = findInTree(depTree, source, []);


    if(!node){
        depTree[source] = {};
        depTree[source][target] = {};
    }else{
        node[target] = {};
    }
};

rWatch.prototype.attrsFilter = function(attrs){
    var depTree = this.depTree,
        exclude = {};

    for(var j=attrs.length-1;j>=0;j--){
        var parentAttr = attrs[j].name;
        for(var i=j-1;i>=0;i--){
            var childAttr = attrs[i].name;
            
            var parentTree = findInTree(depTree, parentAttr, null, true);
            var has = findInTree(parentTree, childAttr, null, true);

            if(has){
                exclude[parentAttr] = true;
            }else{
                parentTree = findInTree(depTree, childAttr, null, true);
                has = findInTree(parentTree, parentAttr, null, true);
                if(has){
                    exclude[childAttr] = true;
                }
            }
        }
    }

    return attrs.filter(function(item, index){
        item.index = index;
        return !exclude[item.name];
    });

};

rWatch.prototype.recordNodesMap = function(option){
    var option = option || {},
        nodesMap = this.nodesMap,
        sourceAttr = option.source,
        targetAttr = option.target;

    var sourceNode = nodesMap[sourceAttr],
        targetNode = nodesMap[targetAttr];
    
    if(!targetNode){
        targetNode = nodesMap[targetAttr] = new Node({
            attrName: targetAttr
        });
    }

    if(!sourceNode){
        sourceNode = nodesMap[sourceAttr] = new Node({
            attrName: sourceAttr,
            target: targetNode
        })
    }else{
        sourceNode.setTarget(targetNode);
    }

}

module.exports = rWatch;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

var utils = {};
var toString = Object.prototype.toString;


utils.throttle = function(fn){
    var timer;
    return function(){
        var args = arguments;
        if(timer){
            clearTimeout(timer);
        }
        timer = setTimeout(function(){
            args = [].slice.call(args, 0);
            fn.apply(this, args);
        }, 0);
    }
};

utils.resolvePath = function(path, context, type){
    var attrs = path.split('.');

    if(type==='set'){
        var lastName = attrs[attrs.length-1];
        attrs = attrs.slice(0, -1);
    }

    var gen = function(attr, ctx, index){
        if(index === attrs.length){
            return ctx;
        }
        return gen(attrs[index+1], ctx[attr], index+1);
    };

    var result = type === 'set'? {name: lastName, value: gen(attrs[0], context, 0)} : gen(attrs[0], context, 0);

    return result;
};

utils.findInTree = function(tree, nodeName, result){
    if(tree[nodeName]){
        return tree[nodeName];
    }
    for(var key in tree){
        var has = utils.findInTree(tree[key], nodeName, result)
        if(has){
            return has;
        }
    }
}

utils.typeOf = function(item){
    
    if(typeof item !== 'object'){
        return typeof item;
    }
    return toString.call(item).slice(8, -1);
}

module.exports = utils;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var Tapable = __webpack_require__(4);

function thenable(){
    this.tapable = new Tapable();
}

thenable.prototype.then = function(fn){
    this.tapable.plugin('then', fn);
};

module.exports = thenable;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

// polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
// using the polyfill specifically to avoid the call to `Object.defineProperty` for performance reasons
function fastFilter(fun/*, thisArg*/) {
	'use strict';

	if (this === void 0 || this === null) {
		throw new TypeError();
	}

	var t = Object(this);
	var len = t.length >>> 0;
	if (typeof fun !== 'function') {
		throw new TypeError();
	}

	var res = [];
	var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
	for (var i = 0; i < len; i++) {
		if (i in t) {
			var val = t[i];

			// NOTE: Technically this should Object.defineProperty at
			//       the next index, as push can be affected by
			//       properties on Object.prototype and Array.prototype.
			//       But that method's new, and collisions should be
			//       rare, so use the more-compatible alternative.
			if (fun.call(thisArg, val, i, t)) {
				res.push(val);
			}
		}
	}

	return res;
}

function Tapable() {
	this._plugins = {};
}
module.exports = Tapable;

function copyProperties(from, to) {
	for(var key in from)
		to[key] = from[key];
	return to;
}

Tapable.mixin = function mixinTapable(pt) {
	copyProperties(Tapable.prototype, pt);
};

Tapable.prototype.applyPlugins = function applyPlugins(name) {
	if(!this._plugins[name]) return;
	var args = Array.prototype.slice.call(arguments, 1);
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++)
		plugins[i].apply(this, args);
};

Tapable.prototype.applyPlugins0 = function applyPlugins0(name) {
	var plugins = this._plugins[name];
	if(!plugins) return;
	for(var i = 0; i < plugins.length; i++)
		plugins[i].call(this);
};

Tapable.prototype.applyPlugins1 = function applyPlugins1(name, param) {
	var plugins = this._plugins[name];
	if(!plugins) return;
	for(var i = 0; i < plugins.length; i++)
		plugins[i].call(this, param);
};

Tapable.prototype.applyPlugins2 = function applyPlugins2(name, param1, param2) {
	var plugins = this._plugins[name];
	if(!plugins) return;
	for(var i = 0; i < plugins.length; i++)
		plugins[i].call(this, param1, param2);
};

Tapable.prototype.applyPluginsWaterfall = function applyPluginsWaterfall(name, init) {
	if(!this._plugins[name]) return init;
	var args = Array.prototype.slice.call(arguments, 1);
	var plugins = this._plugins[name];
	var current = init;
	for(var i = 0; i < plugins.length; i++) {
		args[0] = current;
		current = plugins[i].apply(this, args);
	}
	return current;
};

Tapable.prototype.applyPluginsWaterfall0 = function applyPluginsWaterfall0(name, init) {
	var plugins = this._plugins[name];
	if(!plugins) return init;
	var current = init;
	for(var i = 0; i < plugins.length; i++)
		current = plugins[i].call(this, current);
	return current;
};

Tapable.prototype.applyPluginsWaterfall1 = function applyPluginsWaterfall1(name, init, param) {
	var plugins = this._plugins[name];
	if(!plugins) return init;
	var current = init;
	for(var i = 0; i < plugins.length; i++)
		current = plugins[i].call(this, current, param);
	return current;
};

Tapable.prototype.applyPluginsWaterfall2 = function applyPluginsWaterfall2(name, init, param1, param2) {
	var plugins = this._plugins[name];
	if(!plugins) return init;
	var current = init;
	for(var i = 0; i < plugins.length; i++)
		current = plugins[i].call(this, current, param1, param2);
	return current;
};

Tapable.prototype.applyPluginsBailResult = function applyPluginsBailResult(name) {
	if(!this._plugins[name]) return;
	var args = Array.prototype.slice.call(arguments, 1);
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].apply(this, args);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsBailResult1 = function applyPluginsBailResult1(name, param) {
	if(!this._plugins[name]) return;
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].call(this, param);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsBailResult2 = function applyPluginsBailResult2(name, param1, param2) {
	if(!this._plugins[name]) return;
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].call(this, param1, param2);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsBailResult3 = function applyPluginsBailResult3(name, param1, param2, param3) {
	if(!this._plugins[name]) return;
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].call(this, param1, param2, param3);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsBailResult4 = function applyPluginsBailResult4(name, param1, param2, param3, param4) {
	if(!this._plugins[name]) return;
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].call(this, param1, param2, param3, param4);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsBailResult5 = function applyPluginsBailResult5(name, param1, param2, param3, param4, param5) {
	if(!this._plugins[name]) return;
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++) {
		var result = plugins[i].call(this, param1, param2, param3, param4, param5);
		if(typeof result !== "undefined") {
			return result;
		}
	}
};

Tapable.prototype.applyPluginsAsyncSeries = Tapable.prototype.applyPluginsAsync = function applyPluginsAsyncSeries(name) {
	var args = Array.prototype.slice.call(arguments, 1);
	var callback = args.pop();
	var plugins = this._plugins[name];
	if(!plugins || plugins.length === 0) return callback();
	var i = 0;
	var _this = this;
	args.push(copyProperties(callback, function next(err) {
		if(err) return callback(err);
		i++;
		if(i >= plugins.length) {
			return callback();
		}
		plugins[i].apply(_this, args);
	}));
	plugins[0].apply(this, args);
};

Tapable.prototype.applyPluginsAsyncSeries1 = function applyPluginsAsyncSeries1(name, param, callback) {
	var plugins = this._plugins[name];
	if(!plugins || plugins.length === 0) return callback();
	var i = 0;
	var _this = this;
	var innerCallback = copyProperties(callback, function next(err) {
		if(err) return callback(err);
		i++;
		if(i >= plugins.length) {
			return callback();
		}
		plugins[i].call(_this, param, innerCallback);
	});
	plugins[0].call(this, param, innerCallback);
};

Tapable.prototype.applyPluginsAsyncSeriesBailResult = function applyPluginsAsyncSeriesBailResult(name) {
	var args = Array.prototype.slice.call(arguments, 1);
	var callback = args.pop();
	if(!this._plugins[name] || this._plugins[name].length === 0) return callback();
	var plugins = this._plugins[name];
	var i = 0;
	var _this = this;
	args.push(copyProperties(callback, function next() {
		if(arguments.length > 0) return callback.apply(null, arguments);
		i++;
		if(i >= plugins.length) {
			return callback();
		}
		plugins[i].apply(_this, args);
	}));
	plugins[0].apply(this, args);
};

Tapable.prototype.applyPluginsAsyncSeriesBailResult1 = function applyPluginsAsyncSeriesBailResult1(name, param, callback) {
	var plugins = this._plugins[name];
	if(!plugins || plugins.length === 0) return callback();
	var i = 0;
	var _this = this;
	var innerCallback = copyProperties(callback, function next(err, result) {
		if(arguments.length > 0) return callback(err, result);
		i++;
		if(i >= plugins.length) {
			return callback();
		}
		plugins[i].call(_this, param, innerCallback);
	});
	plugins[0].call(this, param, innerCallback);
};

Tapable.prototype.applyPluginsAsyncWaterfall = function applyPluginsAsyncWaterfall(name, init, callback) {
	if(!this._plugins[name] || this._plugins[name].length === 0) return callback(null, init);
	var plugins = this._plugins[name];
	var i = 0;
	var _this = this;
	var next = copyProperties(callback, function(err, value) {
		if(err) return callback(err);
		i++;
		if(i >= plugins.length) {
			return callback(null, value);
		}
		plugins[i].call(_this, value, next);
	});
	plugins[0].call(this, init, next);
};

Tapable.prototype.applyPluginsParallel = function applyPluginsParallel(name) {
	var args = Array.prototype.slice.call(arguments, 1);
	var callback = args.pop();
	if(!this._plugins[name] || this._plugins[name].length === 0) return callback();
	var plugins = this._plugins[name];
	var remaining = plugins.length;
	args.push(copyProperties(callback, function(err) {
		if(remaining < 0) return; // ignore
		if(err) {
			remaining = -1;
			return callback(err);
		}
		remaining--;
		if(remaining === 0) {
			return callback();
		}
	}));
	for(var i = 0; i < plugins.length; i++) {
		plugins[i].apply(this, args);
		if(remaining < 0) return;
	}
};

Tapable.prototype.applyPluginsParallelBailResult = function applyPluginsParallelBailResult(name) {
	var args = Array.prototype.slice.call(arguments, 1);
	var callback = args[args.length - 1];
	if(!this._plugins[name] || this._plugins[name].length === 0) return callback();
	var plugins = this._plugins[name];
	var currentPos = plugins.length;
	var currentResult;
	var done = [];
	for(var i = 0; i < plugins.length; i++) {
		args[args.length - 1] = (function(i) {
			return copyProperties(callback, function() {
				if(i >= currentPos) return; // ignore
				done.push(i);
				if(arguments.length > 0) {
					currentPos = i + 1;
					done = fastFilter.call(done, function(item) {
						return item <= i;
					});
					currentResult = Array.prototype.slice.call(arguments);
				}
				if(done.length === currentPos) {
					callback.apply(null, currentResult);
					currentPos = 0;
				}
			});
		}(i));
		plugins[i].apply(this, args);
	}
};

Tapable.prototype.applyPluginsParallelBailResult1 = function applyPluginsParallelBailResult1(name, param, callback) {
	var plugins = this._plugins[name];
	if(!plugins || plugins.length === 0) return callback();
	var currentPos = plugins.length;
	var currentResult;
	var done = [];
	for(var i = 0; i < plugins.length; i++) {
		var innerCallback = (function(i) {
			return copyProperties(callback, function() {
				if(i >= currentPos) return; // ignore
				done.push(i);
				if(arguments.length > 0) {
					currentPos = i + 1;
					done = fastFilter.call(done, function(item) {
						return item <= i;
					});
					currentResult = Array.prototype.slice.call(arguments);
				}
				if(done.length === currentPos) {
					callback.apply(null, currentResult);
					currentPos = 0;
				}
			});
		}(i));
		plugins[i].call(this, param, innerCallback);
	}
};

Tapable.prototype.hasPlugins = function hasPlugins(name) {
	var plugins = this._plugins[name];
	return plugins && plugins.length > 0;
};


Tapable.prototype.plugin = function plugin(name, fn) {
	if(Array.isArray(name)) {
		name.forEach(function(name) {
			this.plugin(name, fn);
		}, this);
		return;
	}
	if(!this._plugins[name]) this._plugins[name] = [fn];
	else this._plugins[name].push(fn);
};

Tapable.prototype.apply = function apply() {
	for(var i = 0; i < arguments.length; i++) {
		arguments[i].apply(this);
	}
};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

function Node(option){
    this.option = option || {};
    this.targets = [];
    option.target && this.targets.push(option.target);
    this.attrName = option.attrName;
}

Node.prototype.setTarget = function(targetNode){
    if(!targetNode){
        return;
    }
    this.targets.indexOf(targetNode) === -1 && this.targets.push(targetNode);
};

module.exports = Node;

/***/ })
/******/ ]);