<?php
defined( 'ABSPATH' ) || exit;

/**
 * Execute a read-only WooCommerce product request in-process.
 *
 * Catalog reads run inside the same WordPress/WooCommerce installation and must
 * not depend on self-HTTP requests or WooCommerce consumer credentials. The
 * official Woo REST products controller remains the schema authority while DTB
 * avoids network latency, credential drift, and recursive HTTP failure modes.
 *
 * Falls back to the legacy cached server-side proxy only when the Woo controller
 * is unavailable so older operational environments remain recoverable.
 *
 * @param string               $route  wc/v3/products or wc/v3/products/{id}.
 * @param array<string,mixed>  $params Request parameters.
 * @return WP_REST_Response|null
 */
function dtb_catalog_wc_get_response( string $route, array $params = [] ): ?WP_REST_Response {
	$route = trim( $route, '/' );

	if ( preg_match( '#^wc/v3/products(?:/(?P<id>\d+))?$#', $route, $matches ) && class_exists( 'WC_REST_Products_Controller' ) ) {
		$controller = new WC_REST_Products_Controller();
		$request    = new WP_REST_Request( 'GET', '/' . $route );

		foreach ( $params as $key => $value ) {
			$request->set_param( (string) $key, $value );
		}

		$product_id = ! empty( $matches['id'] ) ? absint( $matches['id'] ) : 0;
		if ( $product_id > 0 ) {
			/* Public catalog routes must never expose drafts/private products by ID. */
			if ( 'publish' !== get_post_status( $product_id ) ) {
				return new WP_REST_Response(
					dtb_error_envelope( 'not_found', 'Product not found.', 404 ),
					404
				);
			}
			$request->set_param( 'id', $product_id );
			$response = $controller->get_item( $request );
		} else {
			if ( ! $request->has_param( 'status' ) ) {
				$request->set_param( 'status', 'publish' );
			}
			$response = $controller->get_items( $request );
		}

		if ( is_wp_error( $response ) ) {
			return rest_convert_error_to_response( $response );
		}
		if ( $response instanceof WP_REST_Response ) {
			return $response;
		}
		if ( $response instanceof WP_HTTP_Response ) {
			return new WP_REST_Response( $response->get_data(), $response->get_status(), $response->get_headers() );
		}
	}

	if ( function_exists( 'dtb_cached_wc_get' ) ) {
		$response = dtb_cached_wc_get( $route, $params );
		return $response instanceof WP_REST_Response ? $response : null;
	}

	return null;
}

/**
 * Fetch products by IDs in include order.
 *
 * @param int[] $ids
 * @return WP_REST_Response|null
 */
function dtb_catalog_wc_get_products_by_ids_response( array $ids ): ?WP_REST_Response {
	$ids = array_values( array_filter( array_map( 'absint', $ids ) ) );
	if ( empty( $ids ) ) {
		return null;
	}

	return dtb_catalog_wc_get_response( 'wc/v3/products', [
		'include'  => implode( ',', $ids ),
		'orderby'  => 'include',
		'per_page' => count( $ids ),
		'_fields'  => DTB_PRODUCT_DETAIL_FIELDS,
	] );
}

/**
 * Fetch products by IDs in include order.
 *
 * @param int[] $ids
 * @return array[]
 */
function dtb_catalog_wc_fetch_products_by_ids( array $ids ): array {
	$response = dtb_catalog_wc_get_products_by_ids_response( $ids );

	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return [];
	}

	$data = $response->get_data();
	return is_array( $data ) ? $data : [];
}

/** Fetch a single published product by slug. */
function dtb_catalog_wc_fetch_product_by_slug( string $slug ): ?array {
	$slug = sanitize_title( $slug );
	if ( '' === $slug ) {
		return null;
	}

	$response = dtb_catalog_wc_get_response( 'wc/v3/products', [
		'slug'    => $slug,
		'status'  => 'publish',
		'_fields' => DTB_PRODUCT_DETAIL_FIELDS,
	] );

	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return null;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) || empty( $data[0] ) || ! is_array( $data[0] ) ) {
		return null;
	}

	return $data[0];
}

/** Fetch a single published product by ID. */
function dtb_catalog_wc_fetch_product_by_id( int $product_id ): ?array {
	$product_id = absint( $product_id );
	if ( $product_id <= 0 ) {
		return null;
	}

	$response = dtb_catalog_wc_get_response( 'wc/v3/products/' . $product_id, [] );
	if ( ! is_object( $response ) || 200 !== $response->get_status() ) {
		return null;
	}

	$data = $response->get_data();
	return is_array( $data ) ? $data : null;
}
