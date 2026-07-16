type MethodSupportRequestLike = import( '../types' ).MethodSupportRequestLike;

/**
 * Verify that a specific HTTP method is supported by the provided WPRequest
 *
 * @module util/check-method-support
 * @param method  An HTTP method to check ('get', 'post', etc)
 * @param request A WPRequest object with a _supportedMethods array
 * @returns true iff the method is within request._supportedMethods
 */
const checkMethodSupport = ( method: string, request: MethodSupportRequestLike ): true => {
	if ( request._supportedMethods.indexOf( method.toLowerCase() ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			request._supportedMethods.join( ', ' ),
		);
	}

	return true;
};

export = checkMethodSupport;
