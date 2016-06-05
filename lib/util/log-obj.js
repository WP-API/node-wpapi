'use strict';

var inspect = require( 'util' ).inspect;

module.exports = function( obj ) {
	console.log( inspect( obj, {
		colors: true,
		depth: null
	}) );
};
