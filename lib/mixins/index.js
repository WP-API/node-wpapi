/**
 * This module defines a mapping between supported GET request query parameter
 * arguments and their corresponding mixin, if available.
 */
'use strict';

var filterMixins = require( './filters' );
var parameterMixins = require( './parameters' );

// `.context`, `.embed`, and `.edit` (a shortcut for `context(edit, true)`) are
// supported by default in WPRequest, as is the base `.param` method. Any GET
// argument parameters not covered here must be set directly by using `.param`.
module.exports = {
	after: { after: parameterMixins.after },
	author: { author: parameterMixins.author },
	before: { before: parameterMixins.before },
	categories: {
		categories: parameterMixins.categories,
		/** @deprecated use .categories() */
		category: parameterMixins.category
	},
	categories_exclude: {
		excludeCategories: parameterMixins.excludeCategories
	},
	tags: {
		tags: parameterMixins.tags,
		/** @deprecated use .tags() */
		tag: parameterMixins.tag
	},
	tags_exclude: {
		excludeTags: parameterMixins.excludeTags
	},
	filter: filterMixins,
	parent: { parent: parameterMixins.parent },
	post: {
		post: parameterMixins.post,
		/** @deprecated use .post() */
		forPost: parameterMixins.post
	}
};
