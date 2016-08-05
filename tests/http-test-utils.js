'use strict';
/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'es6-promise' ).Promise;

var chai = require( 'chai' );
var expect = chai.expect;
var fs = require( 'fs' );
var http = require( 'http' );

function expectStatusCode( url, code ) {
	return new Promise(function( resolve, reject ) {
		function checkCode( actual, expected ) {
			if ( actual === expected ) {
				return resolve( actual );
			}
			reject( 'Expected ' + expected + ' but received ' + actual + ' for ' + url );
		}

		http.get( url, function( res ) {
			checkCode( res.statusCode, code );
		}).on( 'error', function( error ) {
			if ( error.statusCode ) {
				return checkCode( error.statusCode, error );
			}
			reject( error );
		});
	});
}

function expectFileEqualsURL( filePath, url ) {
	return new Promise(function( resolve, reject ) {
		http.get( url, function( res ) {
			var data = [];
			res.on( 'data', function( chunk ) {
				data.push( chunk ); // Append Buffer object
			});
			res.on( 'error', function( error ) {
				reject( error );
			});
			res.on( 'end', function() {
				var downloadedImageBuffer = Buffer.concat( data );
				var originalFile = fs.readFileSync( filePath );

				var buffersEqual = downloadedImageBuffer.equals( originalFile );
				expect( buffersEqual ).to.equal( true );

				if ( buffersEqual ) {
					return resolve( true );
				}
				reject( new Error( 'Downloaded file did not match original' ) );
			});
		});
	});
}

function rethrowIfChaiError( error ) {
	if ( error instanceof chai.AssertionError ) {
		throw error;
	}
}

module.exports = {
	expectStatusCode: expectStatusCode,
	expectFileEqualsURL: expectFileEqualsURL,
	rethrowIfChaiError: rethrowIfChaiError
};
