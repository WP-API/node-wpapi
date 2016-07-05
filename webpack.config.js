'use strict';

const path = require( 'path' );
const outputPath = path.join( __dirname, 'browser' );

module.exports = {
	entry: './wp.js',

	devtool: 'source-map',

	output: {
		path: outputPath,
		filename: 'wpapi.js',
		library: 'WPAPI',
		libraryTarget: 'umd'
	},

	module: {
		loaders: [
			{ test: /\.json$/, loader: 'json-loader' }
		]
	}
};
