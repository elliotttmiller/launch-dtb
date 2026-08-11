/**
 * frontend/src/hooks/useWishlist.js
 *
 * Lightweight, device-local "favorite" list for product cards. Intentionally
 * client-only for this pass — no backend/API call, no account sync. Backed
 * by localStorage (array of product IDs) so it persists across sessions on
 * the same device/browser, matching the read/write shape of
 * `dtb-catalog-display-mode` elsewhere in this codebase.
 *
 * Note: cart state in this app is server-side per logged-in customer
 * (see `context/CartContext`), so a device-only wishlist is a UX
 * inconsistency worth a follow-up if the product wants wishlist parity
 * with cart persistence across devices/logins.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'dtb-wishlist-ids';

function readStoredIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently,
    // wishlist state just won't persist for this session.
  }
}

// The native `storage` event only fires in *other* tabs/documents, never in
// the one that made the write — so two card instances for the same product
// on one page (e.g. a rail + the grid below it) would drift out of sync
// without this same-document pub-sub layer.
const listeners = new Set();

function notifyListeners(ids) {
  listeners.forEach((listener) => listener(ids));
}

export function useWishlist() {
  const [ids, setIds] = useState(() => readStoredIds());

  useEffect(() => {
    listeners.add(setIds);
    return () => listeners.delete(setIds);
  }, []);

  // Keep in sync if the wishlist is toggled from another tab/window.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key !== STORAGE_KEY) return;
      setIds(readStoredIds());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isWishlisted = useCallback((productId) => ids.includes(String(productId)), [ids]);

  const toggleWishlist = useCallback((productId) => {
    const id = String(productId);
    const current = readStoredIds();
    const next = current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id];
    writeStoredIds(next);
    notifyListeners(next);
  }, []);

  return { wishlistIds: ids, isWishlisted, toggleWishlist };
}

export default useWishlist;
