'use strict';

/**
 * This is a curry-able pluck function, that is all. Inspecting a collection of
 * human-readable strings is usually a more comprehensible way to validate the
 * right results were returned than using arbitrary values.
 *
 * @example <caption>Pluck the slugs titles from a collection of terms</caption>
 *
 *     var slugs = getProp( collection, 'slug' );
 *
 * @example <caption>Create a bound variant that always plucks .name</caption>
 *
 *     var getNames = getProp.bind( null, 'name' );
 *     var names = getNames( collection );
 *
 * @private
 * @param {String}   property   The name of the property to pluck
 * @param {Object[]} collection An array of response objects whence to pluck
 * @returns {String[]} The values of that property from each collection member
 */
module.exports = function( property, collection ) {
	return collection.map(function( item ) {
		return item[ property ];
	});
};
