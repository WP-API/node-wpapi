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
