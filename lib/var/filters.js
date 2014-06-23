var url = require( 'url' );
var _ = require( 'lodash' );

function render( query ) {
	query = _.chain( query )
		.pairs()
		.map(function( queryPair ) {
			queryPair[ 0 ] = 'filter[' + queryPair[ 0 ] + ']';
			return queryPair;
		})
		.zipObject()
		.value();
	var queryStr = url.format({
		query: query
	});
	// url.format encodes characters like [ and ,: decode them
	return decodeURIComponent( queryStr );
}

function categoryAlias( query ) {
	if ( typeof query === 'string' ) {
		this._filters.category_name = query;
	} else {
		this._filters.cat = parseInt( query, 10 );
	}
	return this;
};

function searchAlias( searchStr ) {
	this._filters.s = encodeURIComponent( searchStr );
	return this;
};

function nameAlias( slug ) {
	this._filters.name = slug;
	return this;
};

module.exports = {
	render: render,
	aliases: {
		search: searchAlias,
		category: categoryAlias,
		name: nameAlias,
		slug: nameAlias
	}
}

// TODO for Office Hours tonight
