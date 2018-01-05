function ChartBuilder(option){
    this.roots = roots = option.roots;
    this.formatedData = {data: [], links: []};

    this.formatData();
    this.configChartOptions();
    this.createLayout();
}

ChartBuilder.prototype.formatData = function(){};

ChartBuilder.prototype.configChartOptions = function(){};

ChartBuilder.prototype.createLayout = function(){};






