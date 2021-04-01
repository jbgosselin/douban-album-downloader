const path = require('path');

module.exports = [
    {
        target: 'electron12-main',
        entry: './src/main.ts',
        output: {
            filename: 'main.js',
            path: path.join(__dirname, 'build'),
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
            ],
        },
    },
    {
        target: 'electron12-preload',
        entry: './src/preload.ts',
        output: {
            filename: 'preload.js',
            path: path.join(__dirname, 'build'),
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
            ],
        },
    },
    {
        target: 'electron12-renderer',
        entry: './src/app/main.tsx',
        output: {
            filename: 'app.js',
            path: path.join(__dirname, 'build'),
            library: ["App"],
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
    },
];
