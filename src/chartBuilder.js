var graphComponent = require('./graphComponent/graphComponent.js');

function ChartBuilder(option){
    this.roots = option.roots;
    this.symbolSize = option.symbolSize || 60;
    this.symbolGap = option.symbolGap || 10;
    this.formatedData = {data: [], links: []};
    this.nodesMap = option.nodesMap;
    this.pointsIndexer = {};
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

ChartBuilder.prototype._formatData = function(option){
    var roots = (option && option.roots) || this.roots,
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

ChartBuilder.prototype._configChartOptions = function(option){
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
        oContainer = this.container;
    
    
    new graphComponent({data: {
        maxY: this.maxY,
        chartOption: this.chartOption,
        ChartBuilder: this,
    }}).$inject(oContainerWraper);
};

ChartBuilder.prototype.genDataWithRoots = function(option){
    var nodesMap = this.nodesMap;
    var roots = (option && option.rootNames.map(function(rootName){
        return nodesMap[rootName];
    })) || this.roots;
    this.formatedData = {data: [], links: []};
    this.pointsIndexer = {};

    this._formatData({roots: roots});
    this._configChartOptions();
};

module.exports = ChartBuilder;






