'use strict';

var opn = require( 'opn' );
var prompt = require('prompt');

var OAuth = require( 'oauth' );
var oauth = new OAuth.OAuth(
	// reqURL
	'http://wpapi.loc/oauth1/request',
	// accessURL
	'http://wpapi.loc/oauth1/access',
	// Key
	'cReJQ7zmzzAP',
	// Secret
	'1DafMQV4Mx4kGin5G78RWl5H5s4PdiyoIRLutoiFDnwjT6Po',
	// Version
	'1.0A',
	// authorize_callback (null in example)
	'oob',
	// Signature method
	'HMAC-SHA1'
	// nonceSize
	// customHeaders
);

// console.log( auth );

function getRequestToken() {
	return new Promise( ( resolve, reject ) => {
		oauth.getOAuthRequestToken(function( err, token, secret, results ) {
			if ( err ) {
				return reject( err );
			}
			console.log( results );
			resolve({
				token: token,
				secret: secret
			});
		});
	});
}
function getAccessToken(config) {
	return new Promise( ( resolve, reject ) => {
		oauth.getOAuthAccessToken( config.token, config.secret, config.verifier, function( err, token, secret, results ) {
			if ( err ) {
				return reject( err );
			}
			resolve({
				token: token,
				secret: secret
			});
		});
	});
}

getRequestToken()
	.then(function(config) {
		opn(`http://wpapi.loc/oauth1/authorize?oauth_token=${config.token}&oauth_callback=oob`);
		prompt.start();
		return new Promise( ( resolve, reject ) => {
			prompt.get([
				'verifier'
			], ( err, result ) => {
				if ( err ) {
					return reject( err );
				}
				resolve({
					token: config.token,
					secret: config.secret,
					verifier: result.verifier
				});
			});
		});
	})
	.then(function( config ) {
		console.log( config );
		return getAccessToken( config );
	})
	.then(function( result ) {
		console.log( result );
	})
	.catch( err => console.error( err ) );
