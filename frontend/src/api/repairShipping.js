import { apiClient } from './client.js';

/**
 * Fetch server-authoritative repair return-shipping options.
 *
 * The backend owns all pricing inputs. `items` is accepted only as a temporary
 * compatibility argument for the existing repair form and is not authoritative.
 *
 * @param {{ address: string, city: string, state: string, zip: string, country: string }} destination
 * @param {Array<object>} [items]
 * @returns {Promise<Array<{ id: string, name: string, price: number, currency: string }>>}
 */
export async function quoteRepairShipping( destination, items = [] ) {
  const response = await apiClient( '/wp-json/dtb/v1/repairs/shipping-quote', {
    method: 'POST',
    body: JSON.stringify( { destination, items } ),
  } );
  const data = response?.data ?? response;
  return Array.isArray( data?.rates ) ? data.rates : [];
}
