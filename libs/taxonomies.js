var wpQuery = require( './wpQuery' );
var util = require( 'util' );

module.exports = taxonomies;
util.inherits( taxonomies, wpQuery );

function taxonomies() {
	this._id = id;
}

taxonomies.prototype.me = function() {
	return this;
};