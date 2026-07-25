/**
 * Fetches a repair status snapshot, subscribes to bounded SSE updates, and
 * retains 20-second polling as the fallback/recovery path.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getRepairStatus,
  getRepairEventStreamUrl,
  TERMINAL_STATUSES,
} from '../api/repairs.js';

const POLL_INTERVAL_MS = 20_000;

export function useRepairStatus(repairId, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const cancelledRef = useRef(false);
  const dataRef = useRef(null);
  const requestRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }, []);

  const isTerminal = useCallback((statusData) => Boolean(
    statusData && TERMINAL_STATUSES.includes(statusData.status)
  ), []);

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (!repairId) return;
    const requestId = ++requestRef.current;
    if (isManualRefresh) clearTimer();
    setLoading((previous) => (isManualRefresh || dataRef.current === null ? true : previous));
    setError(null);

    try {
      const result = await getRepairStatus(repairId, token);
      if (cancelledRef.current || requestId !== requestRef.current) return;
      dataRef.current = result;
      setData(result);
      setLoading(false);
      clearTimer();
      if (isTerminal(result)) {
        closeStream();
      } else {
        timerRef.current = window.setTimeout(() => {
          if (!cancelledRef.current) fetchStatus(false);
        }, POLL_INTERVAL_MS);
      }
    } catch (fetchError) {
      if (cancelledRef.current || requestId !== requestRef.current) return;
      setError(fetchError.message || 'Failed to load repair status.');
      setLoading(false);
      clearTimer();
      if (!isTerminal(dataRef.current)) {
        timerRef.current = window.setTimeout(() => {
          if (!cancelledRef.current) fetchStatus(false);
        }, POLL_INTERVAL_MS);
      }
    }
  }, [clearTimer, closeStream, isTerminal, repairId, token]);

  useEffect(() => {
    cancelledRef.current = false;
    if (repairId) fetchStatus(false);

    if (repairId && token && typeof EventSource !== 'undefined') {
      const stream = new EventSource(getRepairEventStreamUrl(repairId, token));
      streamRef.current = stream;
      const refreshFromEvent = () => {
        if (!cancelledRef.current) {
          clearTimer();
          fetchStatus(false);
        }
      };
      stream.addEventListener('repair.update', refreshFromEvent);
      stream.addEventListener('repair.terminal', refreshFromEvent);
      stream.onmessage = refreshFromEvent;
    }

    const handleAuthExpired = () => {
      clearTimer();
      closeStream();
      setError('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      cancelledRef.current = true;
      requestRef.current += 1;
      clearTimer();
      closeStream();
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [clearTimer, closeStream, fetchStatus, repairId, token]);

  const refresh = useCallback(() => fetchStatus(true), [fetchStatus]);
  return { data, loading, error, refresh };
}

export default useRepairStatus;
