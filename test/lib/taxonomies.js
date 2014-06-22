const expect = require( 'chai' ).expect;

const TaxonomiesQuery = require( '../../lib/taxonomies' );

describe( 'wp.taxonomies', function() {

	var taxonomies;

	beforeEach(function() {
		taxonomies = new TaxonomiesQuery();
		taxonomies._options = {
			endpoint: '/wp-json'
		};
	});

	it( 'should create the URL for retrieving all taxonomies', function() {
		var url = taxonomies.generateRequestUri();
		expect( url ).to.equal( '/wp-json/taxonomies' );
	});

	it( 'should create the URL for retrieving a specific taxonomy', function() {
		var url = taxonomies.id( 'my-tax' ).generateRequestUri();
		expect( url ).to.equal( '/wp-json/taxonomies/my-tax' );
	});

	it( 'should create the URL for retrieving all terms for a specific taxonomy', function() {
		var url = taxonomies.id( 'my-tax' ).terms().generateRequestUri();
		expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms' );
	});

	it( 'should create the URL for retrieving a specific taxonomy term', function() {
		var url = taxonomies.id( 'my-tax' ).terms().id( 1337 ).generateRequestUri();
		expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms/1337' );
	});

});
