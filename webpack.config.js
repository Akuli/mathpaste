/* jshint node: true, esversion: 6 */

const resolve = require("path").resolve;

module.exports = {
  entry: "./js/index.ts",
  mode: "production",
  output: {
    filename: "main.js",
    path: resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            passPerPreset: true,
            presets: [
              "@babel/preset-typescript",
              [
                "@babel/preset-env",
                {
                  targets: "> 0.25%, not dead",
                  modules: false,
                  useBuiltIns: "usage",
                  corejs: "3.0.0",
                  exclude: ["@babel/plugin-transform-regenerator"],
                },
              ],
            ],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
      },
      {
        test: /\.(html|css|png)$/,
        exclude: /node_modules/,
        use: {
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
          },
        },
      },
    ],
  },
};
