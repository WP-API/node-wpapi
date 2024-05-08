/**
 * @module util/split-path
 */
'use strict';

const namedGroupRE = require( './named-group-regexp' ).namedGroupRE;

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
module.exports = pathStr => {
	let parts = [pathStr];
	// Find the named group.
	const namedGroupMatch = pathStr.match(namedGroupRE);
	if (namedGroupMatch) {
		const namedGroup = namedGroupMatch[0];
		// Split the string into the parts surrounding the named group.
		parts = pathStr.split(namedGroup);
		// Add the named group into the array.
		parts.splice(1, 0, namedGroup);
	}
	// This divides a string like "/some/path/(?P<with_named_groups>)/etc" into an
	// array `[ "/some/path/", "(?P<with_named_groups>)", "/etc" ]`.

	// Then, reduce through the array of parts, splitting any non-capture-group
	// parts on forward slashes and discarding empty strings to create the final
	// array of path components.
	return parts.reduce( ( components, part ) => {
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
}
