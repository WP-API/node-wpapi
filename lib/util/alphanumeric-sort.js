'use strict';

/**
 * Utility function for sorting arrays of numbers or strings.
 *
 * @module util/alphanumeric-sort
 * @param {String|Number} a The first comparator operand
 * @param {String|Number} a The second comparator operand
 * @returns -1 if the values are backwards, 1 if they're ordered, and 0 if they're the same
 */
module.exports = ( a, b ) => {
	if ( a > b ) {
		return 1;
	}
	if ( a < b ) {
		return -1;
	}
	return 0;
};
