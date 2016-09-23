'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const kramed = require( 'kramed' );
const combyne = require( 'combyne' );
combyne.settings.delimiters = {
	// Avoid conflict with Jekyll template delimiters
	START_RAW: '[{{{',
	END_RAW: '}}}]',
	START_PROP: '[{{',
	END_PROP: '}}]',
	START_EXPR: '[{%',
	END_EXPR: '%}]'
};

// Paths
const projectRoot = path.join( __dirname, '../..' );
const docsDir = path.join( projectRoot, 'documentation' );
const readmePath = path.join( projectRoot, 'README.md' );
const contributingPath = path.join( projectRoot, 'CONTRIBUTING.md' );
const licensePath = path.join( projectRoot, 'LICENSE' );
const indexTemplatePath = path.join( projectRoot, 'documentation', 'index.html.combyne' );
const err404TemplatePath = path.join( projectRoot, 'documentation', '404.html.combyne' );

// This constant defines the minimum importance of header for which files will
// be created: e.g. if this is 2, files will only be created for headers # & ##
const README_SPLIT_LEVEL = 2;

// This is a list of slugs to skip when rendering the page index on the homepage
const SKIP_SECTION_LINKS = [
	// "About" content is embedded into the index page
	'about',
	// API Documentation provided via YUIDoc & the link is injected into the index
	'api-documentation'
];

// This is a list of slugs to skip when generating pages from README sections
const SKIP_SECTIONS = SKIP_SECTION_LINKS.concat([
	// CONTRIBUTING.md supersedes the README's contributing section
	'contributing'
]);

const pad = ( num, digits ) => {
	let str = '' + parseInt( num, 10 );
	while ( str.length < digits ) {
		str = '0' + str;
	}
	return str;
};

const titleToSlug = title => title
	.toLowerCase()
	.replace( /[^\w]/g, ' ' )
	.trim()
	.split( /\s+/ )
	.join( '-' );

const fileHeader = title => {
	const slug = titleToSlug( title );
	return `---\nlayout: page\ntitle: ${ title }\npermalink: /${ slug }/\n---`;
};

const titleRE = /^\n+#+([^\n]+)\n+$/;
const hasSectionsRE = /\n#+([^\n]+)\n/;

const isTitle = token => token.match( titleRE );

const getTitle = token => token.replace( titleRE, '$1' ).trim();

const getLevel = mdHeading => {
	const match = mdHeading.match( /#+/ );
	return match ? match[ 0 ].length : -1;
};

const getContents = entry => {
	// Strip any top-level headings: those are rendered as titles elsewhere
	const fileContents = entry.tokens.join( '' ).replace( /^# [^\n]+/, '' );
	const title = fileHeader( entry.title );

	// Only include the ToC placeholder if a ToC is needed
	return hasSectionsRE.test( fileContents ) ?
		[ title, '* TOC\n{:toc}', fileContents ].join( '\n\n' ) :
		[ title, fileContents ].join( '\n\n' );
};

// Promise-based File System helpers
const readFile = sourcePath => new Promise( ( resolve, reject ) => {
	fs.readFile( sourcePath, ( err, contents ) => {
		if ( err ) {
			return reject( err );
		}

		// contents is a Buffer
		resolve( contents.toString() );
	});
});

const writeFile = ( outputPath, fileContents ) => new Promise( ( resolve, reject ) => {
	fs.writeFile( outputPath, fileContents, ( err, result ) => {
		if ( err ) {
			return reject( err );
		}

		resolve();
	});
});

const copyFile = ( sourcePath, title ) => readFile( sourcePath ).then( contents => {
	const outputPath = path.join( docsDir, `${ titleToSlug( title ) }.md` );
	return writeFile( outputPath, getContents({
		title: title,
		tokens: [ contents ]
	}) );
});

// Break the README into individual files
const readmeOutput = readFile( readmePath ).then( contents => {
	const tokens = contents.split( /(\n+#+ .*\n+)/ );
	const entries = [];
	let entry = null;

	for ( let i = 0; i < tokens.length; i++ ) {
		let token = tokens[ i ];

		if ( ! isTitle( token ) ) {
			if ( entry && entry.tokens ) {
				entry.tokens.push( token );
			}
			continue;
		}

		const level = getLevel( token );

		if ( level > README_SPLIT_LEVEL ) {
			entry.tokens.push( token );

			if ( level === README_SPLIT_LEVEL + 1 ) {
				entry.subheadings.push({
					slug: `${ entry.slug }#${ titleToSlug( token ) }`,
					title: getTitle( token ),
					level: level
				});
			}
			continue;
		}

		entry = {
			heading: token,
			slug: titleToSlug( token ),
			title: getTitle( token ),
			level: level,
			subheadings: [],
			tokens: []
		};

		entries.push( entry );
	}

	entries.forEach( entry => entry.contents = getContents( entry ) );

	return entries.reduce( ( previous, entry, idx ) => {
		return previous.then( () => {
			const outputPath = path.join( docsDir, `${ pad( idx, 2 ) }-${ entry.slug }.md` );

			return SKIP_SECTIONS.indexOf( entry.slug ) === -1 ?
				writeFile( outputPath, entry.contents ) :
				Promise.resolve();
		});
	}, Promise.resolve() ).then( () => {
		entries.push({
			title: 'API Documentation',
			slug: 'api-reference/modules/WPAPI.html'
		});
		return entries;
	});
});

// Create the contributor guide (runs after the README files are processed in
// order to overwrite the "contributing" README section, if present)
const contributingOutput = readmeOutput.then( () => copyFile( contributingPath, 'Contributing' ) );

// Create the license page
const licenseOutput = copyFile( licensePath, 'License' );

// Build the template context to use with the
const templateContext = readmeOutput.then( entries => {
	return entries.reduce( ( context, entry ) => {
		const isAboutPage = entry.slug === 'about';
		if ( isAboutPage ) {
			context.aboutContents = kramed( entry.tokens.join( '' ) );
		} else if ( SKIP_SECTION_LINKS.indexOf( entry.slug ) === -1 ) {
			entry.hasSubheadings = entry.subheadings && entry.subheadings.length;
			context.readmeSections.push( entry );
		}
		return context;
	}, {
		aboutContents: null,
		readmeSections: []
	});
});

const fileAndContext = filePath => Promise.all([
	readFile( filePath ),
	templateContext
]).then( result => ({
	template: result[ 0 ],
	context: result[ 1 ]
}) );

// Create the index HTML page
const indexOutput = fileAndContext( indexTemplatePath ).then( result => {
	console.log( 'index' );
	const outputPath = path.join( docsDir, 'index.html' );
	const fileContents = combyne( result.template ).render( result.context );
	return writeFile( outputPath, fileContents );
});

// Create the Error 404 page
const err404Output = fileAndContext( err404TemplatePath ).then( result => {
	console.log( '404' );
	const outputPath = path.join( docsDir, '404.html' );
	const fileContents = combyne( result.template ).render( result.context );
	return writeFile( outputPath, fileContents );
});

module.exports = Promise.all([
	readmeOutput,
	contributingOutput,
	licenseOutput,
	indexOutput,
	err404Output
])
.catch( err => console.log( err && err.stack ) );
