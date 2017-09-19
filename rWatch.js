(function(){
    var resolvePath = function(path, context, type){
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
    
    var execSingle = function(context, targetAttr, rule){
        var resolveResult = resolvePath(targetAttr, context.data, 'set');
        context.$update(targetAttr, rule.call(context, attrs, resolveResult.value[resolveResult.name]));
    };

    var bunchExec = function(context, targets){
        for(var attr in targets){
            var rule = targets[attr];
            execSingle(context, attr, rule);
        }
    };
    
    var throttle = function(fn){
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


    var maping = function(context){
        return new rWatch(context);
    };

    function rWatch(context){
        this.context = context;
        this.depTree = {};
    }

    function findInTree(tree, nodeName, result, findFirst){
        if(tree[nodeName]){
            if(findFirst) return tree[nodeName];
            result.push(tree[nodeName]);
        }
        for(var key in tree){
            var has = findInTree(tree[key], nodeName, result, findFirst)
            if(has){
                if(findFirst) return has;
                result.push(has);
            }
        }
        return result;
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

    window.rwatch = maping;

})();