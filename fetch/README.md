# `wpapi/fetch`

This endpoint returns a version of the WPAPI library configured to use the native `fetch`
API for HTTP requests. As of wpapi 2.0.0 this is the same thing the default `wpapi` export
provides; the subpath remains as an alias for code written against the v2 alphas.

## Installation & Usage

Install `wpapi` using the command `npm install --save wpapi`. No separate fetch
implementation is needed — the library uses the `fetch` global built into Node.js
(v24+), browsers and other modern JavaScript runtimes.

```js
import WPAPI from 'wpapi/fetch';
// equivalent to
import WPAPI from 'wpapi';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```
