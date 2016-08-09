'use strict';

console.log( 'There is not yet an automated deployment script for the docs site.' );
console.log( 'But here are the manual steps to take, in the interim:\n' );

[
	'`npm run build` to generate the browser-ready bundles',
	'`npm run docs` to zip the bundles and prepare the Jekyll site content',
	'`cp -r documentation docs-tmp` to move the docs folder outside of Git',
	'`git checkout gh-pages` to switch to the branch for the public-facing site',
	'`mv docs-tmp/* .` in the project root to move the docs into position',
	'`rm -rf docs-tmp` to clean up the no-longer-needed temporary files',
	'`git add .` to stage all files',
	'`git commit -m "vX.X.X"` to commit the updated docs site',
	'`git push` to deploy the site!'
].forEach( ( instruction, idx ) => console.log( `${ idx + 1 }. ${ instruction }` ) );
