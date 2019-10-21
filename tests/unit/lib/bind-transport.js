'use strict';

const bindTransport = require( '../../../lib/bind-transport' );

describe( 'bindTransport()', () => {
	it( 'is a function', () => {
		expect( bindTransport ).toBeInstanceOf( Function );
	} );
} );

describe( 'Transport-bound WPAPI constructor', () => {
	let transport;
	let WPAPI;

	beforeEach( () => {
		transport = {
			get: jest.fn(),
		};
		WPAPI = bindTransport( require( '../../../wpapi' ), transport );
	} );

	it( 'has a .site() static method', () => {
		expect( WPAPI ).toHaveProperty( 'site' );
		expect( typeof WPAPI.site ).toBe( 'function' );
	} );

	it( 'returns instances of the expected constructor from WPAPI.site', () => {
		const site = WPAPI.site( 'endpoint/url' );
		expect( site instanceof WPAPI ).toBe( true );
		expect( site._options.endpoint ).toBe( 'endpoint/url/' );
		expect( site._options.transport ).toBeDefined();
		expect( site._options.transport.get ).toBe( transport.get );
	} );

} );
