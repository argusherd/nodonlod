const path = require("path");

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    app: "./renderer/ts/app.ts",
  },
  mode: "none",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    clean: true,
    filename: "[name].js",
    path: path.resolve(__dirname, "public/js"),
  },
};
