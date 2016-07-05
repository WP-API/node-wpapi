'use strict';

const webpack = require( 'webpack' );
const config = require( './webpack.config' );

// Re-use normal Webpack build config, just adding minification
config.output.filename = 'wpapi.min.js';
config.plugins = config.plugins || [];
config.plugins.push(new webpack.optimize.UglifyJsPlugin({
	compress: {
		warnings: false
	}
}));

module.exports = config;
