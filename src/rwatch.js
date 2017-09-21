var utils = require('./utils.js');
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