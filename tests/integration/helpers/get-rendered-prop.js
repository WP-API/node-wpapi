'use strict';

/**
 * This method is a super-pluck capable of grabbing the rendered version of
 * a nested property on a WP API response object. Inspecting a collection of
 * human-readable properties is usually a more comprehensible way to validate
 * that the right results were returned than using IDs or arbitrary values.
 *
 * @example Pluck the rendered titles from the post
 *
 *     var titles = getRenderedProp( collection, 'title' );
 *
 * @example Create a bound variant that always plucks titles
 *
 *     var getTitles = getRenderedProp.bind( null, 'title' );
 *     var titles = getTitles( collection );
 *
 * @private
 * @param {String}   property   The name of the rendered property to pluck
 * @param {Object[]} collection An array of response objects whence to pluck
 * @returns {String[]} The collection of values for the rendered variants of
 * the specified response object property
 */
module.exports = function( property, collection ) {
	return collection.map(function( item ) {
		return item[ property ].rendered;
	});
};
