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
var ChartBuilder = __webpack_require__(6);


function rWatch(context){
    this.context = context;
    this.depTree = {};
    this.nodesMap = {};
    this.root = null;
    this.currentConnector = 0;
    this.connectorName = '_medium_';
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
        self = this,
        currentConnector = this.currentConnector++,
        connector = this.connectorName + currentConnector;

    var attrs = sourceAttrs.map(function(item){
        self.buildDep(item, targetAttr);

        self.recordNodesMap({source: item, target: connector + ''});
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

    self.recordNodesMap({source: connector, target: targetAttr});
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
            attrName: sourceAttr
        })
    }
    sourceNode.setTarget(targetNode);
    targetNode.setSource(sourceNode);
}

rWatch.prototype.displayRelationGraph = function(option){
    var roots = utils.findMapRoots(this.nodesMap),
        option = option || {},
        container = option.container,
        containerWraper = option.containerWraper,
        chartBuilder = new ChartBuilder({roots: roots, container: container, containerWraper: containerWraper, nodesMap: this.nodesMap});

    chartBuilder.build();
};

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

utils.findMapRoots = function(map){
    var roots = [];

    /**寻找根节点 */
    for(var attr in map){
        var node = map[attr];
        if(node.sources.length === 0){
            roots.push(node);
        }
    }

    return roots;
};

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
    this.sources = [];
    option.target && this.targets.push(option.target);
    option.source && this.sources.push(option.source);
    this.attrName = option.attrName;
}

Node.prototype.setTarget = function(targetNode){
    if(!targetNode){
        return;
    }
    this.targets.indexOf(targetNode) === -1 && this.targets.push(targetNode);
};

Node.prototype.setSource = function(sourceNode){
    if(!sourceNode){
        return;
    }
    this.sources.indexOf(sourceNode) === -1 && this.sources.push(sourceNode);
};

Node.prototype.getAttrName = function(){
    return this.attrName;
};

Node.prototype.getTargets = function(){
    return this.targets;
};
module.exports = Node;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var graphComponent = __webpack_require__(7);

function ChartBuilder(option){
    this.roots = option.roots;
    this.symbolSize = option.symbolSize || 60;
    this.symbolGap = option.symbolGap || 10;
    this.formatedData = {data: [], links: []};
    this.nodesMap = option.nodesMap;
    this.pointsIndexer = {};
    this.chartOption = {};
    this.container = option.container || document.createElement('div');
    this.containerWraper = option.containerWraper || document.getElementsByTagName('body')[0];
    this.chartTitle = option.chartTitle || '';
}

ChartBuilder.prototype.build = function(){
    this._formatData();
    this._configChartOptions();
    this._createLayout();
};

ChartBuilder.prototype._createPoint = function(option){
    var attrName = option.attrName,
        pointsIndexer = this.pointsIndexer,
        points = this.formatedData.data,
        existed = pointsIndexer[attrName];
    
    if(!existed){
        pointsIndexer[attrName] = true;
        points.push({
            name: attrName,
            value: attrName,
            x: option.x,
            y: option.y
        });
    }
    return existed;
};

ChartBuilder.prototype._existPoint = function(attrName){
    return this.pointsIndexer[attrName];
};

ChartBuilder.prototype._createLink = function(option){
    var links = this.formatedData.links,
        sourceAttrName = option.sourceAttrName,
        targetAttrName = option.targetAttrName;

    links.push({
        source: sourceAttrName,
        target: targetAttrName,
        
    });
};

ChartBuilder.prototype._formatData = function(option){
    var roots = (option && option.roots) || this.roots,
        self = this, symbolSize = this.symbolSize,
        symbolGap = this.symbolGap,
        step = symbolSize + symbolGap,
        stepX = step, stepY = step,
        currentY = 0, maxY = roots.map(function(root, index){ return  0});

    var formatUnit = function(option, rootIndex){
        var unitRoot = option.root,
            targets = unitRoot.getTargets();

        if(targets.length === 0){
            return;
        }
        var source = unitRoot,
            sourceAttrName = source.getAttrName();
            parentX = option.coordinate.x, parentY = option.coordinate.y;

        self._createPoint({attrName: sourceAttrName, x: parentX, y: parentY});
        targets.forEach(function(target, index){
            var targetAttrName = target.getAttrName(),
                childX = option.coordinate.x + stepX,
                childY = index*stepY + option.coordinate.y;

            if(maxY[rootIndex] < childY){
                maxY[rootIndex] = childY;
            }

            var existed = self._createPoint({attrName: targetAttrName, x: childX, y: childY});
            if(existed){
                option.coordinate.y -= step;
            }
            self._createLink({sourceAttrName: sourceAttrName, targetAttrName: targetAttrName});

            formatUnit({root: target, coordinate: {x: childX, y: childY}}, rootIndex);
        });
    };
    roots.forEach(function(root, index){
        var baseY = 0;
        if(index !== 0){
            baseY = maxY[index? index-1 : 0] + (stepY);
        }
        formatUnit({root: root, coordinate: {x: 0, y: baseY}}, index);
    });
    this.maxY = maxY[maxY.length -1];
};

