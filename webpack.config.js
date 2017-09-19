var path = require('path');
module.exports = {
    entry: './index.js',
    output: {
        filename: 'rwatch.min.js',
        path: path.resolve(__dirname, './dist/')
    }
};