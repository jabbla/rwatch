var rwatch = require('./src/rwatch.js');

var maping = function(context){
    return new rwatch(context);
};

maping.install = function(Regular){
    Regular.implement({
        rwatch: function(){
            return maping(this);
        }
    });
};

window.rwatch = maping;

module.exports = maping;