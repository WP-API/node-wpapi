# `wpapi/fetch`

This endpoint returns a version of the WPAPI library configured to use Fetch for HTTP requests.

## Installation & Usage

### Install
Install both `wpapi` and `isomorphic-unfetch`.

Using npm: 
```bash
npm install --save wpapi isomorphic-unfetch
```

Or Yarn: 
```bash
yarn add wpapi isomorphic-unfetch
```

### Usage
```js
import WPAPI from 'wpapi/fetch';

// Configure and use WPAPI as normal
const site = new WPAPI( { /* ... */ } );
```
