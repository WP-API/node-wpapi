'use strict';
var fetch = require( 'isomorphic-fetch' );
var qs = require( 'qs' );

var OAuth = require( 'oauth-1.0a' );
var oauth = new OAuth({
	consumer: {
		public: 'OL5EIwSTQyPr',
		secret: 'YDBGBezQPDd51DwDIDhBfrYeSOUJqCQwcHwRnVYebGAmFtU1'
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

function getRequestToken( url, data ) {

	var oauthData = data;

	var oauthData = null

	if ( data ) {
		oauthData = Object.keys( data ).reduce( ( memo, key ) => {
			const value = data[ key ];
			if ( Array.isArray( value ) ) {
				value.forEach( ( val, index ) => memo[ `${key}[${index}]` ] = val );
			} else {
				memo[ key ] = value;
			}
			return memo;
		}, {} );
	}

	var authorizedData = oauth.authorize( {
		method: 'POST',
		url: url,
		data: oauthData
	}, null ); // Token is still null at this point

	const headers = Object.assign( oauth.toHeader( authorizedData ), {
		Accept: 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	});

	console.log( headers );

	return fetch( url, {
		method: 'POST',
		headers: headers,
		// mode: 'cors',
		body: qs.stringify( data )
	}).then( response => {
		const contentType = response.headers.get( 'Content-Type' );
		if ( contentType && contentType.indexOf( 'x-www-form-urlencoded' ) > -1 ) {
			return response.text().then( text => {
				return qs.parse( text )
			})
		}
		return response.text().then( text => {
			try {
				var json = JSON.parse( text )
			} catch( e ) {
				throw { message: text, code: response.status }
			}

			if ( response.status >= 300) {
				throw json
			} else {
				return json
			}
		})
	});
}

getRequestToken( 'http://wpapi.loc/oauth1/request', {
// getRequestToken( 'http://www.kadamwhite.com/oauth1/request', {
	oauth_callback: 'oob'
})
	.then( result => console.log( result ) )
	.catch( err => console.error( err ) );
