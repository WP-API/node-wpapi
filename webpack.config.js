'use strict';

const { join } = require( 'path' );

module.exports = {
	entry: './wpapi.js',

	mode: 'development',

	devtool: 'cheap-module-source-map',

	stats: {
		all: false,
		assets: true,
		colors: true,
		errors: true,
		performance: true,
		timings: true,
		warnings: true,
	},

	output: {
		path: join( process.cwd(), 'browser' ),
		filename: 'wpapi.js',
		library: 'WPAPI',
		libraryTarget: 'umd',
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				loader: require.resolve( 'babel-loader' ),
				options: {
					presets: [ '@babel/preset-env' ],
					plugins: [ '@babel/plugin-proposal-object-rest-spread' ],
					// Cache compilation results in ./node_modules/.cache/babel-loader/
					cacheDirectory: true,
				},
			},
		],
	},

};
