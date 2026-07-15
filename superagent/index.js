'use strict';

// The superagent transport was removed in wpapi 2.0.0. This subpath remains only
// to give upgrading consumers a clear error instead of a module-resolution failure.
throw new Error(
	'wpapi/superagent was removed in wpapi 2.0.0: the library now uses the native fetch API ' +
	'in all environments, so the default export no longer needs a separate transport. ' +
	'Replace require( \'wpapi/superagent\' ) or import statements referencing it with ' +
	'require( \'wpapi\' ) / import WPAPI from \'wpapi\'. To customize request behavior, ' +
	'provide a custom HTTP transport: ' +
	'https://github.com/wp-api/node-wpapi#customizing-http-request-behavior',
);
