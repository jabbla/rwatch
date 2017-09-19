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