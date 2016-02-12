'use strict';

var namedGroupRegexp = require( './named-group-regexp' );

function buildRouteTree( routes ) {
	return Object.keys( routes ).reduce(function( namespaces, route ) {
		var routeObj = routes[ route ];
		var nsForRoute = routeObj.namespace;
		// Do not make a namespace group for the API root
		// Do not add the namespace root to its own group
		if ( ! nsForRoute || '/' + nsForRoute === route ) {
			return namespaces;
		}

		// Ensure that the namespace object for this namespace exists
		if ( ! namespaces[ nsForRoute ] ) {
			namespaces[ nsForRoute ] = {};
		}

		// Get a local reference to namespace object
		var ns = namespaces[ nsForRoute ];

		// Strip the namespace from the route string (all routes should have the
		// format `/namespace/other/stuff`) @TODO: Validate this assumption
		var routeString = route.replace( '/' + nsForRoute + '/', '' );

		// If no route string, carry on
		if ( ! routeString ) { return namespaces; }

		var routeComponents = routeString.split( '/' );

		// If no components, carry on
		if ( ! routeComponents.length ) { return namespaces; }

		// The first element of the route tells us what type of resource this route
		// is for, e.g. "posts" or "comments": we build one handler per resource
		// type, so we group like resource paths together.
		var resource = routeComponents.shift();

		// @TODO: This code above currently precludes baseless routes, e.g.
		// myplugin/v2/(?P<resource>\w+) -- should those be supported?

		// Create an array to represent this resource, and ensure it is assigned
		// to the namespace object. The array will structure the "levels" (path
		// components and subresource types) of this resource's endpoint handler.
		var levels = ns[ resource ] || {};
		ns[ resource ] = levels;

		routeComponents.reduce(function( parentLevel, component, idx, components ) {
			// Check to see if this component is a dynamic URL segment (i.e. defined by
			// a named capture group regular expression). namedGroup will be `null` if
			// the regexp does not match, or else an array defining the RegExp match, e.g.
			// [
			//   'P<id>[\\d]+)',
			//   'id', // Name of the group
			//   '[\\d]+', // regular expression for this URL segment's contents
			//   index: 15,
			//   input: '/wp/v2/posts/(?P<id>[\\d]+)'
			// ]
			var namedGroup = component.match( namedGroupRegexp );
			// Pull out references to the relevant indices of the match, for utility:
			// `null` checking is necessary in case the component did not match the RE,
			// hence the `namedGroup &&`.
			var groupName = namedGroup && namedGroup[ 1 ];
			var groupPattern = namedGroup && namedGroup[ 2 ];

			// When branching based on a dynamic capture group we used the group's RE
			// pattern as the unique identifier: this is done because the same group
			// could be assigned different names in different endpoint handlers, e.g.
			// "id" for posts/:id vs "parent_id" for posts/:parent_id/revisions.
			var levelKey = namedGroup ? groupPattern : component;

			// Level name, on the other hand, would take its value from the group's name
			var levelName = namedGroup ? groupName : component;

			// Check whether we have a preexisting node at this level of the tree, and
			// create a new level object if not
			var currentLevel = parentLevel[ levelKey ] || {
				dynamic: namedGroup ? true : false,
				level: idx,
				names: []
			};

			// A level's "name" corresponds to the list of strings which could describe
			// an endpoint's component setter functions: "id", "revisions", etc.
			if ( currentLevel.names.indexOf( levelName ) < 0 ) {
				currentLevel.names.push( levelName );
			}

			// A level's validate method is called to check whether a value being set
			// on the request URL is of the proper type for the location in which it
			// is specified. If a group pattern was found, the validator checks whether
			// the input string exactly matches the group pattern.
			var groupPatternRE = groupPattern && new RegExp( '^' + groupPattern + '$' );

			// Only one validate function is maintained for each node, because each node
			// is defined either by a string literal or by a specific regular expression.
			currentLevel.validate = function( input ) {
				return groupPatternRE ? groupPatternRE.test( input ) : input === component;
			};

			// Check to see whether to expect more nodes within this branch of the tree,
			if ( components[ idx + 1 ] ) {
				// and create a "children" object to hold those nodes if necessary
				currentLevel.children = currentLevel.children || {};
			} else {
				// At leaf nodes, specify the method capabilities of this endpoint
				currentLevel.methods = routeObj.methods ? routeObj.methods.map(function( str ) {
					return str.toLowerCase();
				}) : [];

				// Label node with the title of this endpoint's resource, if available
				if ( routeObj.schema && routeObj.schema.title ) {
					currentLevel.title = routeObj.schema.title;
				}
			}

			// Return the child node object as the new "level"
			parentLevel[ levelKey ] = currentLevel;
			return currentLevel.children;
		}, levels );

		// namespaces[ nsForRoute ] = levels;
		// namespaces[ nsForRoute ].routes.push( routeString );

		return namespaces;
	}, {} );
}

module.exports = buildRouteTree;
