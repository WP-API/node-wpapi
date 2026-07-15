/**
 * Ensure that a property is present in an object, initializing it to a default
 * value if it is not already defined. Modifies the provided object by reference.
 *
 * @module util/ensure
 * @param obj              The object in which to ensure a property exists
 * @param prop             The property key to ensure
 * @param propDefaultValue The default value for the property
 */
const ensure = ( obj: Record<string, unknown>, prop: string, propDefaultValue: unknown ): void => {
	if ( obj && obj[ prop ] === undefined ) {
		obj[ prop ] = propDefaultValue;
	}
};

export = ensure;
