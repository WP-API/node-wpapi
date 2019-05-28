# `wpapi/fetch`

This endpoint returns a version of the WPAPI library configured to use Fetch for HTTP requests.

## Installation & Usage

Install both `wpapi` and `isomorphic-unfetch` using the command `npm install --save wpapi isomorphic-unfetch`.

```js
import WPAPI from 'wpapi/fetch';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```
