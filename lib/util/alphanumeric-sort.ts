/**
 * Utility function for sorting arrays of numbers or strings.
 *
 * @module util/alphanumeric-sort
 * @param a The first comparator operand
 * @param b The second comparator operand
 * @returns -1 if the values are backwards, 1 if they're ordered, and 0 if they're the same
 */
const alphanumericSort = ( a: string, b: string ): number => {
	if ( a > b ) {
		return 1;
	}
	if ( a < b ) {
		return -1;
	}
	return 0;
};

export = alphanumericSort;
