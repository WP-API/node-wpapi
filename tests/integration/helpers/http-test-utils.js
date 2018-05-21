'use strict';
const chai = require( 'chai' );
const expect = chai.expect;
const fs = require( 'fs' );
const http = require( 'http' );

const expectStatusCode = ( url, code ) => new Promise( ( resolve, reject ) => {
	const checkCode = ( actual, expected ) => {
		if ( actual === expected ) {
			return resolve( actual );
		}
		reject( 'Expected ' + expected + ' but received ' + actual + ' for ' + url );
	};

	http
		.get( url, ( res ) => checkCode( res.statusCode, code ) )
		.on( 'error', ( error ) => {
			if ( error.statusCode ) {
				return checkCode( error.statusCode, error );
			}
			return reject( error );
		});
});

const expectFileEqualsURL = ( filePath, url ) => new Promise( ( resolve, reject ) => {
	http.get( url, ( res ) => {
		const data = [];
		res.on( 'data', ( chunk ) => data.push( chunk ) ); // Append Buffer object

		res.on( 'error', ( error ) => reject( error ) );

		res.on( 'end', () => {
			const downloadedImageBuffer = Buffer.concat( data );
			const originalFile = fs.readFileSync( filePath );

			const buffersEqual = downloadedImageBuffer.equals( originalFile );
			expect( buffersEqual ).to.equal( true );

			if ( buffersEqual ) {
				return resolve( true );
			}
			reject( new Error( 'Downloaded file did not match original' ) );
		});
	});
});

const rethrowIfChaiError = ( error ) => {
	if ( error instanceof chai.AssertionError ) {
		throw error;
	}
};

module.exports = {
	expectStatusCode: expectStatusCode,
	expectFileEqualsURL: expectFileEqualsURL,
	rethrowIfChaiError: rethrowIfChaiError
};
