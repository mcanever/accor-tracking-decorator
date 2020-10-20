const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const license = fs.readFileSync(path.resolve(__dirname, 'LICENSE')).toString();

module.exports = function(env) {
    env.mode = env.mode || 'production';
    var webpackMode = 'production';
    var watch = false;
    var output = 'joandjoe-dist';

    if (env.mode === 'development') {
        watch = true;
        webpackMode = 'development'
        output = 'joandjoe-build-dev'
    } else if (env.mode === 'watch') {
        watch = true;
        webpackMode = 'production'
        output = 'joandjoe-dist'
    }

    return {
        entry: './src/init.ts',
        mode: webpackMode,
        watch: watch,
        devtool: webpackMode === 'development'? 'source-map': false,
        module: {
            rules: [
                {
                    test: /\.ts?$/,
                    include: path.resolve(__dirname, 'src'),
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true,
                                experimentalWatchApi: true,
                            }
                        }
                    ],
                },
            ],
        },
        resolve: {
            extensions: [ '.ts', '.js' ],
        },
        output: {
            filename: 'decorator.js',
            path: path.resolve(__dirname, output),
            pathinfo: false,
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: license
            }),
            new CopyWebpackPlugin([
                {
                    from: 'tests/*.html',
                    to: ''
                }
            ]),
        ],
    }
};

