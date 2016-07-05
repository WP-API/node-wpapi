'use strict';

module.exports = function( obj, prop, propDefaultValue ) {
	if ( obj && obj[ prop ] === undefined ) {
		obj[ prop ] = propDefaultValue;
	}
};
