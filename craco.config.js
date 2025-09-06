const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
      }
      return webpackConfig;
    },
  },
};
