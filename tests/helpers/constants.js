'use strict';

// The integration suite runs against the local wp-env instance by default
// (see .wp-env.json). Override WPAPI_HOST to target another environment.
const host = process.env.WPAPI_HOST || 'http://localhost:2747';

module.exports = {
	host,
	endpoint: host + '/wp-json',
	credentials: {
		username: 'admin',
		password: 'password',
	},
};
