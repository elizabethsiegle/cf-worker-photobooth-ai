const path = require('path');

module.exports = {
  entry: './src/worker.ts',
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: 'webworker',
  mode: 'production',
};
