'use strict';

/**
 * Request constructor mixin to specify a resource ID to query
 *
 * @mixin
 * @chainable
 * @param {Number} id The (numeric) ID of a resource to retrieve
 * @return The request instance (for chaining)
 */
module.exports = function( id ) {
	/* jshint validthis:true */
	this._path.id = parseInt( id, 10 );
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	return this;
};
