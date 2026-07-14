'use strict';

// Stub for Node's `fs` module in browser bundles. The `fetch` transport only
// calls `fs.createReadStream` when uploading a file given as a path string,
// which is a Node-only usage pattern; browser callers pass a File/Blob instead.
module.exports = {};
