var Tapable = require('tapable');

function thenable(){
    this.tapable = new Tapable();
}

thenable.prototype.then = function(fn){
    this.tapable.plugin('then', fn);
};

module.exports = thenable;