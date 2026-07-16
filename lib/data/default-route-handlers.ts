/**
 * Typings for the endpoint handler factories a default-mode WPAPI instance is
 * bootstrapped with, and for the request handlers those factories create.
 *
 * GENERATED FILE -- do not edit. Regenerate with `npm run precompute-routes`
 * (build/scripts/precompute-default-routes.js), which derives these interfaces
 * from lib/data/default-routes.json via the same pipeline that generates the
 * runtime handlers.
 *
 * This module is type-only: it has no runtime output.
 *
 * @module default-route-handlers
 */

type WPRequest = InstanceType<typeof import( '../constructors/wp-request' )>;

/** Request handler for oembed/1.0/embed routes. */
export type Oembed10EmbedRequest = WPRequest;

/** Request handler for oembed/1.0/proxy routes. */
export type Oembed10ProxyRequest = WPRequest;

/** Request handler for wp/v2/posts routes. */
export interface WpV2PostsRequest extends WPRequest {
	/**
	 * Retrieve only records published after the specified date.
	 */
	after( date: string | Date ): this;

	/**
	 * Query for records by a specific author ID (or, deprecated, nicename string).
	 */
	author( author?: string | number | null ): this;

	/**
	 * Retrieve only records published before the specified date.
	 */
	before( date: string | Date ): this;

	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;

	/**
	 * Retrieve only records associated with one of the provided category IDs.
	 */
	categories( categories: string | number | Array<string | number> ): this;

	/**
	 * Query by category slug or ID.
	 * @deprecated Use .categories() and query by category IDs.
	 */
	category( category: string | number | Array<string | number> ): this;

	/**
	 * Exclude records associated with any of the provided category IDs.
	 */
	excludeCategories( categories: string | number | Array<string | number> ): this;

	/**
	 * Retrieve only records associated with one of the provided tag IDs.
	 */
	tags( tags: string | number | Array<string | number> ): this;

	/**
	 * Query by tag slug or ID.
	 * @deprecated Use .tags() and query by term IDs.
	 */
	tag( tag: string | number | Array<string | number> ): this;

	/**
	 * Exclude records associated with any of the provided tag IDs.
	 */
	excludeTags( tags: string | number | Array<string | number> ): this;

	/**
	 * Return only sticky posts (true) or only non-sticky posts (false).
	 */
	sticky( sticky: boolean ): this;

	/**
	 * Specify the password with which to access a protected post's content.
	 */
	password( password: string ): this;

	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;

	/**
	 * Select the revisions collection, or one resource within it.
	 */
	revisions( val?: string | number ): this;

	/**
	 * Select the autosaves collection, or one resource within it.
	 */
	autosaves( val?: string | number ): this;
}

/** Request handler for wp/v2/pages routes. */
export interface WpV2PagesRequest extends WPRequest {
	/**
	 * Retrieve only records published after the specified date.
	 */
	after( date: string | Date ): this;

	/**
	 * Query for records by a specific author ID (or, deprecated, nicename string).
	 */
	author( author?: string | number | null ): this;

	/**
	 * Retrieve only records published before the specified date.
	 */
	before( date: string | Date ): this;

	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;

	/**
	 * Specify the password with which to access a protected post's content.
	 */
	password( password: string ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;

	/**
	 * Select the revisions collection, or one resource within it.
	 */
	revisions( val?: string | number ): this;

	/**
	 * Select the autosaves collection, or one resource within it.
	 */
	autosaves( val?: string | number ): this;
}

/** Request handler for wp/v2/media routes. */
export interface WpV2MediaRequest extends WPRequest {
	/**
	 * Retrieve only records published after the specified date.
	 */
	after( date: string | Date ): this;

	/**
	 * Query for records by a specific author ID (or, deprecated, nicename string).
	 */
	author( author?: string | number | null ): this;

	/**
	 * Retrieve only records published before the specified date.
	 */
	before( date: string | Date ): this;

	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;
}

/** Request handler for wp/v2/blocks routes. */
export interface WpV2BlocksRequest extends WPRequest {
	/**
	 * Retrieve only records published after the specified date.
	 */
	after( date: string | Date ): this;

	/**
	 * Retrieve only records published before the specified date.
	 */
	before( date: string | Date ): this;

	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;

	/**
	 * Specify the password with which to access a protected post's content.
	 */
	password( password: string ): this;

	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;

	/**
	 * Select the autosaves collection, or one resource within it.
	 */
	autosaves( val?: string | number ): this;
}

/** Request handler for wp/v2/types routes. */
export interface WpV2TypesRequest extends WPRequest {
	/**
	 * Set the type path part of this request URL.
	 */
	type( val: string | number ): this;
}

/** Request handler for wp/v2/statuses routes. */
export interface WpV2StatusesRequest extends WPRequest {
	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;
}

/** Request handler for wp/v2/taxonomies routes. */
export interface WpV2TaxonomiesRequest extends WPRequest {
	/**
	 * Set the taxonomy path part of this request URL.
	 */
	taxonomy( val: string | number ): this;
}

/** Request handler for wp/v2/categories routes. */
export interface WpV2CategoriesRequest extends WPRequest {
	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Specify the post for which to retrieve records.
	 */
	post( post: string | number | Array<string | number> ): this;

