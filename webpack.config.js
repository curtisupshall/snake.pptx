const failPlugin = require('webpack-fail-plugin');
const fs = require('fs');
const path = require('path');

module.exports = {
    entry: `./src/`,
    target: 'node',
    node: {
        // Allow these globals.
        __filename: false,
        __dirname: false
    },
    output: {
        path: `./dist/`,
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    },
    bail: true,
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader?presets[]=es2015&compact=false'
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.ts$/,
                loader: 'babel-loader?presets[]=es2015&compact=false!ts-loader'
            },
            {
                test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
                loader: "file-loader"
            }
        ]
    },
    plugins: [
        failPlugin
    ]
};
