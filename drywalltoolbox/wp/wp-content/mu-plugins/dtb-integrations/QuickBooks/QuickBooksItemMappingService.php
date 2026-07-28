<?php
/**
 * QuickBooks accounting item discovery and environment-scoped mapping.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_QuickBooksItemMappingService {
	/**
	 * Canonical QuickBooks service items used by the accounting projection.
	 *
	 * @return array<string, array{name:string,label:string,description:string}>
	 */
	public static function definitions(): array {
		return [
			'product'  => [
				'name'        => 'DTB Product Sales',
				'label'       => __( 'Product sales', 'drywall-toolbox' ),
				'description' => __( 'Merchandise and parts sold through WooCommerce.', 'drywall-toolbox' ),
			],
			'shipping' => [
				'name'        => 'DTB Shipping',
				'label'       => __( 'Shipping', 'drywall-toolbox' ),
				'description' => __( 'Customer shipping and delivery charges.', 'drywall-toolbox' ),
			],
			'discount' => [
				'name'        => 'DTB Discount',
				'label'       => __( 'Discounts', 'drywall-toolbox' ),
				'description' => __( 'Order-level coupons and promotional reductions.', 'drywall-toolbox' ),
			],
			'refund'   => [
				'name'        => 'DTB Refund',
				'label'       => __( 'Refunds', 'drywall-toolbox' ),
				'description' => __( 'Concrete WooCommerce refund projections.', 'drywall-toolbox' ),
			],
		];
	}

	/**
	 * Return the effective local mapping for all required item roles.
	 *
	 * Constants remain supported as an explicit operator override. Managed
	 * mappings are isolated by active QuickBooks environment.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function status(): array {
		$items = [];

		foreach ( self::definitions() as $key => $definition ) {
			$id_constant   = 'DTB_QBO_ITEM_' . strtoupper( $key ) . '_ID';
			$name_constant = 'DTB_QBO_ITEM_' . strtoupper( $key ) . '_NAME';
			$option_id     = dtb_qbo_option_name( 'item_' . $key . '_id' );
			$option_name   = dtb_qbo_option_name( 'item_' . $key . '_name' );
			$legacy_id     = 'dtb_qbo_item_' . $key . '_id';
			$legacy_name   = 'dtb_qbo_item_' . $key . '_name';

			$source = 'unconfigured';
			$id     = '';
			$name   = $definition['name'];

			if ( defined( $id_constant ) ) {
				$id     = sanitize_text_field( (string) constant( $id_constant ) );
				$name   = defined( $name_constant ) ? sanitize_text_field( (string) constant( $name_constant ) ) : $name;
				$source = 'constant';
			} else {
				$id   = sanitize_text_field( (string) get_option( $option_id, '' ) );
				$name = sanitize_text_field( (string) get_option( $option_name, $name ) );

				if ( '' !== $id ) {
					$source = 'managed';
				} else {
					$id   = sanitize_text_field( (string) get_option( $legacy_id, '' ) );
					$name = sanitize_text_field( (string) get_option( $legacy_name, $name ) );
					if ( '' !== $id ) {
						$source = 'legacy';
					}
				}
			}

			$items[ $key ] = [
				'key'         => $key,
				'label'       => $definition['label'],
				'description' => $definition['description'],
				'expected'    => $definition['name'],
				'id'          => $id,
				'name'        => $name,
				'configured'  => '' !== $id,
				'source'      => $source,
				'locked'      => 'constant' === $source,
			];
		}

		return $items;
	}

	/** Determine whether every required accounting item is mapped. */
	public static function ready(): bool {
		foreach ( self::status() as $item ) {
			if ( empty( $item['configured'] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Discover exact-name service items in the connected QuickBooks company.
	 *
	 * This operation is idempotent and does not create or mutate remote records.
	 * It persists only verified exact matches in environment-scoped WordPress
	 * options. Constant-backed mappings remain immutable.
	 *
	 * @return array<string, mixed>|WP_Error
	 */
	public static function discover_and_store(): array|WP_Error {
		if ( ! dtb_qbo_enabled() ) {
			return new WP_Error(
				'qbo_not_connected',
				__( 'QuickBooks must be connected before accounting items can be discovered.', 'drywall-toolbox' ),
				[ 'status' => 409 ]
			);
		}

		$current = self::status();
		$results = [];

		foreach ( self::definitions() as $key => $definition ) {
			$safe_name = str_replace( "'", "''", $definition['name'] );
			$response  = dtb_qbo_request(
				'GET',
				'/query',
				[
					'query' => "SELECT Id, Name, Type, Active FROM Item WHERE Name = '{$safe_name}' MAXRESULTS 2",
				]
			);

			if ( empty( $response['ok'] ) ) {
				return new WP_Error(
					'qbo_item_discovery_failed',
					sanitize_text_field( (string) ( $response['error'] ?? __( 'QuickBooks item discovery failed.', 'drywall-toolbox' ) ) ),
					[
						'status'     => 502,
						'retryable'  => (bool) ( $response['retryable'] ?? false ),
						'intuit_tid' => sanitize_text_field( (string) ( $response['intuit_tid'] ?? '' ) ),
					]
				);
			}

			$matches = (array) ( $response['data']['QueryResponse']['Item'] ?? [] );
			$result  = [
				'key'      => $key,
				'expected' => $definition['name'],
				'status'   => 'missing',
				'id'       => '',
				'name'     => '',
				'type'     => '',
				'active'   => false,
				'source'   => $current[ $key ]['source'],
			];

			if ( count( $matches ) > 1 ) {
				$result['status'] = 'ambiguous';
				$results[ $key ]  = $result;
				continue;
			}

			$item = $matches[0] ?? null;
			if ( ! is_array( $item ) ) {
				$results[ $key ] = $result;
				continue;
			}

			$result['id']     = sanitize_text_field( (string) ( $item['Id'] ?? '' ) );
			$result['name']   = sanitize_text_field( (string) ( $item['Name'] ?? '' ) );
			$result['type']   = sanitize_text_field( (string) ( $item['Type'] ?? '' ) );
			$result['active'] = ! empty( $item['Active'] );

			if ( '' === $result['id'] || $definition['name'] !== $result['name'] ) {
				$result['status'] = 'invalid';
				$results[ $key ]  = $result;
				continue;
			}

			if ( 'Service' !== $result['type'] || ! $result['active'] ) {
				$result['status'] = 'incompatible';
				$results[ $key ]  = $result;
				continue;
			}

			if ( ! empty( $current[ $key ]['locked'] ) ) {
				$result['status'] = hash_equals( (string) $current[ $key ]['id'], $result['id'] ) ? 'verified' : 'constant_conflict';
				$results[ $key ]  = $result;
				continue;
			}

			update_option( dtb_qbo_option_name( 'item_' . $key . '_id' ), $result['id'], false );
			update_option( dtb_qbo_option_name( 'item_' . $key . '_name' ), $result['name'], false );
			$result['status'] = 'mapped';
			$result['source'] = 'managed';
			$results[ $key ]  = $result;
		}

		$ready = true;
		foreach ( $results as $result ) {
			if ( ! in_array( $result['status'], [ 'mapped', 'verified' ], true ) ) {
				$ready = false;
				break;
			}
		}

		if ( function_exists( 'dtb_ops_audit_log' ) ) {
			dtb_ops_audit_log(
				'qbo_item_mapping_discovered',
				[
					'environment' => dtb_qbo_environment(),
					'ready'       => $ready,
					'statuses'    => array_map( static fn( array $item ): string => (string) $item['status'], $results ),
				]
			);
		}

		return [
			'ok'          => true,
			'environment' => dtb_qbo_environment(),
			'ready'       => $ready,
			'items'       => $results,
			'mappings'    => self::status(),
		];
	}
}
