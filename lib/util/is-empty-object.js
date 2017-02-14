'use strict';

module.exports = function( value ) {
	// If the value is not object-like, then it is certainly not an empty object
	if ( typeof value !== 'object' ) {
		return false;
	}

	// For our purposes an empty array should not be treated as an empty object
	// (Since this is used to process invalid content-type responses, )
	if ( Array.isArray( value ) ) {
		return false;
	}

	for ( var key in value ) {
		if ( value.hasOwnProperty( key ) ) {
			return false;
		}
	}

	return true;
};
