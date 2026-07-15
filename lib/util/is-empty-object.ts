/**
 * Determine whether an provided value is an empty object
 *
 * @module util/is-empty-object
 * @param value A value to test for empty-object-ness
 * @returns Whether the provided value is an empty object
 */
const isEmptyObject = ( value: unknown ): boolean => {
	// If the value is not object-like, then it is certainly not an empty object
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}

	// For our purposes an empty array should not be treated as an empty object
	// (Since this is used to process invalid content-type responses, )
	if ( Array.isArray( value ) ) {
		return false;
	}

	for ( const key in value ) {
		if ( Object.prototype.hasOwnProperty.call( value, key ) ) {
			return false;
		}
	}

	return true;
};

export = isEmptyObject;
