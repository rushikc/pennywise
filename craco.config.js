const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configure Sass loader to use modern API and suppress deprecation warnings
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      if (oneOfRule) {
        const sassRule = oneOfRule.oneOf.find(rule =>
          rule.test && rule.test.toString().includes('scss|sass')
        );

        if (sassRule && sassRule.use) {
          sassRule.use.forEach(loader => {
            if (loader.loader && loader.loader.includes('sass-loader')) {
              loader.options = {
                ...loader.options,
                implementation: require('sass'),
                api: 'modern',
                sassOptions: {
                  silenceDeprecations: ['legacy-js-api'],
                  quietDeps: true,
                },
              };
            }
          });
        }
      }

      // Configure optimization for production builds
      if (webpackConfig.mode === 'production') {
        // Ensure optimization object exists
        if (!webpackConfig.optimization) {
          webpackConfig.optimization = {};
        }

        // Enable minimization
        webpackConfig.optimization.minimize = true;

        // Configure code splitting
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          maxInitialRequests: Infinity,
          minSize: 20000,
          maxSize: 150000, // Target smaller bundle sizes
          cacheGroups: {
            mui: {
              test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
              name: 'mui',
              priority: 20,
              chunks: 'all',
            },
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'firebase',
              priority: 20,
              chunks: 'all',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              name: 'react-vendor',
              priority: 20,
              chunks: 'all',
            },
            redux: {
              test: /[\\/]node_modules[\\/](@reduxjs|react-redux)[\\/]/,
              name: 'redux',
              priority: 20,
              chunks: 'all',
            },
            recharts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: 'recharts',
              priority: 20,
              chunks: 'all',
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        };

        // Configure minimizers
        webpackConfig.optimization.minimizer = [
          // JavaScript minification with Terser
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
                drop_console: true, // Remove console logs
                drop_debugger: true, // Remove debugger statements
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
            extractComments: false, // Avoid license files
            parallel: true,
          }),
          // CSS minification
          new CssMinimizerPlugin({
            minimizerOptions: {
              preset: [
                'default',
                {
                  discardComments: { removeAll: true },
                  minifyFontValues: { removeQuotes: false },
                },
              ],
            },
          }),
        ];

        // Add BundleAnalyzerPlugin for bundle analysis
        if (!webpackConfig.plugins) {
          webpackConfig.plugins = [];
        }
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-analysis-report.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: 'bundle-stats.json',
          })
        );
      }
      return webpackConfig;
    },
  },
};
