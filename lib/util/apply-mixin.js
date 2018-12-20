'use strict';

/**
 * Augment an object (specifically a prototype) with a mixin method
 * (the provided object is mutated by reference)
 *
 * @module util/apply-mixin
 * @param {Object} obj The object (usually a prototype) to augment
 * @param {String} key The property to which the mixin method should be assigned
 * @param {Function} mixin The mixin method
 * @returns {void}
 */
module.exports = ( obj, key, mixin ) => {
	// Will not overwrite existing methods
	if ( typeof mixin === 'function' && ! obj[ key ] ) {
		obj[ key ] = mixin;
	}
};
