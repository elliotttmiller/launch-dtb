import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const portalPath = new URL('../src/pages/ReturnPortal.jsx', import.meta.url);
const servicePath = new URL('../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Services/PublicReturnAccessService.php', import.meta.url);
const controllerPath = new URL('../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Rest/PublicReturnsController.php', import.meta.url);
const repositoryPath = new URL('../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-returns/Infrastructure/ReturnRepository.php', import.meta.url);

const [portal, service, controller, repository] = await Promise.all([
  readFile(portalPath, 'utf8'),
  readFile(servicePath, 'utf8'),
  readFile(controllerPath, 'utf8'),
  readFile(repositoryPath, 'utf8'),
]);

test('public lookup requires order number and checkout email and never supports name-only search', () => {
  assert.match(controller, /\/returns\/lookup/);
  assert.match(controller, /'order_number'[\s\S]*'required'\s*=>\s*true/);
  assert.match(controller, /'customer_email'[\s\S]*'required'\s*=>\s*true/);
  assert.doesNotMatch(controller, /'customer_name'\s*=>/);
  assert.match(portal, /both the order number and checkout email must match/i);
});

test('WooCommerce remains authoritative for line identity and eligibility projection', () => {
  assert.match(service, /get_items\( 'line_item' \)/);
  assert.match(service, /get_qty_refunded_for_item/);
  assert.match(service, /dtb_returns_public_item_projection/);
  assert.match(portal, /returnable_quantity/);
  assert.match(portal, /eligible_for_request/);
});

test('verified requests use short-lived tokens, explicit order lines and idempotency', () => {
  assert.match(service, /dtb_returns_generate_lookup_token/);
  assert.match(service, /hash_hmac\( 'sha256'/);
  assert.match(controller, /\/returns\/request\/verified/);
  assert.match(controller, /'idempotency_key'/);
  assert.match(controller, /dtb_returns_find_by_idempotency_key/);
  assert.match(controller, /dtb_returns_validate_requested_items/);
  assert.match(repository, /_dtb_return_items/);
  assert.match(repository, /_dtb_return_idempotency_key/);
});

test('portal preserves distinct standard, order-problem and product-problem paths', () => {
  assert.match(portal, /standard_return/);
  assert.match(portal, /order_problem/);
  assert.match(portal, /product_problem/);
  assert.match(portal, /Arrived damaged/);
  assert.match(portal, /Wrong item received/);
  assert.match(portal, /Defective \/ not working/);
});

test('portal does not invite unauthorized shipping or public evidence uploads', () => {
  assert.match(portal, /Do not ship anything until the request is approved/i);
  assert.match(portal, /does not upload customer evidence into the general WordPress media library/i);
  assert.doesNotMatch(portal, /type="file"/);
});

test('customer policy copy remains linked to the dedicated policy surface', () => {
  assert.match(portal, /to="\/return-policy"/);
  assert.match(portal, /What happens next/);
  assert.match(portal, /Before you ship/);
});
