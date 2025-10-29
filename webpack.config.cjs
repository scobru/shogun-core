const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
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
  // Remove Gun from externals to bundle it internally
  externals: {
    // gun: "Gun", // Commented out to bundle Gun internally
    // "gun/gun": "Gun", // Commented out to bundle Gun internally
    // "gun/sea": "Gun.SEA", // Commented out to bundle Gun internally
  },

  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      // Explicit aliases for Gun.js modules
      gun$: path.resolve(__dirname, "node_modules/gun/gun.js"),
      "gun/gun": path.resolve(__dirname, "node_modules/gun/gun.js"),
      "gun/sea": path.resolve(__dirname, "node_modules/gun/sea.js"),
      gun: path.resolve(__dirname, "node_modules/gun"),
      // Fix axios process/browser requirement
      "process/browser": require.resolve("process/browser"),
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
      gun: path.resolve(__dirname, "node_modules/gun/gun.js"),
      "gun/gun": path.resolve(__dirname, "node_modules/gun/gun.js"),
      "gun/sea": path.resolve(__dirname, "node_modules/gun/sea.js"),
      zlib: false, // winston/file.js - not needed in browser
      // Add Node.js core modules that should be ignored in browser builds
      http: false,
      https: false,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      ws: false,
      readline: false, // CLI-only module
      // Add fallback for neo4j (used by cypher-query)
      "neo4j/lib/GraphDatabase": false,
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
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
              plugins: [
                "@babel/plugin-transform-modules-commonjs",
                "@babel/plugin-proposal-optional-chaining",
              ],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    // Remove the IgnorePlugin for Gun since we want to bundle it
    // new webpack.IgnorePlugin({
    //   resourceRegExp: /gun\/(sea|lib)$/,
    //   contextRegExp: /node_modules/,
    // }),
    // Ignore Node.js modules that are not available in browser
    new webpack.IgnorePlugin({
      resourceRegExp: /^(http|https|fs|net|tls|child_process|ws)$/,
      contextRegExp: /node_modules/,
    }),
    // Ignore Gun.js ws.js file that imports Node.js ws module
    new webpack.IgnorePlugin({
      resourceRegExp: /gun\/lib\/ws\.js$/,
      contextRegExp: /node_modules/,
    }),
    // Add module concatenation plugin for better tree-shaking
    new webpack.optimize.ModuleConcatenationPlugin(),
    // Define Gun as a global variable
    new webpack.DefinePlugin({
      "typeof window": '"object"',
    }),
    // Remove the ProvidePlugin for Gun since we're bundling it
    // new webpack.ProvidePlugin({
    //   Gun: "gun",
    // }),
  ],
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === "production",
            drop_debugger: true,
          },
        },
      }),
    ],
    splitChunks: {
      chunks: "async",
      minSize: 20000,
      maxSize: 200000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: "~",
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
        },
      },
    },
  },
  performance: {
    maxEntrypointSize: 1000000, // Increased to 1MB
    maxAssetSize: 1000000, // Increased to 1MB
    hints: "warning",
  },
  // Add source map for better debugging
  devtool: "source-map",
  stats: {
    warningsFilter: [
      /the request of a dependency is an expression/,
      /Critical dependency: the request of a dependency is an expression/,
    ],
  },
};
