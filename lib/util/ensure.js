'use strict';

module.exports = function( obj, prop, propDefaultValue ) {
	if ( obj && typeof obj[ prop ] === 'undefined' ) {
		obj[ prop ] = propDefaultValue;
	}
};
