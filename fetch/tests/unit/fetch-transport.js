'use strict';

const { writeFile, mkdtemp, rm } = require( 'node:fs/promises' );
const { tmpdir } = require( 'node:os' );
const path = require( 'node:path' );

const transport = require( '../../fetch-transport' );

// Minimal stand-in for a WPRequest object: the transport only consumes
// .toString(), ._options, ._attachment, ._attachmentName and .transport.
const mockWPReq = ( options = {}, props = {} ) => ( {
	toString: () => 'http://some.url.com/wp-json/wp/v2/posts',
	_options: options,
	...props,
} );

const jsonResponse = ( body, init = {} ) => new Response( JSON.stringify( body ), init );

describe( 'fetch-transport', () => {

	let fetchMock;

	beforeEach( () => {
		fetchMock = vi.fn( () => Promise.resolve( jsonResponse( {} ) ) );
		vi.stubGlobal( 'fetch', fetchMock );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	// The config object passed to the (mocked) global fetch by the last call
	const lastFetchConfig = () => fetchMock.mock.calls[ fetchMock.mock.calls.length - 1 ][ 1 ];

	describe( '.get()', () => {

		it( 'performs a GET request via the global fetch', async () => {
			const body = { id: 7 };
			fetchMock.mockResolvedValue( jsonResponse( body ) );
			const result = await transport.get( mockWPReq() );
			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
			expect( fetchMock ).toHaveBeenCalledWith(
				'http://some.url.com/wp-json/wp/v2/posts',
				expect.objectContaining( { method: 'GET' } ),
			);
			expect( result ).toEqual( body );
		} );

		it( 'augments paged collections with pagination metadata', async () => {
			fetchMock.mockResolvedValue( jsonResponse( [ { id: 7 } ], {
				headers: {
					'X-WP-Total': '7',
					'X-WP-TotalPages': '2',
				},
			} ) );
			const result = await transport.get( mockWPReq() );
			expect( result._paging ).toEqual( expect.objectContaining( {
				total: 7,
				totalPages: 2,
			} ) );
		} );

		it( 'sets a basic auth header when auth is forced on the request', async () => {
			await transport.get( mockWPReq( {
				auth: true,
				username: 'user',
				password: 'pass',
			} ) );
			expect( lastFetchConfig().headers.Authorization )
				.toBe( `Basic ${ Buffer.from( 'user:pass' ).toString( 'base64' ) }` );
		} );

		it( 'sets a nonce header and same-origin credentials when a nonce is provided', async () => {
			await transport.get( mockWPReq( { nonce: 'n0nc3' } ) );
			expect( lastFetchConfig().credentials ).toBe( 'same-origin' );
			expect( lastFetchConfig().headers[ 'X-WP-Nonce' ] ).toBe( 'n0nc3' );
		} );

		it( 'passes through any custom headers set on the request', async () => {
			await transport.get( mockWPReq( {
				headers: { 'X-Custom': 'header-value' },
			} ) );
			expect( lastFetchConfig().headers[ 'X-Custom' ] ).toBe( 'header-value' );
		} );

		it( 'rejects with the API-provided error object on HTTP error responses', () => {
			const apiError = {
				code: 'rest_no_route',
				message: 'No route was found matching the URL and request method',
			};
			fetchMock.mockResolvedValue( jsonResponse( apiError, { status: 404 } ) );
			return expect( transport.get( mockWPReq() ) ).rejects.toEqual( apiError );
		} );

	} );

	describe( '.post()', () => {

		it( 'performs a POST request with a JSON body', async () => {
			const data = { title: 'Rain Crow' };
			await transport.post( mockWPReq(), data );
			const config = lastFetchConfig();
			expect( config.method ).toBe( 'POST' );
			expect( config.headers[ 'Content-Type' ] ).toBe( 'application/json' );
			expect( config.body ).toBe( JSON.stringify( data ) );
		} );

		describe( 'file uploads', () => {

			let tmpDir;
			let filePath;

			beforeAll( async () => {
				tmpDir = await mkdtemp( path.join( tmpdir(), 'wpapi-test-' ) );
				filePath = path.join( tmpDir, 'from-disk.txt' );
				await writeFile( filePath, 'file on disk' );
			} );

			afterAll( () => rm( tmpDir, {
				recursive: true,
				force: true,
			} ) );

			it( 'sends a Blob attachment as native FormData without a manual content-type', async () => {
				const attachment = new Blob( [ 'blob content' ], { type: 'text/plain' } );
				await transport.post( mockWPReq( {}, {
					_attachment: attachment,
					_attachmentName: 'named-blob.txt',
				} ) );
				const config = lastFetchConfig();
				expect( config.body ).toBeInstanceOf( FormData );
				expect( config.headers && config.headers[ 'Content-Type' ] ).toBeFalsy();
				const file = config.body.get( 'file' );
				expect( file.name ).toBe( 'named-blob.txt' );
				expect( await file.text() ).toBe( 'blob content' );
			} );

			it( 'preserves the name of a File attachment when no name is specified', async () => {
				const attachment = new File( [ 'file content' ], 'named-file.txt' );
				await transport.post( mockWPReq( {}, { _attachment: attachment } ) );
				const file = lastFetchConfig().body.get( 'file' );
				expect( file.name ).toBe( 'named-file.txt' );
				expect( await file.text() ).toBe( 'file content' );
			} );

			it( 'sends a Buffer attachment under the specified name', async () => {
				await transport.post( mockWPReq( {}, {
					_attachment: Buffer.from( 'buffer content' ),
					_attachmentName: 'from-buffer.txt',
				} ) );
				const file = lastFetchConfig().body.get( 'file' );
				expect( file.name ).toBe( 'from-buffer.txt' );
				expect( await file.text() ).toBe( 'buffer content' );
			} );

			it( 'reads a string-path attachment from disk', async () => {
				await transport.post( mockWPReq( {}, { _attachment: filePath } ) );
				const file = lastFetchConfig().body.get( 'file' );
				expect( file.name ).toBe( 'from-disk.txt' );
				expect( await file.text() ).toBe( 'file on disk' );
			} );

			it( 'uses the specified name over the on-disk name of a string-path attachment', async () => {
				await transport.post( mockWPReq( {}, {
					_attachment: filePath,
					_attachmentName: 'renamed.txt',
				} ) );
				expect( lastFetchConfig().body.get( 'file' ).name ).toBe( 'renamed.txt' );
			} );

			it( 'appends additional data values as form fields', async () => {
				await transport.post(
					mockWPReq( {}, { _attachment: new Blob( [ 'blob content' ] ) } ),
					{ title: 'Attachment Title' },
				);
				expect( lastFetchConfig().body.get( 'title' ) ).toBe( 'Attachment Title' );
			} );

		} );

	} );

	describe( '.put()', () => {

		it( 'performs a PUT request with a JSON body', async () => {
			const data = { title: 'Updated' };
			await transport.put( mockWPReq(), data );
			const config = lastFetchConfig();
			expect( config.method ).toBe( 'PUT' );
			expect( config.headers[ 'Content-Type' ] ).toBe( 'application/json' );
			expect( config.body ).toBe( JSON.stringify( data ) );
		} );

	} );

	describe( '.delete()', () => {

		it( 'performs a DELETE request with a JSON body when data is provided', async () => {
			const data = { force: true };
			await transport.delete( mockWPReq(), data );
			const config = lastFetchConfig();
			expect( config.method ).toBe( 'DELETE' );
			expect( config.body ).toBe( JSON.stringify( data ) );
		} );

		it( 'performs a DELETE request without a body when no data is provided', async () => {
			await transport.delete( mockWPReq() );
			const config = lastFetchConfig();
			expect( config.method ).toBe( 'DELETE' );
			expect( config.body ).toBeUndefined();
		} );

	} );

	describe( '.head()', () => {

		it( 'performs a HEAD request and resolves to the response headers', async () => {
			fetchMock.mockResolvedValue( new Response( null, {
				headers: { 'X-WP-Total': '7' },
			} ) );
			const result = await transport.head( mockWPReq() );
			expect( lastFetchConfig().method ).toBe( 'HEAD' );
			expect( result ).toEqual( expect.objectContaining( { 'x-wp-total': '7' } ) );
		} );

		it( 'authenticates whenever credentials are present, even if auth is not forced', async () => {
			await transport.head( mockWPReq( {
				username: 'user',
				password: 'pass',
			} ) );
			expect( lastFetchConfig().headers.Authorization )
				.toBe( `Basic ${ Buffer.from( 'user:pass' ).toString( 'base64' ) }` );
		} );

	} );

} );
