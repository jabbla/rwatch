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
    console.log(this.formatedData);
    this._configChartOptions();
    this._createLayout();
};

ChartBuilder.prototype._createPoint = function(option){
    var attrName = option.attrName,
        pointsIndexer = this.pointsIndexer,
        points = this.formatedData.data;
    
    if(!pointsIndexer[attrName]){
        pointsIndexer[attrName] = true;
        points.push({
            name: attrName,
            value: attrName,
            x: option.x,
            y: option.y
        });
    }
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
        symbolGap = this.symbolGap;

    var formatUnit = function(option){
        var unitRoot = option.root,
            targets = unitRoot.getTargets();
        
        if(targets.length === 0){
            return;
        }
        var source = unitRoot,
            sourceAttrName = source.getAttrName();
            parentX = option.coordinate.x, parentY = option.coordinate.y;

        self._createPoint({attrName: sourceAttrName, x: parentX, y: parentY});
        console.log(unitRoot);
        targets.forEach(function(target, index){
            var targetAttrName = target.getAttrName(),
                childX = option.coordinate.x + symbolGap + symbolSize,
                childY = index*(symbolGap + symbolSize);

            self._createPoint({attrName: targetAttrName, x: childX, y: childY});
            self._createLink({sourceAttrName: sourceAttrName, targetAttrName: targetAttrName});

            formatUnit({root: target, coordinate: {x: childX, y: childY}});
        });
    };
    roots.forEach(function(root, index){
        formatUnit({root: root, coordinate: {x: 0, y: 0}});
    });
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
        tooltip: {},
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
                // links: [],
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
        oContainer = this.container,
        chartOption = this.chartOption;

    Object.assign(oContainer.style, {
        position: 'fixed',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: 0.8,
        top: 0,
        left: 0
    });

    Object.assign(oChartWraper.style, {
        width: '100%',
        height: '100%'
    });
    
    var echartsScript = document.createElement('script');
    echartsScript.src = 'https://cdn.bootcss.com/echarts/3.8.5/echarts.min.js';
    echartsScript.onload = function(){

        var chart = window.echarts.init(oChartWraper);
        chart.setOption(chartOption);
    };

    oContainerWraper.appendChild(echartsScript);
    oContainerWraper.appendChild(oContainer);
    oContainer.appendChild(oChartWraper);
};

module.exports = ChartBuilder;






