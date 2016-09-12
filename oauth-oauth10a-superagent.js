'use strict';
var superagent = require( 'superagent' );
var qs = require( 'qs' );
var opn = require( 'opn' );
var prompt = require( 'prompt' );

var OAuth = require( 'oauth-1.0a' );
var oauth = new OAuth({
	consumer: {
		public: 'cReJQ7zmzzAP',
		secret: '1DafMQV4Mx4kGin5G78RWl5H5s4PdiyoIRLutoiFDnwjT6Po'
	},
	signature_method: 'HMAC-SHA1'
});

// KAW.com
// var oauth = new OAuth({
// 	consumer: {
// 		public: 'zJz6elMQsj5D',
// 		secret: 'KOFt1fslLCvln0mavKthZgXpvDdm0NWYgUT5oAET2ehpbV8e'
// 	},
// 	signature_method: 'HMAC-SHA1'
// })

function stringifyData( data ) {
	return Object.keys( data ).reduce( ( memo, key ) => {
		const value = data[ key ];
		if ( Array.isArray( value ) ) {
			value.forEach( ( val, index ) => memo[ `${key}[${index}]` ] = val );
		} else {
			memo[ key ] = value;
		}
		return memo;
	}, {} );
}

function getHeaders( url, data, token ) {
	token = token || null;
	var authorizedData = oauth.authorize( {
		method: 'POST',
		url: url,
		data: stringifyData( data )
	}, token );

	return Object.assign( oauth.toHeader( authorizedData ), {
		// Accept: 'application/json',
		// 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	});
}

function getRequestToken( url, data ) {
	const headers = getHeaders( url, data );

	return new Promise(function( resolve, reject ) {
		superagent.post( url )
			.set( headers )
			.send( data )
			.end(function( err, res ) {
				if ( err ) {
					return reject( err );
				}
				resolve( res.body );
			});
	});
}

// function getAccessToken( url, data, config ) {

// 	const headers =
// 	return new Promise( ( resolve, reject ) => {
// 		oauth.getOAuthAccessToken( config.token, config.secret, config.verifier, function( err, token, secret, results ) {
// 			if ( err ) {
// 				return reject( err );
// 			}
// 			resolve({
// 				token: token,
// 				secret: secret
// 			});
// 		});
// 	});
// }

getRequestToken( 'http://wpapi.loc/oauth1/request', {
// getRequestToken( 'http://www.kadamwhite.com/oauth1/request', {
	oauth_callback: 'oob'
})
	.then(function( config ) {
		const authorizeUrl = `http://wpapi.loc/oauth1/authorize?oauth_token=${config.oauth_token}&oauth_callback=oob`;
		opn(authorizeUrl);
		return new Promise(function( resolve, reject ) {
			prompt.get([
				'verification'
			], function( err, result ) {
				if ( err ) {
					return reject( err );
				}
				resolve({
					token: config.oauth_token,
					secret: config.oauth_token_secret,
					verification: result.verification
				});
			});
		});
	})
	// .then(function( config ) {
	// 	console.log( config );
	// 	return getAccessToken( config );
	// })
	.then( result => console.log( result ) )
	.catch( err => console.error( err ) );
