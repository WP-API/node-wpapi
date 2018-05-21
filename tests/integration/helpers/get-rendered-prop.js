'use strict';

/**
 * This method is a super-pluck capable of grabbing the rendered version of
 * a nested property on a WP API response object. Inspecting a collection of
 * human-readable properties is usually a more comprehensible way to validate
 * that the right results were returned than using IDs or arbitrary values.
 *
 * @example <caption>Pluck the rendered titles from the post</caption>
 *
 *     const titles = getRenderedProp( collection, 'title' );
 *
 * @example <caption>Create a bound variant that always plucks titles</caption>
 *
 *     const getTitles = getRenderedProp.bind( null, 'title' );
 *     const titles = getTitles( collection );
 *
 * @private
 * @param {String}   property   The name of the rendered property to pluck
 * @param {Object[]} collection An array of response objects whence to pluck
 * @returns {String[]} The collection of values for the rendered variants of
 * the specified response object property
 */
module.exports = ( property, collection ) => collection
	.map( ( item ) => item[ property ].rendered );
