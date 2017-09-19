var utils = require('./utils.js');
var resolvePath = utils.resolvePath;
var findInTree = utils.findInTree;
var throttle = utils.throttle;


function rWatch(context){
    this.context = context;
    this.depTree = {};
}

rWatch.prototype.addWatcher = function(targetAttr, attrs, index, rule){
    var context = this.context;
    var source = attrs[index];

    context.$watch(source.name, throttle(function(newValue){
        source.value = newValue;  

        var resolveResult = resolvePath(targetAttr, context.data, 'set');
        context.$update(targetAttr, rule.call(context, attrs, resolveResult.value[resolveResult.name]));

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
            self.addWatcher(targetAttr, attrs, item.index, rule);
        });
    }, 0);
};

rWatch.prototype.buildDep = function(source, target){
    var depTree = this.depTree;

    var nodes = findInTree(depTree, source, []);

    nodes.forEach(function(node){
        node[target] = {};
    });

    if(!nodes.length){
        depTree[source] = {};
        depTree[source][target] = {};
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