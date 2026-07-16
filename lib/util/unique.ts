/**
 * Return an array with all duplicate items removed.
 *
 * This functionality was previously provided by lodash.uniq, but this
 * modern JS solution yields a smaller bundle size.
 *
 * @param arr An array to de-duplicate
 * @returns A de-duplicated array
 */
const unique = <T>( arr: T[] ): T[] => Array.from( new Set( arr ) );

export = unique;
