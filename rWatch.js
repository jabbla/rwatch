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
    
    var addWatcher = function(context, targetAttr, attrs, index, rule){
        var source = attrs[index];
        context.$watch(source.name, throttle(function(newValue){
            source.value = newValue;  
            var resolveResult = resolvePath(targetAttr, context.data, 'set');
            context.$update(targetAttr, rule.call(context, attrs, resolveResult.value[resolveResult.name]));
        }));
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
        return function(sourceAttrs, targetAttr, rule){
            if(!sourceAttrs.length) return;

            var attrs = sourceAttrs.map(function(item){
                return {
                    name: item,
                    value: resolvePath(item, context.data)
                };
            });

            attrs.forEach(function(item, index) {
                addWatcher(context, targetAttr, attrs, index, rule);
            });
            
        };
    };

    window.rWatch = maping;
})();