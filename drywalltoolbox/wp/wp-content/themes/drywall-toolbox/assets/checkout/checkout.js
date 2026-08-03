/**
 * Drywall Toolbox checkout compatibility stub.
 *
 * The former mobile wizard classified, hid and reordered native WooCommerce
 * Checkout Block regions at runtime. That behavior is retired. WooCommerce now
 * owns checkout rendering, responsive layout, validation discovery and focus
 * order without DTB DOM manipulation.
 *
 * This temporary no-op file preserves the existing registered script handle
 * during the architecture migration. Remove the enqueue and this file together
 * in a later dependency-cleanup change after production acceptance confirms no
 * external code depends on the handle.
 */
( function () {
	'use strict';
}() );
