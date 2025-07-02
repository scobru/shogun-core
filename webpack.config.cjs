const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist/browser"),
    filename: "shogun-core.js",
    library: {
      name: "ShogunCore",
      type: "umd",
    },
    globalObject: "this",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      // Alias per le dipendenze di gun, non per i file locali
      gun$: path.resolve(__dirname, "node_modules/gun"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
      util: require.resolve("util"),
      os: require.resolve("os-browserify"),
      path: require.resolve("path-browserify"),
      vm: require.resolve("vm-browserify"),
      assert: require.resolve("assert/"),
      constants: require.resolve("constants-browserify"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    // Aggiungi un polyfill per crypto.randomUUID
    new webpack.DefinePlugin({
      "crypto.randomUUID":
        'function() { return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8); return v.toString(16); })}',
    }),
    // Ignora avvisi specifici per Gun.js
    new webpack.IgnorePlugin({
      resourceRegExp: /gun\/(sea|lib)$/,
      contextRegExp: /node_modules/,
    }),
  ],
  optimization: {
    minimize: true,
  },
  // Configurazione per ignorare avvisi specifici
  ignoreWarnings: [
    // Ignora avvisi relativi a Gun.js
    {
      module: /node_modules\/gun/,
      message: /Critical dependency/,
    },
    // Ignora avvisi relativi a asn1.js
    {
      module: /node_modules\/asn1\.js/,
      message: /.*webpack < 5 used to include polyfills.*/,
    },
  ],
  // Aumentare il limite della dimensione per evitare avvisi di performance
  performance: {
    maxEntrypointSize: 550000,
    maxAssetSize: 550000,
    hints: "warning",
  },
};
