/**
 * @module util/split-path
 */
'use strict';

const namedGroupPattern = require( './named-group-regexp' ).pattern;

// Convert capture groups to non-matching groups, because all capture groups
// are included in the resulting array when an RE is passed to `.split()`
// (We re-use the existing named group's capture pattern instead of creating
// a new RegExp just for this purpose)
const patternWithoutSubgroups = namedGroupPattern
	.replace( /([^\\])\(([^?])/g, '$1(?:$2' );

// Make a new RegExp using the same pattern as one single unified capture group,
// so the match as a whole will be preserved after `.split()`. Permit non-slash
// characters before or after the named capture group, although those components
// will not yield functioning setters.
const namedGroupRE = new RegExp( '([^/]*' + patternWithoutSubgroups + '[^/]*)' );

/**
 * Divide a route string up into hierarchical components by breaking it apart
 * on forward slash characters.
 *
 * There are plugins (including Jetpack) that register routes with regex capture
 * groups which also contain forward slashes, so those groups have to be pulled
 * out first before the remainder of the string can be .split() as normal.
 *
 * @param {String} pathStr A route path string to break into components
 * @returns {String[]} An array of route component strings
 */
module.exports = pathStr => pathStr
	// Divide a string like "/some/path/(?P<with_named_groups>)/etc" into an
	// array `[ "/some/path/", "(?P<with_named_groups>)", "/etc" ]`.
	.split( namedGroupRE )
	// Then, reduce through the array of parts, splitting any non-capture-group
	// parts on forward slashes and discarding empty strings to create the final
	// array of path components.
	.reduce( ( components, part ) => {
		if ( ! part ) {
			// Ignore empty strings parts
			return components;
		}

		if ( namedGroupRE.test( part ) ) {
			// Include named capture groups as-is
			return components.concat( part );
		}

		// Split the part on / and filter out empty strings
		return components.concat( part.split( '/' ).filter( Boolean ) );
	}, [] );
