/**
 * Convert a (key, value) pair to a { key: value } object
 *
 * @module util/key-val-to-obj
 * @param key   The key to use in the returned object
 * @param value The value to assign to the provided key
 * @returns A dictionary object containing the key-value pair
 */
const keyValToObj = <T>( key: string, value: T ): Record<string, T> => {
	const obj: Record<string, T> = {};
	obj[ key ] = value;
	return obj;
};

export = keyValToObj;
