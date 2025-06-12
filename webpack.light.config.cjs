const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'shogun-core.light.js',
    library: {
      name: 'ShogunCore',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
    },
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
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    // Ignora avvisi specifici per Gun.js
    new webpack.IgnorePlugin({
      resourceRegExp: /gun\/(sea|lib)$/,
      contextRegExp: /node_modules/,
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          filename: 'shogun-core.vendors.light.js',
          chunks: 'all'
        }
      }
    },
  },
  // Configurazione per ignorare avvisi specifici
  ignoreWarnings: [
    // Ignora avvisi relativi a Gun.js
    {
      module: /node_modules\/gun/,
      message: /Critical dependency/,
    },
  ],
  performance: {
    maxEntrypointSize: 300000,
    maxAssetSize: 300000,
    hints: 'warning',
  },
}; 