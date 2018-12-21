# `wpapi/superagent`

This endpoint returns a version of the WPAPI library configured to use Superagent for HTTP requests.

## Installation & Usage

Install both `wpapi` and `superagent` using the command `npm install --save wpapi superagent`.

```js
import WPAPI from 'wpapi/superagent';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```
