/**
 * Helper method used by the "update default routes JSON"" script
 */
'use strict';

const objectReduce = require( '../../lib/util/object-reduce' );

/**
 * Walk through the keys and values of a provided object, removing any properties
 * which would be inessential to the generation of the route tree used to deduce
 * route handlers from a `wp-json/` root API endpoint. This module is not used by
 * the wpapi module itself, but is rather a dependency of the script that is used
 * to create the `endpoint-response.json` file that is shipped along with this
 * module for use in generating the "default" routes.
 *
 * @param {*} obj An arbitrary JS value, probably an object
 * @returns {*} The passed-in value, with non-essential args properties and all
 * _links properties removes.
 */
const simplifyObject = ( obj ) => {
	// Pass through falsy values, Dates and RegExp values without modification
	if ( ! obj || obj instanceof Date || obj instanceof RegExp ) {
		return obj;
	}

	if ( obj.methods && obj.args ) {
		// If the key is an object with "methods" and "args" properties, only
		// include the full "args" object if "methods" contains GET.
		if ( ! obj.methods.map( str => str.toLowerCase() ).includes( 'get' ) ) {
			obj.args = {};
		}
	}

	// Map arrays through simplifyObject
	if ( Array.isArray( obj ) ) {
		return obj.map( simplifyObject );
	}

	// Reduce through objects to run each property through simplifyObject
	if ( typeof obj === 'object' ) {
		return objectReduce(
			obj,
			( newObj, val, key ) => {
				// Omit _links objects entirely
				if ( key === '_links' ) {
					return newObj;
				}

				// If the key is "args", omit all keys of second-level descendants
				if ( key === 'args' ) {
					newObj.args = objectReduce(
						val,
						( slimArgs, argVal, argKey ) => {
							slimArgs[ argKey ] = {};
							return slimArgs;
						},
						{}
					);
				} else {
					// Pass all other objects through simplifyObject
					newObj[ key ] = simplifyObject( obj[ key ] );
				}
				return newObj;
			},
			{}
		);
	}

	// All other types pass through without modification
	return obj;
};

module.exports = simplifyObject;
