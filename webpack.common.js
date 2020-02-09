const path = require('path');

module.exports = {
    target: 'electron-renderer',
    entry: './src/main.js',
    output: {
        filename: 'app.js',
        path: path.join(__dirname, 'build'),
        library: ["App"]
    },
    "module": {
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
                                        "electron": 7
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
};
