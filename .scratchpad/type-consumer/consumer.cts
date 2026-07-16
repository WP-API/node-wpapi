// Strict-mode consumer exercising the shipped CJS declarations (require path).
import WPAPI = require( '../../dist/index.cjs' );

const wp = new WPAPI( { endpoint: 'http://example.com/wp-json' } );
const viaSite = WPAPI.site( 'http://example.com/wp-json' );
const req = wp.posts().perPage( 5 ).page( 2 );
const url: string = req.toString();
const chained = wp.url( 'http://x/' ).auth( { username: 'u', password: 'p' } );
async function run(): Promise<void> {
	const posts = await wp.posts();
	console.log( posts, url, viaSite, chained );
	const discovered = await WPAPI.discover( 'http://example.com' );
	console.log( discovered.pages() );
}
run();

// The wpapi/fetch alias must expose the same constructable type.
import WPAPIFetch = require( '../../dist/fetch.cjs' );
const wpF = new WPAPIFetch( { endpoint: 'http://example.com/wp-json' } );
console.log( wpF.media().toString() );

// Generated default-route handler typings (Phase 4): mixins and path-part
// setters chain with WPRequest methods, and namespace() is overloaded for
// the default namespaces.
const typedChain: string = wp.posts()
	.categories( [ 1, 2 ] )
	.sticky( true )
	.id( 7 )
	.toString();
console.log( typedChain, wp.pages().parent( 3 ).revisions( 12 ) );
console.log( wp.namespace( 'wp/v2' ).users().me() );
console.log( wp.namespace( 'oembed/1.0' ).proxy().param( 'url', 'http://x' ) );
// Handlers registered from custom route data still pass the index signature.
console.log( wp.namespace( 'someplugin/v1' ).customResource() );
