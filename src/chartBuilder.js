function ChartBuilder(option){
    this.roots = option.roots;
    this.symbolSize = option.symbolSize || 60;
    this.symbolGap = option.symbolGap || 10;
    this.formatedData = {data: [], links: []};
    this.pointsIndexer = {},
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

ChartBuilder.prototype._formatData = function(){
    var roots = this.roots,
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

ChartBuilder.prototype._configChartOptions = function(){
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
        oChartWraper = document.createElement('div'),
        oClose = document.createElement('a'),
        oTrigger = document.createElement('div'),
        oContainer = this.container,
        chartOption = this.chartOption,
        maxY = this.maxY,
        windowScale = maxY / window.innerHeight;
    
    /**关闭按钮 */
    Object.assign(oClose.style, {
        position: 'absolute',
        right: 0,
        top: 0,
        margin: '10px',
        color: 'white'
    });
    oClose.innerHTML = '关闭';
    oClose.onclick = function(){
        oContainer.style.display = 'none'
    };

    Object.assign(oContainer.style, {
        position: 'fixed',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: 0.8,
        top: 0,
        left: 0,
        display: 'none',
        overflow: 'auto',
        zIndex: '9999999999'
    });

    Object.assign(oChartWraper.style, {
        width: '100%',
        height: (windowScale * 100 * 2) + '%'
    });
    
    var echartsScript = document.createElement('script');
    echartsScript.src = 'https://cdn.bootcss.com/echarts/3.8.5/echarts.min.js';
    echartsScript.onload = function(){
        oContainer.style.display = 'block';
        var chart = window.echarts.init(oChartWraper);
        chart.setOption(chartOption);
        oContainer.style.display = 'none';
    };
    /**图表开关 */
    Object.assign(oTrigger.style, {
        position: 'fixed',
        bottom: 0,
        right: 0,
        margin: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        lineHeight: '50px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#ddd'
    });
    oTrigger.innerHTML = '关系图';
    oTrigger.onclick = function(){
        oContainer.style.display = 'block';
    };

    oContainerWraper.appendChild(echartsScript);
    oContainerWraper.appendChild(oContainer);
    oContainerWraper.appendChild(oTrigger);
    oContainer.appendChild(oChartWraper);
    oContainer.appendChild(oClose);
};

module.exports = ChartBuilder;






