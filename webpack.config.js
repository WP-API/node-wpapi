'use strict';

const { join } = require( 'path' );

const config = {
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

const umd = {
	...config,
	output: {
		path: join( process.cwd(), 'dist/umd' ),
		filename: 'wpapi.js',
		library: 'WPAPI',
		libraryTarget: 'umd',
	},
};

const es = {
	...config,
	output: {
		path: join( process.cwd(), 'dist/es' ),
		filename: 'wpapi.js',
	},
};

module.exports = [ umd, es ];
