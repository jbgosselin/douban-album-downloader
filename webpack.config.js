const path = require('path');

module.exports = {
    target: 'electron-renderer',
    entry: './src/app.js',
    output: {
        filename: 'app.js',
        path: path.join(__dirname, 'build'),
        library: ["App"]
    },
};
