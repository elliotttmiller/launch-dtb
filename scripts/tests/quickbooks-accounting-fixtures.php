<?php
/**
 * Deterministic QuickBooks accounting arithmetic fixtures.
 *
 * Run: php scripts/tests/quickbooks-accounting-fixtures.php
 */

declare(strict_types=1);

define( 'ABSPATH', __DIR__ );
require_once dirname( __DIR__, 2 ) . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/QuickBooks/Accounting/AccountingMath.php';

$ref    = [ 'value' => '42', 'name' => 'Verified item' ];
$policy = [ 'tax_code_id' => '7', 'tax_code_name' => 'Approved combined tax' ];
$tests  = [
	'coupon is represented once in discounted line totals' => [
		'snapshot' => [ 'expected_total' => 95, 'tax_total' => 5, 'currency' => 'USD', 'lines' => [ [ 'amount' => 90, 'quantity' => 1, 'taxable' => true, 'item_ref' => $ref ] ] ],
		'total' => 95,
	],
	'fee and shipping tax remain in the exact total' => [
		'snapshot' => [ 'expected_total' => 120.25, 'tax_total' => 10.25, 'currency' => 'USD', 'lines' => [ [ 'amount' => 95, 'quantity' => 1, 'taxable' => true, 'item_ref' => $ref ], [ 'amount' => 10, 'quantity' => 1, 'taxable' => true, 'item_ref' => $ref ], [ 'amount' => 5, 'quantity' => 1, 'taxable' => false, 'item_ref' => $ref ] ] ],
		'total' => 120.25,
	],
	'multiple Woo tax rates use the approved transaction tax total' => [
		'snapshot' => [ 'expected_total' => 108.75, 'tax_total' => 8.75, 'currency' => 'USD', 'lines' => [ [ 'amount' => 100, 'quantity' => 2, 'taxable' => true, 'item_ref' => $ref ] ] ],
		'total' => 108.75,
	],
	'partial refund preserves concrete amount and refunded tax' => [
		'snapshot' => [ 'expected_total' => 27.18, 'tax_total' => 2.18, 'currency' => 'USD', 'lines' => [ [ 'amount' => 25, 'quantity' => 1, 'taxable' => true, 'item_ref' => $ref ] ] ],
		'total' => 27.18,
	],
	'quantity rounding does not change the authoritative line amount' => [
		'snapshot' => [ 'expected_total' => 10, 'tax_total' => 0, 'currency' => 'USD', 'lines' => [ [ 'amount' => 10, 'quantity' => 3, 'taxable' => false, 'item_ref' => $ref ] ] ],
		'total' => 10,
	],
	'guest order arithmetic has no customer dependency' => [
		'snapshot' => [ 'expected_total' => 14, 'tax_total' => 0, 'currency' => 'USD', 'guest' => true, 'lines' => [ [ 'amount' => 14, 'quantity' => 1, 'taxable' => false, 'item_ref' => $ref ] ] ],
		'total' => 14,
	],
	'multiple currencies preserve the source currency' => [
		'snapshot' => [ 'expected_total' => 83.47, 'tax_total' => 3.47, 'currency' => 'CAD', 'lines' => [ [ 'amount' => 80, 'quantity' => 1, 'taxable' => true, 'item_ref' => $ref ] ] ],
		'total' => 83.47, 'currency' => 'CAD',
	],
];

$failures = [];
foreach ( $tests as $name => $fixture ) {
	$result = DTB_QBO_AccountingMath::compose( $fixture['snapshot'], $policy );
	if ( empty( $result['ok'] ) || ! DTB_QBO_AccountingMath::same_money( $result['payload_total'], $fixture['total'] ) ) {
		$failures[] = $name . ': ' . implode( ' ', $result['errors'] );
	}
	if ( isset( $fixture['currency'] ) && $fixture['currency'] !== ( $result['body']['CurrencyRef']['value'] ?? '' ) ) {
		$failures[] = $name . ': currency mismatch';
	}
}

$invalid = DTB_QBO_AccountingMath::compose(
	[ 'expected_total' => 10.01, 'tax_total' => 0, 'currency' => 'USD', 'lines' => [ [ 'amount' => 10, 'quantity' => 1, 'taxable' => false, 'item_ref' => $ref ] ] ],
	$policy
);
if ( ! empty( $invalid['ok'] ) || ! in_array( 'Accounting total invariant failed: WooCommerce 10.01 does not equal QuickBooks payload 10.00.', $invalid['errors'], true ) ) {
	$failures[] = 'mismatched totals must fail closed';
}

if ( $failures ) {
	fwrite( STDERR, "QuickBooks fixtures failed:\n- " . implode( "\n- ", $failures ) . "\n" );
	exit( 1 );
}
echo 'QuickBooks accounting fixtures passed: ' . count( $tests ) . " valid + 1 invariant failure.\n";
