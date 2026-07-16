import util = require( 'util' );

const inspect = util.inspect;

/**
 * Helper method for debugging only: use util.inspect to log a full object
 *
 * @module util/log-obj
 * @private
 * @param obj The object to log
 */
const logObj = ( obj: unknown ): void => {
	// eslint-disable-next-line no-console
	console.log( inspect( obj, {
		colors: true,
		depth: null,
	} ) );
};

export = logObj;
