// Strict-mode consumer exercising the shipped ESM declarations (import path).
import WPAPI from '../../dist/index.mjs';

const wp = new WPAPI( { endpoint: 'http://example.com/wp-json' } );
const req = wp.posts().perPage( 5 );
const url: string = req.toString();
async function run(): Promise<void> {
	const posts = await wp.posts();
	console.log( posts, url );
}
run();
