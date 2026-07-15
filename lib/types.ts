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
