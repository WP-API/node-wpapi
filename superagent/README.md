# `wpapi/superagent`

**Removed in wpapi 2.0.0.** The library now uses the native `fetch` API in all
environments, so the default export no longer needs a separate transport:

```js
import WPAPI from 'wpapi';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```

Requiring `wpapi/superagent` throws an error pointing to this migration path. If you
relied on superagent-specific behavior (retries, proxies, instrumentation), pass a
[custom HTTP transport](https://github.com/wp-api/node-wpapi#customizing-http-request-behavior)
instead.
