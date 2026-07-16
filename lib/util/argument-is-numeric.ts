/**
 * Return true if the provided argument is a number, a numeric string, or an
 * array of numbers or numeric strings.
 *
 * @module util/argument-is-numeric
 * @param val The value to inspect
 * @returns Whether the provided value is numeric
 */
const argumentIsNumeric = ( val: number | string | Array<number | string> ): boolean => {
	if ( typeof val === 'number' ) {
		return true;
	}

	if ( typeof val === 'string' ) {
		return /^\d+$/.test( val );
	}

	if ( Array.isArray( val ) ) {
		for ( let i = 0; i < val.length; i++ ) {
			// Fail early if any argument isn't determined to be numeric
			if ( ! argumentIsNumeric( val[ i ] ) ) {
				return false;
			}
		}
		return true;
	}

	// If it's not an array, and not a string, and not a number, we don't
	// know what to do with it
	return false;
};

export = argumentIsNumeric;
