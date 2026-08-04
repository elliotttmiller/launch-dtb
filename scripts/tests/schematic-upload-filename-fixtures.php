<?php
/**
 * Focused regression fixtures for schematic upload filename resolution.
 *
 * Run: php scripts/tests/schematic-upload-filename-fixtures.php
 */

define( 'ABSPATH', __DIR__ );

class WP_Error {
	private string $code;
	private string $message;

	public function __construct( string $code, string $message ) {
		$this->code    = $code;
		$this->message = $message;
	}

	public function get_error_code(): string {
		return $this->code;
	}

	public function get_error_message(): string {
		return $this->message;
	}
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function sanitize_key( $value ): string {
	return strtolower( preg_replace( '/[^a-z0-9_\-]/', '', (string) $value ) );
}

function absint( $value ): int {
	return abs( (int) $value );
}

function add_action(): void {}

function get_posts(): array {
	return [];
}

require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php';
require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Application/RegisterSchematicUploads.php';

$fixtures = [
	'columbia-180-grip-flat-box-handle-sch-schematic-page-01.webp' => [ 'columbia-flat-box-handle', '1' ],
	'columbia-automatic-taper-predator-carbon-fiber-53-ptaper-predatortaper-head-sch-schematic-page-01.webp' => [ 'columbia-predator-taper', '2' ],
	'columbia-matrix-box-handle-matrixboxhandle-extensionhousing-sch-schematic-page-01.webp' => [ 'columbia-matrix', '5' ],
	'platinum_compound_pump-page-001.webp' => [ 'platinum-compound-pump', '1' ],
	'Platinum_Flat_Box-page-001.webp' => [ 'platinum-flat-box', '1' ],
	'tapetech-90-inside-corner-edger-tapetech-42tt-sch-schematic-page-001.webp' => [ 'tapetech-42tt', '1' ],
	'tapetech-tapetech-lock-block-for-07tt-050212f-sch-schematic-page-001.webp' => [ 'tapetech-07tt', '1' ],
	'tapetech-tapetech-lock-block-for-07tt-050212f-sch-schematic-page-002.webp' => [ 'tapetech-07tt', '2' ],
	'tapetech-tapetech-lock-block-for-07tt-050212f-sch-schematic-page-003.webp' => [ 'tapetech-07tt', '3' ],
	'tapetech-tapetech-lock-block-for-07tt-050212f-sch-schematic-page-004.webp' => [ 'tapetech-07tt', '4' ],
	'07TT_SCH-page-2.webp' => [ 'tapetech-07tt', '2' ],
];

$failures = [];
foreach ( $fixtures as $filename => [ $schematic_id, $page ] ) {
	$actual = dtb_schematics_parse_upload_filename( $filename );
	if ( is_wp_error( $actual ) || $schematic_id !== $actual['schematic_id'] || $page !== $actual['page'] ) {
		$failures[] = $filename;
	}
}

$unknown = dtb_schematics_parse_upload_filename( 'UNKNOWN-SKU_SCH-page-1.webp' );
if ( ! is_wp_error( $unknown ) || 'dtb_unknown_schematic_sku' !== $unknown->get_error_code() ) {
	$failures[] = 'unknown SKU diagnostic';
}

$additional_count = 0;
foreach ( array_slice( $argv, 1 ) as $filename ) {
	$additional_count++;
	if ( is_wp_error( dtb_schematics_parse_upload_filename( $filename ) ) ) {
		$failures[] = $filename;
	}
}

if ( $failures ) {
	fwrite( STDERR, 'FAIL: ' . implode( ', ', $failures ) . PHP_EOL );
	exit( 1 );
}

echo 'PASS: ' . count( $fixtures ) . ' fixtures, ' . $additional_count . ' additional filenames, plus unknown-SKU diagnostic.' . PHP_EOL;
