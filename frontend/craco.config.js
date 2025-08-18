// Load configuration from environment or config file
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Performance optimizations for production
      if (webpackConfig.mode === 'production') {
        // Enable long-term caching for static assets
        webpackConfig.output.filename = 'static/js/[name].[contenthash:8].js';
        webpackConfig.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
        
        // Ensure CSS files also have proper naming for caching
        const MiniCssExtractPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
        );
        if (MiniCssExtractPlugin) {
          MiniCssExtractPlugin.options.filename = 'static/css/[name].[contenthash:8].css';
          MiniCssExtractPlugin.options.chunkFilename = 'static/css/[name].[contenthash:8].chunk.css';
        }

        // Optimize HTML generation with performance improvements
        const htmlPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'HtmlWebpackPlugin'
        );
        if (htmlPlugin) {
          // Modify HTML plugin to add defer to script tags and preload for CSS
          htmlPlugin.options = {
            ...htmlPlugin.options,
            scriptLoading: 'defer', // This makes all scripts defer by default
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          };
        }

        // Add resource hints for better performance
        webpackConfig.plugins.push(
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html'),
            filename: 'index.html',
            inject: true,
            scriptLoading: 'defer',
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
            templateParameters: {
              'PUBLIC_URL': '',
            },
          })
        );
      }

      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
  devServer: {
    // Performance improvements for static asset serving
    static: {
      directory: path.join(__dirname, 'public'),
      serveIndex: true,
      watch: true,
    },
    // Add headers for caching in development (lighter caching)
    onBeforeSetupMiddleware: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.use('/static', (req, res, next) => {
        // Cache static assets for 1 hour in development, 1 year in production
        const maxAge = process.env.NODE_ENV === 'production' ? 31536000 : 3600;
        res.setHeader('Cache-Control', `public, max-age=${maxAge}${process.env.NODE_ENV === 'production' ? ', immutable' : ''}`);
        next();
      });
    },
  },
};