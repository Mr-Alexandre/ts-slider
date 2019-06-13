const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const fs = require('fs');

// Our function that generates our html plugins
function generateNewHtmlWebpackPlugin(directory, item, templateDir) {
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];

    return new HtmlWebpackPlugin({
        filename: `./pages${directory}/${name}.html`,
        template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`)
    })
}

function recursiveSearchFile(folderPath, folderName) {
    // Read files in template directory
    let folderContents = fs.readdirSync(path.resolve(__dirname, folderPath));
    let collectionHtmlWebpackPlugin = [];
    folderContents.forEach(item => {
        let pathToContent = path.join(__dirname, folderPath, item);

        if (fs.lstatSync(pathToContent).isFile()) {
            const parts = item.split('.');
            const extension = parts[1];
            if (extension == 'pug') {
                collectionHtmlWebpackPlugin.push(generateNewHtmlWebpackPlugin(folderName, item, folderPath));
            }
        }
        if (fs.lstatSync(pathToContent).isDirectory()) {
            let newArr = recursiveSearchFile(`${folderPath}/${item}`, `${folderName}/${item}`);
            collectionHtmlWebpackPlugin = [...collectionHtmlWebpackPlugin, ...newArr]
        }
    });
    return collectionHtmlWebpackPlugin;
}

function generateHtmlPlugins (templateDir) {
    return recursiveSearchFile(templateDir, '');
}

// Call our function on our views directory.
let htmlPlugins = generateHtmlPlugins('./src/pages');

module.exports = (env, argv) => ({
    entry: './src/main.ts',
    // output: {
    //     filename: 'index.js',
    //     path: path.resolve(__dirname, './dist'),
    //     publicPath: 'dist/'
    // },
    devServer: {
        // index: '../index.html',
        port: 8080,
        open: true,
        hot: true,
        overlay: {
            warnings: true,
            errors: true
        },
        // contentBase: path.join(__dirname, './src'),
        // inline: true,
        // progress: true,
        // compress: true,
        
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                // loader: 'ts-loader',
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true, 
                            happyPackMode: true
                        }
                    }
                ],

                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.pug$/,
                // include: path.resolve(__dirname, 'src/'),
                use:  [
                    // 'html-loader',
                    {
                        loader: 'html-loader',
                        options: {
                            attrs: ['img:src', ':src']
                        }
                    },
                    {
                        loader: 'pug-html-loader',
                        query: { 
                            pretty: true
                        } 
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                          minimize: true,
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    // 'style-loader',
                    // MiniCssExtractPlugin.loader,
                    argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: "css-loader",
                        options: {
                            // url: false
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                autoprefixer({
                                    browsers:['ie >= 9', 'last 4 version']
                                })
                            ]
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.(ttf|otf|eot|svg|woff(2)(\?[a-z0-9]+)??)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            // outputPath: 'fonts/',
                            name: '[path][name].[ext]',
                            context: 'src',
                            publicPath: '/',
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            // name: '[path][name].[ext]',
                            context: 'src',
                            publicPath: '/',
                            // useRelativePath: true,
                            name: '[path][name].[ext]',
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
        new HtmlWebpackPlugin({
            template: './src/index.pug',
            filename: './index.html',
            inject: true
        }),
        new MiniCssExtractPlugin({
            filename: "index.css"
        }),
        new CopyWebpackPlugin([
            
        ])
    ].concat(htmlPlugins),
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-sourcemap',

});