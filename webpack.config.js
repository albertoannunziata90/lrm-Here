const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/L.Routing.Here.js',
  output: {
    filename: 'lrm-here.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  externals: {
    leaflet: 'L',
  },
  optimization: {
    minimize: false,
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
        loader: "babel-loader", 
        options: {
            presets: ["@babel/preset-env"]  
          }
        }
       }
    ]
  }
};