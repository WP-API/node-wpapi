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
	author: { author: parameterMixins.author },
	filter: filterMixins,
	page: { page: parameterMixins.page },
	parent: { parent: parameterMixins.parent },
	per_page: { perPage: parameterMixins.perPage },
	post: { forPost: parameterMixins.forPost },
	search: { search: parameterMixins.search },
	slug: { slug: parameterMixins.slug, name: parameterMixins.name }
};
