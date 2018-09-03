# rwatcher

[![npm version](https://badge.fury.io/js/rwatcher.svg)](https://badge.fury.io/js/rwatcher)

[![NPM](https://nodei.co/npm/rwatcher.png)](https://nodei.co/npm/rwatcher/)

[codePen例子][1]

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
#### 同步映射
> 同步映射函数的最终返回值将作为目标属性的最终值

```js
watcher.watch('source', 'target', function(){
    return 1; //1 将作为target属性的最终值
})
```

#### 异步映射
> 异步映射函数将取callback的实参作为目标属性的最终值

```js
watcher.asyncWatch('source', 'target', function(source, target, callback){
    setTimeout(function(){
        callback(1);    //1 将作为target属性的最终值
    }, 1000);
});
```

#### 更新监听
> 在watch之后调用then方法实现更新监听，可以链式调用then，基于tapable的applyPluginsWaterfall实现，目前不支持asyncWatch方法

```js
watcher.watch('source', 'target', function(){
    return 1; //1 将作为target属性的最终值
}).then(function(target, source){
    //这里拿到更新后的target属性值
    //source为{newValue, oldValue}对象
    return 2;
}).then(function(target, source){
    //这里拿到上一个then中的返回值2
    //source为{newValue, oldValue}对象
})
```


下面的例子同样适用于``asyncWatch``方法

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
or
watcher.watch('tab.current', ['select.source', 'select1.source'], MapSelect);
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

#### 属性映射关系图

使用``displayRelationGraph()``方法生成属性映射关系图

**例子**

```js
var watcher = this.rwatch();

watcher.watch('tabState.selected', ['selectState.selected', 'selectState.source'], [...]);
watcher.watch('tabState.selected', 'title', ..);
watcher.watch(['tabState.selected', 'selectState.source'], 'tableState.columns', ..);

watcher.displayRelationGraph();
```

生成的关系图：
> 其中_medium_0表示中介节点，表示多对一关系

![属性映射关系图][2]


  [1]: https://codepen.io/jabbla/pen/rGeodQ
  [2]: http://oc3wui92y.bkt.clouddn.com/%E6%8D%95%E8%8E%B7.JPG

## License
MIT