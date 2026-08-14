<?php
/**
 * DTB Catalog Platform — Pricing Manager admin REST controller.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_pricing_manager_register_routes' );

/** Register the small admin-only REST surface used by the pricing workspace. */
function dtb_pricing_manager_register_routes(): void {
	$permission = static fn(): bool => current_user_can( 'dtb_manage_catalog_pricing' );

	register_rest_route(
		'dtb/v1',
		'/admin/pricing/products',
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_pricing_manager_rest_products',
			'permission_callback' => $permission,
			'args'                => [
				'search'    => [ 'sanitize_callback' => 'sanitize_text_field' ],
				'brand'     => [ 'sanitize_callback' => 'sanitize_text_field' ],
				'status'    => [ 'sanitize_callback' => 'sanitize_key' ],
				'page'      => [ 'sanitize_callback' => 'absint' ],
				'per_page'  => [ 'sanitize_callback' => 'absint' ],
				'sort'      => [ 'sanitize_callback' => 'sanitize_key' ],
				'direction' => [ 'sanitize_callback' => 'sanitize_key' ],
			],
		]
	);

	register_rest_route(
		'dtb/v1',
		'/admin/pricing/data',
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => static fn(): WP_REST_Response => new WP_REST_Response( dtb_pricing_get_data_summary(), 200 ),
			'permission_callback' => $permission,
		]
	);

	register_rest_route(
		'dtb/v1',
		'/admin/pricing/product/(?P<id>\d+)',
		[
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'dtb_pricing_manager_rest_product',
				'permission_callback' => $permission,
			],
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'dtb_pricing_manager_rest_update_product',
				'permission_callback' => $permission,
			],
		]
	);

	register_rest_route(
		'dtb/v1',
		'/admin/pricing/settings',
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_pricing_manager_rest_update_settings',
			'permission_callback' => $permission,
		]
	);

	register_rest_route(
		'dtb/v1',
		'/admin/pricing/apply',
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_pricing_manager_rest_apply_selected',
			'permission_callback' => $permission,
		]
	);
}

/** Return a paginated pricing product list. */
function dtb_pricing_manager_rest_products( WP_REST_Request $request ): WP_REST_Response {
	$data = dtb_pricing_query_products(
		[
			'search'    => $request->get_param( 'search' ),
			'brand'     => $request->get_param( 'brand' ),
			'status'    => $request->get_param( 'status' ),
			'page'      => $request->get_param( 'page' ),
			'per_page'  => $request->get_param( 'per_page' ),
			'sort'      => $request->get_param( 'sort' ),
			'direction' => $request->get_param( 'direction' ),
		]
	);

	return new WP_REST_Response( $data, 200 );
}

/** Return a fresh snapshot for one price-owning product. */
function dtb_pricing_manager_rest_product( WP_REST_Request $request ) {
	$product = dtb_pricing_get_product( absint( $request['id'] ) );
	if ( null === $product ) {
		return new WP_Error( 'dtb_pricing_product_not_found', __( 'Product not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}

	return new WP_REST_Response( $product, 200 );
}

/** Update the pricing-manager-owned fields for one product. */
function dtb_pricing_manager_rest_update_product( WP_REST_Request $request ) {
	$payload = $request->get_json_params();
	$fields  = [];

	foreach ( [ 'regular_price', 'map_price', 'map_source' ] as $field ) {
		if ( is_array( $payload ) && array_key_exists( $field, $payload ) ) {
			$fields[ $field ] = $payload[ $field ];
		}
	}

	$updated = dtb_pricing_update_product( absint( $request['id'] ), $fields );
	if ( is_wp_error( $updated ) ) {
		return $updated;
	}

	return new WP_REST_Response( $updated, 200 );
}

/** Save the single V1 pricing policy setting. */
function dtb_pricing_manager_rest_update_settings( WP_REST_Request $request ) {
	$payload = $request->get_json_params();
	$margin  = is_array( $payload ) ? (float) ( $payload['target_margin'] ?? 0 ) : 0;
	if ( $margin <= 0 || $margin >= 100 ) {
		return new WP_Error( 'dtb_pricing_invalid_margin', __( 'Target margin must be between 1 and 95 percent.', 'drywall-toolbox' ), [ 'status' => 400 ] );
	}

	return new WP_REST_Response( [ 'target_margin' => dtb_pricing_set_target_margin( $margin ) ], 200 );
}

/** Apply a bounded set of explicitly selected optimizer recommendations. */
function dtb_pricing_manager_rest_apply_selected( WP_REST_Request $request ) {
	$payload = $request->get_json_params();
	$items   = is_array( $payload ) && isset( $payload['items'] ) && is_array( $payload['items'] ) ? $payload['items'] : [];
	if ( [] === $items ) {
		return new WP_Error( 'dtb_pricing_empty_apply', __( 'Select at least one pricing recommendation.', 'drywall-toolbox' ), [ 'status' => 400 ] );
	}

	return new WP_REST_Response( dtb_pricing_apply_selected( $items ), 200 );
}
