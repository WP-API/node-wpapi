'use strict';

/**
 * Walk through the keys and values of a provided object, removing any properties
 * which would be inessential to the generation of the route tree used to deduce
 * route handlers from a `wp-json/` root API endpoint. This module is not used by
 * the wordpress-rest-api module itself, but is rather a dependency of the script
 * that is used to create the `endpoint-response.json` file that is shipped along
 * with this module for use in generating the "default" routes.
 *
 * @param {*} obj An arbitrary JS value, probably an object
 * @returns {*} The passed-in value, with non-essential args properties and all
 * _links properties removes.
 */
function simplifyObject( obj ) {
	// Pass through falsy values, Dates and RegExp values without modification
	if ( ! obj || obj instanceof Date || obj instanceof RegExp ) {
		return obj;
	}

	// Map arrays through simplifyObject
	if ( Array.isArray( obj ) ) {
		return obj.map( simplifyObject );
	}

	// Reduce through objects to run each property through simplifyObject
	if ( typeof obj === 'object' ) {
		return Object.keys( obj ).reduce(function( newObj, key ) {
			// Omit _links objects entirely
			if ( key === '_links' ) {
				return newObj;
			}

			// If the key is "args", omit all keys of second-level descendants
			// other than "required"
			if ( key === 'args' ) {
				newObj.args = Object.keys( obj.args ).reduce(function( slimArgs, arg ) {
					slimArgs[ arg ] = {
						required: obj.args[ arg ].required
					};
					return slimArgs;
				}, {});
			} else {
				// Pass all other objects through simplifyObject
				newObj[ key ] = simplifyObject( obj[ key ] );
			}
			return newObj;
		}, {});
	}

	// All other types pass through without modification
	return obj;
}

module.exports = simplifyObject;
