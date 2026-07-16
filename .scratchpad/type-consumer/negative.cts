import WPAPI = require( '../../dist/index.cjs' );
const wp = new WPAPI( { endpoint: 'http://example.com/wp-json' } );
// Each line below should be a type error:
wp.url( 'x' ).nonexistentMethod();
const n: number = wp.url( 'x' ).toString();
wp.url( 'x' ).auth( { username: 42 } );
wp.posts().nonexistentMethod();
wp.posts().sticky( 'yes' );
