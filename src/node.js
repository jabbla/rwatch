function Node(option){
    this.option = option || {};
    this.targets = [];
    option.target && this.targets.push(option.target);
    this.attrName = option.attrName;
}

Node.prototype.setTarget = function(targetNode){
    if(!targetNode){
        return;
    }
    this.targets.indexOf(targetNode) === -1 && this.targets.push(targetNode);
};

module.exports = Node;