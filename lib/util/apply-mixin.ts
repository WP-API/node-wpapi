/**
 * Augment an object (specifically a prototype) with a mixin method
 * (the provided object is mutated by reference)
 *
 * @module util/apply-mixin
 * @param obj   The object (usually a prototype) to augment
 * @param key   The property to which the mixin method should be assigned
 * @param mixin The mixin method
 */
const applyMixin = ( obj: Record<string, unknown>, key: string, mixin: unknown ): void => {
	// Will not overwrite existing methods
	if ( typeof mixin === 'function' && ! obj[ key ] ) {
		obj[ key ] = mixin;
	}
};

export = applyMixin;
