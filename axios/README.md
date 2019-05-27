# `wpapi/superagent`

This endpoint returns a version of the WPAPI library configured to use Axios for HTTP requests.

## Installation & Usage

Install both `wpapi` and `axios` using the command `npm install --save wpapi axios`.

```js
import WPAPI from 'wpapi/axios';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```