	/**
	 * Specify the post for which to retrieve records.
	 * @deprecated Use .post().
	 */
	forPost( post: string | number | Array<string | number> ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;
}

/** Request handler for wp/v2/tags routes. */
export interface WpV2TagsRequest extends WPRequest {
	/**
	 * Specify the post for which to retrieve records.
	 */
	post( post: string | number | Array<string | number> ): this;

	/**
	 * Specify the post for which to retrieve records.
	 * @deprecated Use .post().
	 */
	forPost( post: string | number | Array<string | number> ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;
}

/** Request handler for wp/v2/users routes. */
export interface WpV2UsersRequest extends WPRequest {
	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;

	/**
	 * Select the me collection, or one resource within it.
	 */
	me( val?: string | number ): this;
}

/** Request handler for wp/v2/comments routes. */
export interface WpV2CommentsRequest extends WPRequest {
	/**
	 * Retrieve only records published after the specified date.
	 */
	after( date: string | Date ): this;

	/**
	 * Query for records by a specific author ID (or, deprecated, nicename string).
	 */
	author( author?: string | number | null ): this;

	/**
	 * Retrieve only records published before the specified date.
	 */
	before( date: string | Date ): this;

	/**
	 * Retrieve only records which are children of the provided parent ID.
	 */
	parent( parent: string | number | Array<string | number> ): this;

	/**
	 * Specify the post for which to retrieve records.
	 */
	post( post: string | number | Array<string | number> ): this;

	/**
	 * Specify the post for which to retrieve records.
	 * @deprecated Use .post().
	 */
	forPost( post: string | number | Array<string | number> ): this;

	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;

	/**
	 * Specify the password with which to access a protected post's content.
	 */
	password( password: string ): this;

	/**
	 * Set the id path part of this request URL.
	 */
	id( val: string | number ): this;
}

/** Request handler for wp/v2/search routes. */
export type WpV2SearchRequest = WPRequest;

/** Request handler for wp/v2/block-renderer routes. */
export interface WpV2BlockRendererRequest extends WPRequest {
	/**
	 * Set the name path part of this request URL.
	 */
	name( val: string | number ): this;
}

/** Request handler for wp/v2/settings routes. */
export type WpV2SettingsRequest = WPRequest;

/** Request handler for wp/v2/themes routes. */
export interface WpV2ThemesRequest extends WPRequest {
	/**
	 * Specify one or more post statuses for which to return records.
	 */
	status( status: string | string[] ): this;
}

/** Handler factory methods for the oembed/1.0 namespace. */
export interface Oembed10Handlers {
	/** Create a request handler for oembed/1.0/embed. */
	embed( options?: Record<string, unknown> ): Oembed10EmbedRequest;

	/** Create a request handler for oembed/1.0/proxy. */
	proxy( options?: Record<string, unknown> ): Oembed10ProxyRequest;
}

/** Handler factory methods for the wp/v2 namespace. */
export interface WpV2Handlers {
	/** Create a request handler for wp/v2/posts. */
	posts( options?: Record<string, unknown> ): WpV2PostsRequest;

	/** Create a request handler for wp/v2/pages. */
	pages( options?: Record<string, unknown> ): WpV2PagesRequest;

	/** Create a request handler for wp/v2/media. */
	media( options?: Record<string, unknown> ): WpV2MediaRequest;

	/** Create a request handler for wp/v2/blocks. */
	blocks( options?: Record<string, unknown> ): WpV2BlocksRequest;

	/** Create a request handler for wp/v2/types. */
	types( options?: Record<string, unknown> ): WpV2TypesRequest;

	/** Create a request handler for wp/v2/statuses. */
	statuses( options?: Record<string, unknown> ): WpV2StatusesRequest;

	/** Create a request handler for wp/v2/taxonomies. */
	taxonomies( options?: Record<string, unknown> ): WpV2TaxonomiesRequest;

	/** Create a request handler for wp/v2/categories. */
	categories( options?: Record<string, unknown> ): WpV2CategoriesRequest;

	/** Create a request handler for wp/v2/tags. */
	tags( options?: Record<string, unknown> ): WpV2TagsRequest;

	/** Create a request handler for wp/v2/users. */
	users( options?: Record<string, unknown> ): WpV2UsersRequest;

	/** Create a request handler for wp/v2/comments. */
	comments( options?: Record<string, unknown> ): WpV2CommentsRequest;

	/** Create a request handler for wp/v2/search. */
	search( options?: Record<string, unknown> ): WpV2SearchRequest;

	/** Create a request handler for wp/v2/block-renderer. */
	'block-renderer'( options?: Record<string, unknown> ): WpV2BlockRendererRequest;

	/** Create a request handler for wp/v2/settings. */
	settings( options?: Record<string, unknown> ): WpV2SettingsRequest;

	/** Create a request handler for wp/v2/themes. */
	themes( options?: Record<string, unknown> ): WpV2ThemesRequest;
}

/**
 * The handler factories assigned to default namespaces, keyed by namespace
 * string as consumed by `.namespace()`.
 */
export interface DefaultNamespaceHandlers {
	'oembed/1.0': Oembed10Handlers;
	'wp/v2': WpV2Handlers;
}

/**
 * The handler factories assigned directly onto a default-mode WPAPI instance
 * (those of the default wp/v2 namespace).
 */
export type DefaultRouteHandlers = DefaultNamespaceHandlers[ 'wp/v2' ];
