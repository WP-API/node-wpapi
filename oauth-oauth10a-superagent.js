'use strict';
var superagent = require( 'superagent' );
var qs = require( 'qs' );
var opn = require( 'opn' );
var crypto = require('crypto');
var prompt = require( 'prompt' );

var OAuth = require( 'oauth-1.0a' );
var oauth = new OAuth({
	consumer: {
		key: 'N5RWWNyWYSDK',
		secret: 'uWWy9r3OLsJO94HsRayTmgStsE0HUdaytmvq6hjr57qkgAlG'
	},
	signature_method: 'HMAC-SHA1',
	hash_function: (base_string, key) => crypto
		.createHmac('sha1', key)
		.update(base_string)
		.digest('base64')
});

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
		data
		// data: stringifyData( data )
	}, token );

	return Object.assign( oauth.toHeader( authorizedData ), {
		// Accept: 'application/json',
		// 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	});
}

function post( url, data, token ) {
	const headers = getHeaders( url, data, token );

	return new Promise((resolve, reject) => {
		superagent.post( url )
			.set( headers )
			.send( data )
			.end((err, res) => {
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

// let creds = null;
let creds = {
	key: 'GnbkxntFuYKNrQfz8TiVwglm',
	secret: '6o8n0Edj8dJrcneUTR0OPK5MWyfVcQZwXGEkB1Tcdc4jhWxY'
};

const WPAPI = require( './' );
let endpoints = null;
let site = WPAPI.site('http://wpapi.loc/wp-json');

const getToken = creds ? Promise.resolve(creds) : WPAPI.discover( 'http://wpapi.loc' )
	.then(result => {
		site = result;
		return site.root();
	})
	.then(root => {
		endpoints = root.authentication.oauth1;
		return post( endpoints.request, {
			oauth_callback: 'oob'
		});
	})
	.then(function( config ) {
		const authorizeUrl = `${endpoints.authorize}?oauth_token=${config.oauth_token}&oauth_callback=oob`;
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
	.then((tempCreds) => {
		// console.log(tempCreds);
		const token = {
			key: tempCreds.token,
			secret: tempCreds.secret
		};
		return post( endpoints.access, {
			oauth_verifier: tempCreds.verification
		}, token);
	})
	.then(token => {
		console.log( token );
		creds = {
			key: token.oauth_token,
			secret: token.oauth_token_secret
		};
		return creds;
	});

getToken
	.then(token => {
		return post( site.posts().toString(), {
			title: 'IT IS ALIIIIVE!',
			content: 'Hahahaaa suckers'
		}, token);
	})
	// // .then(function( config ) {
	// // 	console.log( config );
	// // 	return getAccessToken( config );
	// // })
	.then( result => console.log( result ) )
	.then(() => process.exit(0))
	.catch( err => {
		if ( err.response && err.response.text ) {
			console.log(err.response.text);
		} else {
			console.error( err );
		}
	});
