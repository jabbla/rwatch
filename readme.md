# rwatcher

## 快速上手
```bash
npm install rwatcher --save
```

浏览器中引用
```html
<script src="./node_modules/rwatcher/dist/rwatcher.js"></script>
```

### Regular组件中使用
```js
var Regular = require('Regular');
var rwatcher = require('rwatcher');

rwatcher.install(Regular);

var App = Regular.extend({
    config: function(){
        var watcher = this.rwatch(this);
        watcher.watch(..);
        });
    }
});
```

### watch方法使用说明
假设有以下组件
```js
var App = Reguar.extend({
    data: {
        tab: {
            source: [],
            current: 0
        },
        select: {
            source: [],
            current: 0
        },
        select1: {
            source: [],
            current: 0
        },
        headers: [],
        selectSate: ''
    },
    config: function(){
        var watcher = this.rwatch(this);
    }
});
```

#### 一对一映射
> ``watch(sourceAttr, targetAttr, rule)``
``sourceAttr``的变动影响``targetAttr``，``rule``中可依次取到两个属性的当前值，返回值将作为``targetAttr``的最终值

```js
watcher.watch('select.source', 'headers', function(source, target){
    //source，target分别为当前两个属性的值，返回值作为headers属性的最终值
    return MapSourceToHeaders(source)
});
```

#### 一对多映射
> ``watch(sourceAttr, [targetAttr1, targetAttr2....], rules)``
``[targetAttr1, targetAttr2....]``为``sourceAttr``影响的属性集合，rules为映射规则集合，与属性集合一一对应

```js
watcher.watch('tab.current', ['select.source', 'select1.source'], [MapSelect, MapSelect1]);
```

#### 多对一映射
> ``watch([sourceAttr1, sourceAttr2...], targetAttr, rule)``
``[sourceAttr1, sourceAttr2...]``为共同影响targetAttr的属性集合，rule为映射规则

注：不必担心在``[sourceAttr1, sourceAttr2...]``中存在多余属性从而监听多余的改变，rwatcher会分析属性间的关系，将``[sourceAttr1, sourceAttr2...]``处理为更加合理的版本
```js
watcher.watch(['select.current', 'select1.current'], 'selectSate', function(sources, target){
    //sources是属性值数组，对应属性数组，sources[0]---select.current，sources[1]---select1.current
    return CombineState(sources);
});
```






