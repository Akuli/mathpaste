/* jshint node: true, esversion: 6 */

const resolve = require("path").resolve;

module.exports = {
  entry: "./js/index.ts",
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "main.js",
    path: resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-typescript",
              ["@babel/preset-env", {
                targets: "> 0.25%, not dead",
                modules: "false",
                useBuiltIns: "usage"
              }]
            ],
            plugins: [
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-proposal-class-properties"
            ],
          }
        }
      },
      {
        test: /\.(html|css|png)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]"
          }
        }
      }
    ]
  },
};
