const path = require('path');

module.exports = [
    {
        target: 'electron12-main',
        entry: './src/main.js',
        output: {
            filename: 'main.js',
            path: path.join(__dirname, 'build'),
        },
    },
    {
        target: 'electron12-preload',
        entry: './src/preload/preload.js',
        output: {
            filename: 'preload.js',
            path: path.join(__dirname, 'build'),
        },
    },
    {
        target: 'electron12-renderer',
        entry: './src/app/main.js',
        output: {
            filename: 'app.js',
            path: path.join(__dirname, 'build'),
            library: ["App"]
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        "targets": {
                                            "electron": 12
                                        }
                                    }
                                ],
                                "@babel/preset-react"
                            ],
                            "plugins": [
                                "@babel/plugin-proposal-class-properties"
                            ]
                        }
                    }
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
            ]
        }
    }
];
