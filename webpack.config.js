/* jshint node: true, esversion: 6 */

const resolve = require("path").resolve;

module.exports = {
  entry: "./js/index.js",
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "main.js",
    path: resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.(html|css|png)$/,
        use: [{ loader: "file-loader", options: { name: "[path][name].[ext]"} }]
      }
    ]
  },
};
