var tpl = require('html-loader!./graphComponent.html');

module.exports = function(regular){
    return regular.extend({
        template: tpl,
        config: function(data){
            this.data = Object.assign({
                isOpen: false
            }, data);
        },
        init: function(){
            if(this.isOpen){
                this.setChartWraperStyle();
            }
        },
        setChartWraperStyle: function(){
            var chartWraper = this.$refs.chartWraper,
                maxY = this.data.maxY,
                windowScale = maxY / window.innerHeight;
    
            Object.assign(chartWraper.style, {
                width: '100%',
                height: (windowScale * 100 * 2) + '%'
            });
        },
        onOpen: function(e){
            this.data.isOpen = true;
            setTimeout(function(){
                this.setChartWraperStyle();
            }.bind(this), 0);
        },
        onClose: function(e){
            this.data.isOpen = false;
        },
        onLoad: function(){
            var chartWraper = this.$refs.chartWraper;
    
            this.data.chart = window.echarts.init(chartWraper);
            this.data.chart.setOption(this.data.chartOption);
        },
        onQuery: function(){
            var ChartBuilder = this.data.ChartBuilder;
            ChartBuilder.genDataWithRoots({rootNames: [this.data.rootAttrName]});
            this.data.chart.setOption(this.data.chartOption);
        },
        onReset: function(){
            var ChartBuilder = this.data.ChartBuilder;
            ChartBuilder.genDataWithRoots();
            this.data.chart.setOption(this.data.chartOption);
        }
    });
};