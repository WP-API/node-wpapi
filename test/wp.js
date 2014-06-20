const expect = require( 'chai' ).expect;

const WP = require( '../' );

describe( 'wp', function() {

	describe( 'constructor', function() {

		it( 'enforces new', function() {
			var wp1 = new WP({ endpoint: '/' });
			expect( wp1 instanceof WP ).to.be.true;
			var wp2 = WP({ endpoint: '/' });
			expect( wp2 instanceof WP ).to.be.true;
		});

		it( 'throws an error if no endpoint is provided', function() {
			expect(function() {
				new WP({ endpoint: '/' });
			}).not.to.throw();
			expect(function() {
				new WP();
			}).to.throw();
		});

		it( 'sets options on an instance variable', function() {
			var wp = new WP({
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky'
			});
			expect( wp._options.endpoint ).to.equal( 'http://some.url.com/wp-json' );
			expect( wp._options.username ).to.equal( 'fyodor' );
			expect( wp._options.password ).to.equal( 'dostoyevsky' );
		});

	});

});
