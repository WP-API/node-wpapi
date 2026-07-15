/**
 * Shared structural types for request-like objects used by lib/util helpers.
 *
 * This module is type-only: it has no runtime output, so the CommonJS
 * modules that require() its siblings are unaffected by its existence.
 *
 * @module types
 */

/**
 * Minimal shape of a WPRequest-like object whose supported HTTP methods can
 * be checked.
 */
export interface MethodSupportRequestLike {
	_supportedMethods: string[];
}

/**
 * Minimal shape of a WPRequest-like object with a chainable `.param()`
 * setter, as required by the methods parameter-setter generates.
 */
export interface ParamRequestLike {
	param( key: string, value: unknown ): ParamRequestLike;
}

/**
 * A node in the route tree built by lib/route-tree.js: represents one level
 * of a resource's URL path hierarchy. Non-leaf nodes branch into `children`
 * keyed by the next path segment; leaf nodes carry the HTTP `methods` they
 * support.
 */
export interface RouteTreeNode {
	component: string;
	namedGroup: boolean;
	level: number;
	names: string[];
	validate: ( input: string ) => boolean;
	children?: Record<string, RouteTreeNode>;
	methods?: string[];
}

/**
 * Minimal shape of a WPRequest-like object whose URL path parts can be set,
 * as required by the closures path-part-setter generates.
 */
export interface PathPartRequestLike extends MethodSupportRequestLike {
	setPathPart( level: number, val: string | number ): PathPartRequestLike;
}

/**
 * Minimal shape of a WPRequest-like object as consumed by the filter and
 * parameter mixins: adds the filter-storage properties those mixins read and
 * write, alongside the chainable `.param()` setter.
 */
export interface FilterRequestLike extends ParamRequestLike {
	_filters?: Record<string, unknown>;
	_taxonomyFilters?: Record<string, Array<string | number>>;
	param( key: string, value: unknown ): FilterRequestLike;
}
