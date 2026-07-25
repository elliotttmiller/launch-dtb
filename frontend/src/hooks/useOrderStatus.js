/**
 * Fetches the order tracking snapshot, polls as a fallback, and refreshes
 * immediately when the SSE subscriber reports a new provider/order event.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrderTracking, ORDER_TERMINAL_STATUSES } from '../api/orders.js';

const POLL_INTERVAL_MS = 20_000;

export function useOrderStatus(orderId, orderKey = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const dataRef = useRef(null);
  const requestRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const isTerminal = useCallback((statusData) => Boolean(
    statusData && ORDER_TERMINAL_STATUSES.includes(statusData.status)
  ), []);

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (!orderId) return;
    const requestId = ++requestRef.current;
    if (isManualRefresh) clearTimer();
    setLoading((previous) => (isManualRefresh || dataRef.current === null ? true : previous));
    setError(null);

    try {
      const result = await getOrderTracking(orderId, orderKey);
      if (cancelledRef.current || requestId !== requestRef.current) return;
      dataRef.current = result;
      setData(result);
      setLoading(false);
      clearTimer();
      if (!isTerminal(result)) {
        timerRef.current = window.setTimeout(() => {
          if (!cancelledRef.current) fetchStatus(false);
        }, POLL_INTERVAL_MS);
      }
    } catch (fetchError) {
      if (cancelledRef.current || requestId !== requestRef.current) return;
      setError(fetchError.message || 'Failed to load order status.');
      setLoading(false);
      clearTimer();
      if (!isTerminal(dataRef.current)) {
        timerRef.current = window.setTimeout(() => {
          if (!cancelledRef.current) fetchStatus(false);
        }, POLL_INTERVAL_MS);
      }
    }
  }, [clearTimer, isTerminal, orderId, orderKey]);

  useEffect(() => {
    cancelledRef.current = false;
    if (orderId) fetchStatus(false);

    const handleAuthExpired = () => {
      clearTimer();
      setError('Your session has expired. Please log in again.');
    };
    const handleStreamUpdate = (streamEvent) => {
      if (String(streamEvent?.detail?.orderId || '') !== String(orderId || '')) return;
      clearTimer();
      fetchStatus(false);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('dtb:order-stream-update', handleStreamUpdate);
    return () => {
      cancelledRef.current = true;
      requestRef.current += 1;
      clearTimer();
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('dtb:order-stream-update', handleStreamUpdate);
    };
  }, [clearTimer, fetchStatus, orderId]);

  const refresh = useCallback(() => fetchStatus(true), [fetchStatus]);
  return { data, loading, error, refresh };
}

export default useOrderStatus;
