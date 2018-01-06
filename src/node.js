function Node(option){
    this.option = option || {};
    this.targets = [];
    this.sources = [];
    option.target && this.targets.push(option.target);
    option.source && this.sources.push(option.source);
    this.attrName = option.attrName;
}

Node.prototype.setTarget = function(targetNode){
    if(!targetNode){
        return;
    }
    this.targets.indexOf(targetNode) === -1 && this.targets.push(targetNode);
};

Node.prototype.setSource = function(sourceNode){
    if(!sourceNode){
        return;
    }
    this.sources.indexOf(sourceNode) === -1 && this.sources.push(sourceNode);
};

Node.prototype.getAttrName = function(){
    return this.attrName;
};

Node.prototype.getTargets = function(){
    return this.targets;
};
module.exports = Node;