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
var resolvePath = utils.resolvePath;
var findInTree = utils.findInTree;
var throttle = utils.throttle;
var Typeof = utils.typeOf;


function rWatch(context){
    this.context = context;
    this.depTree = {};
}

rWatch.prototype.judgeMapType = function(source, target, rule){
    if(source instanceof Array && rule instanceof Function){
        /**多对一映射 */
        this.multiToSingle(source, target, rule);
    }else if(target instanceof Array && rule instanceof Array){
        /**一对多 */
        this.singleToMulti(source, target, rule);
    }else if(typeof source === 'string' && typeof target === 'string'){
        /**一对一 */
        this.singleToSingle(source, target, rule);
    }
};

rWatch.prototype.singleToSingle = function(source, target, rule){
    var context = this.context,
        self = this;
    
    context.$watch(source, function(newValue){
        context.$update(target, rule.call(context, newValue, resolvePath(target, context.data)));
    });

};

rWatch.prototype.multiToSingle = function(sourceAttrs, targetAttr, rule){
    var context = this.context,
        self = this;

    var attrs = sourceAttrs.map(function(item){
        self.buildDep(item, targetAttr);

        var value = resolvePath(item, context.data),
            result = {};

        if(typeof value !== 'object'){
            self.addPrimitiveWatcher(item, result);
        }

        return Object.assign(result, {
            name: item,
            value: value
        });
    });

    setTimeout(function(){
        self.attrsFilter(attrs).forEach(function(item) {
            var source = attrs[item.index];
            context.$watch(source.name, throttle(function(newValue){
                source.value = newValue;  
                context.$update(targetAttr, rule.call(context, attrs.map(function(item){return item.value}), resolvePath(targetAttr, context.data)));
            }));
        });
    }, 0);
};

rWatch.prototype.singleToMulti = function(source, targets, rules){
    var context = this.context,
        self = this;

    targets.forEach(function(item){
        debugger;
        self.buildDep(source, item);
    });
    
    context.$watch(source, throttle(function(newValue){
        targets.forEach(function(item, index){
            context.$update(item, rules[index].call(context, newValue, resolvePath(item, context.data)));
        });
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

    this.judgeMapType(sourceAttrs, targetAttr, rule);
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

/***/ })
/******/ ]);