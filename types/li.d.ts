/**
 * Minimal ambient typing for the `li` Link-header parser (no published types).
 * Only the `parse` surface this project uses is declared.
 */
declare module 'li' {
	const li: {
		/**
		 * Parse an RFC 5988 Link header into a rel → URL map.
		 */
		parse( linkHeader: string ): Record<string, string>;
	};
	export = li;
}
