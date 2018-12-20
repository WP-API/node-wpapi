'use strict';

/**
 * Convert a (key, value) pair to a { key: value } object
 *
 * @module util/key-val-to-obj
 * @param {string} key   The key to use in the returned object
 * @param {}       value The value to assign to the provided key
 * @returns {object} A dictionary object containing the key-value pair
 */
module.exports = ( key, value ) => {
	const obj = {};
	obj[ key ] = value;
	return obj;
};
