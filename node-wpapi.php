<?php
/**
 * Plugin Name: node-wpapi
 * Plugin URI:  https://github.com/wp-api/node-wpapi
 * Description: Register the wpapi npm package as a WordPress script.
 */

namespace WPAPI;

add_action( 'wp enqueue scripts', __NAMESPACE__ . '\\enqueue_scripts' );

/**
 * Enqueue the wpapi script package.
 *
 * @return void
 */
function enqueue_scripts() {
  $uri = plugin_dir_url( __FILE__ ) . 'browser/wpapi.min.js';
  if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
    $uri = plugin_dir_url( __FILE__ ) . 'browser/wpapi.js';
  }

  // Read the package.json to derive the version number.
  $package = read_json( plugin_dir_path( __FILE ) . '/package.json' );

  // Enqueue the script itself.
  wp_enqueue_script(
    'wpapi',
    $uri,
    [],
    $package['version'] ?? null,
    true
  );

  // Inject a JS object into the page to expose the API root URI & nonce.
  wp_localize_script(
    'wpapi',
    'WPAPI_Settings',
    [
      'root'  => esc_url_raw( rest_url() ),
      'nonce' => wp_create_nonce( 'wp_rest' ),
    ]
  );
}

/**
 * Read & parse a JSON file.
 *
 * @param string $path The path to the JSON file to load.
 * @return array The parsed JSON data object.
 */
function read_json( string $path ) : array {
	if ( ! file_exists( $path ) ) {
		return [];
	}
	$contents = file_get_contents( $path );
	if ( empty( $contents ) ) {
		return [];
	}
	return json_decode( $contents, true );
}