ChartBuilder.prototype._configChartOptions = function(option){
    var chartOption = this.chartOption,
        data = this.formatedData.data,
        links = this.formatedData.links,
        symbolSize = this.symbolSize,
        chartTitle = this.chartTitle;

    Object.assign(chartOption, {
        title: {
            text: chartTitle
        },
        left: 0,
        tooltip: {},
        toolbox: {
            feature: {
                saveAsImage: {
                    name: '关系图',
                    pixelRatio: 2
                }
            },
            left: 'left'
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series : [
            {
                type: 'graph',
                layout: 'none',
                symbolSize: symbolSize,
                roam: true,
                label: {
                    normal: {
                        show: true
                    }
                },
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],
                edgeLabel: {
                    normal: {
                        textStyle: {
                            fontSize: 20
                        }
                    }
                },
                data: data,
                links: links,
                lineStyle: {
                    normal: {
                        width: 3,
                        curveness: -0.3
                    }
                }
            }
        ]
    });
};

ChartBuilder.prototype._createLayout = function(){
    var oContainerWraper = this.containerWraper,
        oContainer = this.container;
    
    
    new graphComponent({data: {
        maxY: this.maxY,
        chartOption: this.chartOption,
        ChartBuilder: this,
    }}).$inject(oContainerWraper);
};

ChartBuilder.prototype.genDataWithRoots = function(option){
    var nodesMap = this.nodesMap;
    var roots = (option && option.rootNames.map(function(rootName){
        return nodesMap[rootName];
    })) || this.roots;
    this.formatedData = {data: [], links: []};
    this.pointsIndexer = {};

    this._formatData({roots: roots});
    this._configChartOptions();
};

module.exports = ChartBuilder;








/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var tpl = __webpack_require__(8);

var GraphComponent = Regular.extend({
    template: tpl,
    config: function(data){
        this.data = Object.assign({
            isOpen: false
        }, data);
    },
    init: function(){
        if(this.isOpen){
            this.setChartWraperStyle();
        }
    },
    setChartWraperStyle: function(){
        var chartWraper = this.$refs.chartWraper,
            maxY = this.data.maxY,
            windowScale = maxY / window.innerHeight;

        Object.assign(chartWraper.style, {
            width: '100%',
            height: (windowScale * 100 * 2) + '%'
        });
    },
    onOpen: function(e){
        this.data.isOpen = true;
        setTimeout(function(){
            this.setChartWraperStyle();
        }.bind(this), 0);
    },
    onClose: function(e){
        this.data.isOpen = false;
    },
    onLoad: function(){
        var chartWraper = this.$refs.chartWraper;

        this.data.chart = window.echarts.init(chartWraper);
        this.data.chart.setOption(this.data.chartOption);
    },
    onQuery: function(){
        var ChartBuilder = this.data.ChartBuilder;
        ChartBuilder.genDataWithRoots({rootNames: [this.data.rootAttrName]});
        this.data.chart.setOption(this.data.chartOption);
    },
    onReset: function(){
        var ChartBuilder = this.data.ChartBuilder;
        ChartBuilder.genDataWithRoots();
        this.data.chart.setOption(this.data.chartOption);
    }
});

module.exports = GraphComponent;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = "{#if !isOpen}\r\n<a \r\n    ref=\"test\"\r\n    style=\"position: fixed; display: block; width: 50px; height: 50px; border-radius: 50%; bottom: 50px; right: 50px; text-align: center; line-height: 50px; border: 1px solid #54a8f7;\"\r\n    on-click={this.onOpen($event)}\r\n>关系图</a>\r\n{#else}\r\n<div class=\"rwatch-relGraph\" style=\"position: fixed; width: 100%; height: 100%; overflow-y: auto; background: rgba(0, 0, 0, 0.8); top: 0;\">\r\n    <a\r\n        style=\"position: absolute; right: 0; top: 0; padding: 10px; color: white; z-index: 1;\"\r\n        on-click={this.onClose($event)}>关闭</a>\r\n    <div style=\"position: fixed; top: 0; padding: 20px; color: white; z-index: 9999;\">\r\n        输入根属性名称：<input type=\"text\" r-model={rootAttrName}/>\r\n        <button on-click={this.onQuery($event)}>查询</button>\r\n        <button on-click={this.onReset($event)}>重置</button>\r\n    </div>\r\n    <div ref=\"chartWraper\"></div>\r\n</div>\r\n<script src=\"https://cdn.bootcss.com/echarts/3.8.5/echarts.min.js\" on-load={this.onLoad($event)}></script>\r\n{/if}\r\n";

/***/ })
/******/ ]);