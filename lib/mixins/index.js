/**
 * This module defines a mapping between supported GET request query parameter
 * arguments and their corresponding mixin, if available.
 */
'use strict';

const filterMixins = require( './filters' );
const parameterMixins = require( './parameters' );

// `.context`, `.embed`, and `.edit` (a shortcut for `context(edit, true)`) are
// supported by default in WPRequest, as is the base `.param` method. Any GET
// argument parameters not covered here must be set directly by using `.param`.

// The initial mixins we define are the ones where either a single property
// accepted by the API endpoint corresponds to multiple individual mixin
// functions, or where the name we use for the function diverges from that
// of the query parameter that the mixin sets.
const mixins = {
	categories: {
		categories: parameterMixins.categories,
		/** @deprecated use .categories() */
		category: parameterMixins.category,
	},
	categories_exclude: {
		excludeCategories: parameterMixins.excludeCategories,
	},
	tags: {
		tags: parameterMixins.tags,
		/** @deprecated use .tags() */
		tag: parameterMixins.tag,
	},
	tags_exclude: {
		excludeTags: parameterMixins.excludeTags,
	},
	filter: filterMixins,
	post: {
		post: parameterMixins.post,
		/** @deprecated use .post() */
		forPost: parameterMixins.post,
	},
};

// All of these parameter mixins use a setter function named identically to the
// property that the function sets, but they must still be provided in wrapper
// objects so that the mixin can be `.assign`ed correctly: wrap & assign each
// setter to the mixins dictionary object.
[
	'after',
	'author',
	'before',
	'parent',
	'password',
	'status',
	'sticky',
].forEach( ( mixinName ) => {
	mixins[ mixinName ] = {};
	mixins[ mixinName ][ mixinName ] = parameterMixins[ mixinName ];
} );

module.exports = mixins;
