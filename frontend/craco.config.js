// Load configuration from environment or config file
const path = require('path');

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
        
        // Ensure CSS files also have proper naming
        const MiniCssExtractPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
        );
        if (MiniCssExtractPlugin) {
          MiniCssExtractPlugin.options.filename = 'static/css/[name].[contenthash:8].css';
          MiniCssExtractPlugin.options.chunkFilename = 'static/css/[name].[contenthash:8].chunk.css';
        }
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
    headers: process.env.NODE_ENV === 'production' ? {
      'Cache-Control': 'public, max-age=31536000, immutable',
    } : undefined,
  },
};