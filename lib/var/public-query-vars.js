'use strict';
/**
 * Sorted list of publicly-exposed WP_Query variables
 * This may be used for a whitelist soon, but at present please consider it
 * to be simply documentation.
 *
 * Documentation:
 *
 * - WP_Query parameters: http://codex.wordpress.org/Class_Reference/WP_Query
 * - Public query variables: http://codex.wordpress.org/WordPress_Query_Vars
 *
 * Note: posts_per_page is a private query varaible within WordPress, but is
 * explicitly exposed for public querying within the WP API
 */
module.exports = [
	// Search parameter
	's',               // (string) - Search keyword.

	// Number and order of results per page
	'posts_per_page',  // (int) - number of posts per page. -1 for all.
	'order',           // (string) - Designates the ascending or descending order of the 'orderby'
	//                               parameter. Defaults to 'DESC'.
	'orderby',         // (string) - Sort retrieved posts by parameter. Defaults to 'date'. One or
	//                               more options can be passed.

	// Name & ID queries
	'pagename',        // (string) - use page slug.
	'page_id',         // (int) - use page id.
	'p',               // (int) - use post id.

	// Date parameters
	'm',               // (int) - YearMonth (For e.g.: 201307).
	'w',               // (int) - Week of the year (from 0 to 53). Uses MySQL WEEK command.
	//                            The mode is dependent on the "start_of_week" option.
	'year',            // (int) - 4 digit year (e.g. 2011).
	'monthnum',        // (int) - Month number (from 1 to 12).
	'day',             // (int) - Week of the year (from 0 to 53).
	'hour',            // (int) - Hour (from 0 to 23).
	'minute',          // (int) - Minute (from 0 to 60).
	'second',          // (int) - Second (0 to 60).
	'name',            // (string) - use post slug.

	// Taxonomy parameters
	'cat',             // (int) - use category id.
	'category_name',   // (string) - use category slug (NOT name).
	'tag',             // (string) - use tag slug. (for multiple tags, use 'filter[tag]=slug,slug'
	//                               for OR or 'filter[tag]=slug+slug' for AND)
	// 'cpt_name'      // (string) - use custom tax slugs or ids based on the type of taxonomy.

	// Author parameters
	'author',          // (int) - use author id.
	'author_name',     // (string) - use 'user_nicename' (NOT name).

	// Things I do not believe to be useful to the API client
	// 'error'         // (string) - error page to show, e.g. ?error=404
	// 'feed',         // (string) - Type of feed to return, e.g. 'rss2'.

	'post_type',       // (string / array) - use post types. Retrieves posts by Post Types, default
	//                    value is 'post'. If 'tax_query' is set for a query, the default value
	//                    becomes 'any'. This was replaced by `type=cpt_name`

	// The following properties should be set directly, not within "filter[]"
	'page',            // (int) - number of pages to skip when paging through posts.
	'type'             // (string) - the name of a custom post type object (replaces post_type)

	// The following properties appear to have been replaced with direct-use query parameters:
	// 'taxonomy',        // Replaced by "?filter[tax_name]=terms": (string) - Taxonomy.
	// 'paged',           // Replaced by "?page=n":number of pages to skip
	// 'post_type',       // Replaced by "?type=cpt_name": (string / array) - use post types.

	// Cannot find documentation for these:
	// 'more',            // <no documentation available>
	// 'posts',           // <no documentation available>
	// 'withcomments',    // <no documentation available>
	// 'withoutcomments', // <no documentation available>
	// 'search',          // <no documentation available>
	// 'exact',           // <no documentation available>
	// 'sentence',        // <no documentation available>
	// 'calendar',        // <no documentation available>
	// 'tb',              // <no documentation available>
	// 'pb',              // <no documentation available>
	// 'static',          // <no documentation available>
	// 'comments_popup',  // <no documentation available>
	// 'attachment',      // <no documentation available>
	// 'attachment_id',   // <no documentation available>
	// 'subpost',         // <no documentation available>
	// 'subpost_id',      // <no documentation available>
	// 'preview',         // <no documentation available>
	// 'robots',          // <no documentation available>
	// 'term',            // <no documentation available>
	// 'cpage'            // <no documentation available>
].sort();
