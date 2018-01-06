function ChartBuilder(option){
    this.roots = option.roots;
    this.formatedData = {data: [], links: []};
}

ChartBuilder.prototype.build = function(){
    this._formatData();
    this._configChartOptions();
    this._createLayout();
};

ChartBuilder.prototype._formatData = function(){
    var roots = this.roots,
        points = this.formatedData.data,
        link = this.formatedData.links;

    var formatUnit = function(unitRoot){
        var source = unitRoot,
            targets = unitRoot.getTargets(),
            sourceIndex = points.length,
            sourceAttrName = source.getAttrName();

        points.push({
            name: sourceAttrName,
            value: sourceAttrName
        });

        targets.forEach(function(target, index){
            var targetIndex = points.length,
                targetAttrName = target.getAttrName();

            points.push({
                name: targetAttrName,
                value: targetAttrName
            });

            links.push({
                source: sourceIndex,
                target: targetIndex
            });
            formatUnit(target);
        });
    };
    roots.forEach(function(root, index){
        var attrName = root.getAttrName();
        points.push({
            name: attrName,
            value: attrName,
        });
        
    });
};

ChartBuilder.prototype._configChartOptions = function(){};

ChartBuilder.prototype._createLayout = function(){};

module.exports = ChartBuilder;






