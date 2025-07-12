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
    // Add clean webpack plugin configuration
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      // Explicit aliases for Gun.js modules
      "gun/gun": path.resolve(__dirname, "node_modules/gun/gun.js"),
      "gun/sea": path.resolve(__dirname, "node_modules/gun/sea.js"),
      "gun/lib/then": path.resolve(__dirname, "node_modules/gun/lib/then.js"),
      "gun": path.resolve(__dirname, "node_modules/gun"),
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
      {
        test: /node_modules\/(gun|gun-browser)\/((?!build).)*\.js$/,
        parser: {
          amd: false,
          commonjs: false,
          system: false,
          exprContext: false,
          wrappedContext: false,
          requireJs: false,
        },
      },
      // Add explicit loader for Gun.js modules
      {
        test: /node_modules\/gun\/(gun\.js|sea\.js)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-proposal-optional-chaining'
              ]
            }
          }
        ]
      }
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new webpack.DefinePlugin({
      "crypto.randomUUID": 
        'function() { return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8); return v.toString(16); })}',
    }),
    // Ignore specific Gun.js warnings
    new webpack.IgnorePlugin({
      resourceRegExp: /gun\/(sea|lib)$/,
      contextRegExp: /node_modules/,
    }),
    // Add module concatenation plugin for better tree-shaking
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 200000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        }
      }
    }
  },
  performance: {
    maxEntrypointSize: 1000000,  // Increased to 1MB
    maxAssetSize: 1000000,       // Increased to 1MB
    hints: 'warning'
  },
  // Add source map for better debugging
  devtool: 'source-map',
  stats: {
    warningsFilter: [
      /the request of a dependency is an expression/,
      /Critical dependency: the request of a dependency is an expression/,
    ],
  },
};
