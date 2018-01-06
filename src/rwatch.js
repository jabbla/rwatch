var utils = require('./utils.js');
var findInTree = utils.findInTree;
var throttle = utils.throttle;
var Typeof = utils.typeOf;
var thenable = require('./thenable.js');
var Node = require('./node.js');
var ChartBuilder = require('./chartBuilder.js');


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
            attrName: sourceAttr
        })
    }
    sourceNode.setTarget(targetNode);
    targetNode.setSource(sourceNode);
}

rWatch.prototype.displayRelationGraph = function(){
    var roots = utils.findMapRoots(this.nodesMap);

    var chartBuilder = new ChartBuilder({roots: roots});

    chartBuilder.build();
};

module.exports = rWatch;