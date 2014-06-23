/**
 * Sorted list of publicly-exposed WP_Query variables
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
	'm',               // (int) - YearMonth (For e.g.: 201307).
	'p',               // (int) - use post id.
	'w',               // (int) - Week of the year (from 0 to 53). Uses MySQL WEEK command. The mode is dependent on the "start_of_week" option.
	'cat',             // (int) - use category id.
	's',               // (string) - Search keyword.
	'order',           // (string) - Designates the ascending or descending order of the 'orderby' parameter. Defaults to 'DESC'.
	'orderby',         // (string) - Sort retrieved posts by parameter. Defaults to 'date'. One or more options can be passed.
	'year',            // (int) - 4 digit year (e.g. 2011).
	'monthnum',        // (int) - Month number (from 1 to 12).
	'day',             // (int) - Week of the year (from 0 to 53).
	'hour',            // (int) - Hour (from 0 to 23).
	'minute',          // (int) - Minute (from 0 to 60).
	'second',          // (int) - Second (0 to 60).
	'name',            // (string) - use post slug.
	'category_name',   // (string) - use category slug (NOT name).
	'tag',             // (string) - use tag slug. (for multiple, 'filter[tag]=slug,slug' or 'filter[tag]=slug+slug')
	'author',          // (int) - use author id.
	'author_name',     // (string) - use 'user_nicename' (NOT name).
	'pagename',        // (string) - use page slug.
	'page_id',         // (int) - use page id.
	'error',           // (string) - error code to show a page for, e.g. ?error=404
	'taxonomy',        // (string) - Taxonomy.
	'post_type',       // (string / array) - use post types. Retrieves posts by Post Types, default value is 'post'. If 'tax_query' is set for a query, the default value becomes 'any'	'more',            //
	// The following properties should be set directly, not within "filter[]"
	'page',            //*(int) - number of page for a static front page. Show the posts that would normally show up just on page X of a Static Front Page.
	// The following properties DO NOT seem to work as filter[]s OR regular query params
	'paged',           // (int) - number of page. Show the posts that would normally show up just on page X when using the "Older Entries" link.
	'posts',           //
	'withcomments',    //
	'withoutcomments', //
	'search',          //
	'exact',           //
	'sentence',        //
	'calendar',        //
	'tb',              //
	'pb',              //
	'static',          //
	'comments_popup',  //
	'attachment',      //
	'attachment_id',   //
	'feed',            //
	'subpost',         //
	'subpost_id',      //
	'preview',         //
	'robots',          //
	'term',            //
	'cpage',           //
	'posts_per_page'   //
].sort();

/*
/?p=37                   //  single post
/?page_id=40             //  single page
/?paged=4                //  page 4 of 10 in archive

/?m=201310               //  10-2013 archive
/?monthnum=10            //  month 10 archive
/?year=2013              //  year archive
/?day=12                 //  daily archive (current year and month)

/?cat=3                  //  category archive
/?tag=tag4               //  tag archive
/?rating=rating4         //  custom taxonomy archive
/?post_type=tickets      //  custom post type archive
/?author=1               //  author archive by id
/?author_name=admin      //  author archive by name
/?s=uuu                  //  search archive
/?error=404              //  page not found
/?feed=rss2              //  output feed
*/

// page doesn't seem
