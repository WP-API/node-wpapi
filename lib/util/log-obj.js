'use strict';

var inspect = require( 'util' ).inspect;

/**
 * Helper method for debugging only: use util.inspect to log a full object
 *
 * @module util/log-obj
 * @private
 * @param {object} obj The object to log
 * @returns {void}
 */
module.exports = function( obj ) {
	console.log( inspect( obj, {
		colors: true,
		depth: null
	}) );
};
