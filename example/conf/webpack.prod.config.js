const path = require('path'),
    {HashedModuleIdsPlugin} = require('webpack'),
    webpackBaseConfig = require('./webpack.base.config'),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin"),
    TerserPlugin = require('terser-webpack-plugin'),
    SmarterQiniuPlugin = require("../../src/index"),
    CleanWebpackPlugin = require('clean-webpack-plugin');


module.exports = {
    mode: "production",
    entry: webpackBaseConfig.entry,
    output: webpackBaseConfig.output,
    resolve: {
        ...webpackBaseConfig.resolve,
        alias: {
            ...webpackBaseConfig.resolve.alias,
            Config: path.resolve(__dirname, "../config/prod")
        }
    },
    module: webpackBaseConfig.module,
    optimization: {
        ...webpackBaseConfig.optimization,
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true
            }),
            new OptimizeCSSAssetsPlugin()
        ]
    },
    plugins: [
        ...webpackBaseConfig.plugins,
        new SmarterQiniuPlugin(),
        new HashedModuleIdsPlugin(),
        new MiniCssExtractPlugin({
            filename: 'build/css/[name].[contenthash:6].css'
        }),
        new CleanWebpackPlugin(
            ["build", "assets", "index.html"],
            {
                root: path.resolve(__dirname, '../static/'),
                exclude: ['robots.txt'],
                verbose: true,
                dry: false
            }
        )
    ]
};