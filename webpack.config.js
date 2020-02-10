const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const license = fs.readFileSync(path.resolve(__dirname, 'LICENSE')).toString();

module.exports = {
    entry: './src/decorator.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.ts', '.js' ],
    },
    output: {
        filename: 'decorator.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: license
        }),
    ]
};

