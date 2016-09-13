---
layout: page
title: Installation
permalink: /installation/
---

* TOC
{:toc}

`node-wpapi` works both on the server or in the browser.

### Install with NPM

To use the library from Node, install it with [npm](http://npmjs.org):

```bash
npm install --save wpapi
```

Then, within your application's script files, `require` the module to gain access to it:

```javascript
var WPAPI = require( 'wpapi' );
```

This library requires Node.js version 0.12 or above; 4.0 or higher is highly recommended.

This library is designed to work in the browser as well, via a build system such as Browserify or Webpack; just install the package and `require( 'wpapi' )` from your application code.

### Download the UMD Bundle

Alternatively, you may download a [ZIP archive of the bundled library code](https://wp-api.github.io/node-wpapi/wpapi.zip). These files are UMD modules, which may be included directly on a page using a regular `<script>` tag _or_ required via AMD or CommonJS module systems. In the absence of a module system, the UMD modules will export the browser global variable `WPAPI`, which can be used in place of `require( 'wpapi' )` to access the library from your code.