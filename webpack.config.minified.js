'use strict';

const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );

const umdConfig = require( './webpack.config' )[0];

// Re-use normal Webpack build config, just adding minification
module.exports = {
	...umdConfig,

	mode: 'production',

	devtool: 'hidden-source-map',

	output: {
		...umdConfig.output,
		filename: 'wpapi.min.js',
	},

	optimization: {
		noEmitOnErrors: true,
	},

	plugins: [
		...( umdConfig.plugins || [] ),
	],
};

// Conditionally opt-in to stats reporting UI.
if ( process.argv.includes( '--stats' ) ) {
	module.exports.plugins.push( new BundleAnalyzerPlugin() );
}
