'use strict';

const { join } = require( 'path' );

module.exports = {
	entry: {
		wpapi: './fetch',
		'wpapi-superagent': './superagent',
	},

	// Use browser builtins instead of Node packages where appropriate.
	externals: {
		'node-fetch': 'fetch',
		'form-data': 'FormData',
	},

	node: {
		fs: 'empty',
	},

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
		filename: '[name].js',
		library: 'WPAPI',
		libraryTarget: 'umd',
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
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
