type ParamRequestLike = import( '../types' ).ParamRequestLike;

/**
 * Helper to create a simple parameter setter convenience method
 *
 * @module util/parameter-setter
 * @param param The string key of the parameter this method will set
 * @returns A setter method that can be assigned to a request instance
 */
const parameterSetter = ( param: string ) => {
	/**
	 * A setter for a specific parameter
	 *
	 * @chainable
	 * @param value The value to set for the parameter
	 * @returns The request instance on which this method was called (for chaining)
	 */
	return function( this: ParamRequestLike, value: unknown ): ParamRequestLike {
		return this.param( param, value );
	};
};

export = parameterSetter;
