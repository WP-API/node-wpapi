'use strict';

/**
 * Regular Expression to identify a capture group in PCRE formats
 * `(?<name>regex)`, `(?'name'regex)` or `(?P<name>regex)` (see
 * regular-expressions.info/refext.html); RegExp is built as a string
 * to enable more detailed annotation.
 *
 * @type {RegExp}
 */
module.exports = new RegExp([
	// Capture group start
	'\\(\\?',
	// Capture group name begins either `P<`, `<` or `'`
	'(?:P<|<|\')',
	// Everything up to the next `>`` or `'` (depending) will be the capture group name
	'([^>\']+)',
	// Capture group end
	'[>\']',
	// Get everything up to the end of the capture group: this is the RegExp used
	// when matching URLs to this route, which we can use for validation purposes.
	'([^\\)]*)',
	// Capture group end
	'\\)'
].join( '' ) );
