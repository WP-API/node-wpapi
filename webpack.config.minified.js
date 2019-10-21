'use strict';

const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );

const config = require( './webpack.config' );

// Re-use normal Webpack build config, just adding minification
module.exports = {
	...config,

	mode: 'production',

	devtool: 'hidden-source-map',

	output: {
		...config.output,
		filename: '[name].min.js',
	},

	optimization: {
		noEmitOnErrors: true,
	},

	plugins: [
		...( config.plugins || [] ),
	],
};

// Conditionally opt-in to stats reporting UI.
if ( process.argv.includes( '--stats' ) ) {
	module.exports.plugins.push( new BundleAnalyzerPlugin() );
}
