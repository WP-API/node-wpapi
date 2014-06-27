'use strict';
/**
 * Sorted list of private WP_Query variables, requiring authentication
 * This may be used for a whitelist soon, but at present please consider it
 * to be simply documentation.
 *
 * Documentation:
 *
 * - WP_Query parameters: http://codex.wordpress.org/Class_Reference/WP_Query
 * - Privat query variables: WordPress core, wp-includes/class-wp.php
 *
 * Note: posts_per_page is a private query varaible within WordPress, but is
 * explicitly exposed for public querying within the WP API so it exists in
 * the list within public-query-vars.js
 */
module.exports = [
	'offset',                 // (int) - number of post to displace or pass over. Warning: Setting
	//                                   the offset parameter overrides/ignores the paged parameter
	//                                   and breaks pagination (Click here for a workaround). The
	//                                   'offset' parameter is ignored when 'posts_per_page'=>-1
	//                                   (show all posts) is used.
	'posts_per_archive_page', // (int) - number of posts to show per page - on archive pages only.
	//                                   Over-rides posts_per_page and showposts on pages where
	//                                   is_archive() or is_search() would be true.
	// 'showposts',           // <replaced by posts_per_page>
	'nopaging',               // (boolean) - show all posts or use pagination. Default value is
	//                                       'false', use paging.
	'post_type',              // (string / array) - use post types. Retrieves posts by Post Types,
	//                                              default value is 'post'.
	'post_status',            // (string / array) - use post status. Retrieves posts by Post Status.
	//                                              Default value is 'publish', but if the user is
	//                                              logged in, 'private' is added.
	'category__in',           // (array) - use category id.
	'category__not_in',       // (array) - use category id.
	'category__and',          // (array) - use category id.
	'tag__in',                // (array) - use tag ids.
	'tag__not_in',            // (array) - use tag ids.
	'tag__and',               // (array) - use tag ids.
	'tag_slug__in',           // (array) - use tag slugs.
	'tag_slug__and',          // (array) - use tag slugs.
	'tag_id',                 // (int) - use tag id.
	//'post_mime_type',       // <no documentation available>
	'perm',                   // (string) - User permission.
	//'comments_per_page',    // <no documentation available>
	'post__in',               // (array) - use post ids. Specify posts to retrieve.
	'post__not_in',           // (array) - use post ids. Specify post NOT to retrieve.
	'post_parent',            // (int) - use page id. Return just the child Pages.
	'post_parent__in',        // (array) - use post ids. Specify posts whose parent is in an array.
	'post_parent__not_in'     // (array) - use post ids. Specify posts whose parent isn't in an arr.
].sort();
