var path = require('path');
var webpack = require('webpack');
module.exports = {
    entry: {
        'rwatch': './index.js',
        'rwatch.min': './index.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist/')
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            compressor: {
              warnings: false
            }
        })
    ]
};