const path = require('path');
const webpack = require('webpack');
const FilemanagerPlugin = require('filemanager-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WextManifestWebpackPlugin = require('wext-manifest-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const viewsPath = path.join(__dirname, 'views');
const sourcePath = path.join(__dirname, 'source');
const destPath = path.join(__dirname, 'extension');
const nodeEnv = process.env.NODE_ENV || 'development';
const targetBrowser = process.env.TARGET_BROWSER;

const extensionReloaderPlugin =
  nodeEnv === 'development'
    ? new ExtensionReloader({
        port: 9090,
        reloadPage: true,
        entries: {
          contentScript: 'contentScript',
          extensionPage: ['popup', 'options', 'dataViewer', 'dataViewerStandalone'],
        },
      })
    : () => {
        this.apply = () => {};
      };

const getExtensionFileType = (browser) => {
  if (browser === 'opera') {
    return 'crx';
  }

  if (browser === 'firefox') {
    return 'xpi';
  }

  return 'zip';
};

const config = {
  devtool: false,
  stats: {
    all: false,
    builtAt: true,
    errors: true,
    hash: true,
  },
  mode: nodeEnv,
  entry: {
    manifest: path.join(sourcePath, 'manifest.json'),
    contentScript: path.join(sourcePath, 'ContentScript', 'index.js'),
    popup: path.join(sourcePath, 'Popup', 'index.jsx'),
    options: path.join(sourcePath, 'Options', 'index.jsx'),
    dataViewer: path.join(sourcePath, 'DataViewer', 'index.jsx'),
    dataViewerStandalone: path.join(sourcePath, 'DataViewer', 'standalone.js'),
    background: path.join(sourcePath, 'Background', 'background.js'),
  },
  output: {
    path: path.join(destPath, targetBrowser),
    filename: 'js/[name].bundle.js',
    globalObject: 'self',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      'webextension-polyfill': path.resolve(
        path.join(__dirname, 'node_modules', 'webextension-polyfill')
      ),
    },
  },
  node: {
    global: false,
  },
  module: {
    rules: [
      {
        type: 'javascript/auto',
        test: /manifest\.json$/,
        use: {
          loader: 'wext-manifest-loader',
          options: {
            usePackageJSONVersion: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(js|ts)x?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                ],
              },
            },
          },
          'resolve-url-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new WextManifestWebpackPlugin(),
    new webpack.SourceMapDevToolPlugin({filename: false}),
    new webpack.EnvironmentPlugin(['NODE_ENV', 'TARGET_BROWSER']),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        path.join(process.cwd(), `extension/${targetBrowser}`),
        path.join(
          process.cwd(),
          `extension/${targetBrowser}.${getExtensionFileType(targetBrowser)}`
        ),
      ],
      cleanStaleWebpackAssets: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, 'popup.html'),
      inject: 'body',
      chunks: ['popup'],
      hash: true,
      filename: 'popup.html',
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, 'options.html'),
      inject: 'body',
      chunks: ['options'],
      hash: true,
      filename: 'options.html',
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, 'data-viewer.html'),
      inject: 'body',
      chunks: ['dataViewer'],
      hash: true,
      filename: 'data-viewer.html',
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, 'data-viewer-standalone.html'),
      inject: 'body',
      chunks: ['dataViewerStandalone'],
      hash: true,
      filename: 'data-viewer-standalone.html',
    }),
    new MiniCssExtractPlugin({filename: 'css/[name].css'}),
    new CopyWebpackPlugin({
      patterns: [
        {from: 'source/assets', to: 'assets'},
        {from: 'source/data', to: 'data'},
      ],
    }),
    extensionReloaderPlugin,
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', {
            discardComments: {removeAll: true},
            calc: false,
            colormin: false
          }],
        },
      }),
      new FilemanagerPlugin({
        events: {
          onEnd: {
            archive: [
              {
                format: 'zip',
                source: path.join(destPath, targetBrowser),
                destination: `${path.join(
                  destPath,
                  targetBrowser
                )}.${getExtensionFileType(targetBrowser)}`,
                options: {zlib: {level: 6}},
              },
            ],
          },
        },
      }),
    ],
  },
};

// Configure for service worker compatibility
if (nodeEnv === 'production') {
  config.target = 'webworker';
  config.plugins.push(
    new webpack.DefinePlugin({
      'typeof window': '"undefined"',
      'typeof document': '"undefined"',
      'typeof navigator': '"undefined"',
      'typeof location': '"undefined"',
      'typeof history': '"undefined"',
      'typeof localStorage': '"undefined"',
      'typeof sessionStorage': '"undefined"',
    })
  );
} else {
  // In development, configure background script separately
  config.module.rules.push({
    test: /background\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['chrome >= 88']
            },
            modules: false
          }]
        ]
      }
    }
  });
}

module.exports = config;
