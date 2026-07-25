/**
 * Real-time order status subscription over bounded, reconnecting SSE requests.
 * The owning page keeps its normal snapshot polling as a low-frequency fallback.
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { getOrderEventStreamUrl, ORDER_TERMINAL_STATUSES } from '../api/orders.js';

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2_000;

export function useOrderEventStream(orderId, orderKey = '') {
  const [events, setEvents] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const esRef = useRef(null);
  const attemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const openStreamRef = useRef(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    clearReconnectTimer();
  }, [clearReconnectTimer]);

  const ingest = useCallback((message, forcedType = '') => {
    try {
      const event = JSON.parse(message.data);
      if (forcedType && !event.type) event.type = forcedType;
      mergeEvents(setEvents, [event]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dtb:order-stream-update', { detail: { orderId: String(orderId), event } }));
      }
      if (event.is_terminal || ORDER_TERMINAL_STATUSES.includes(event.status)) {
        teardown();
        setStreaming(false);
      }
    } catch {
      setError('Order update stream returned invalid data.');
    }
  }, [orderId, teardown]);

  const openStream = useCallback(() => {
    if (!orderId || typeof EventSource === 'undefined') {
      setStreaming(false);
      return;
    }

    teardown();
    const source = new EventSource(getOrderEventStreamUrl(orderId, orderKey));
    esRef.current = source;

    source.onopen = () => {
      if (cancelledRef.current) return;
      attemptsRef.current = 0;
      setStreaming(true);
      setError(null);
    };
    source.onmessage = (message) => ingest(message);
    source.addEventListener('order.status_changed', (message) => ingest(message, 'order.status_changed'));
    source.addEventListener('order.terminal', (message) => ingest(message, 'order.terminal'));

    source.onerror = () => {
      if (cancelledRef.current) return;
      teardown();
      setStreaming(false);
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        setError('Live order updates are unavailable. Snapshot polling remains active.');
        return;
      }
      const delay = Math.min(30_000, BASE_BACKOFF_MS * (2 ** (attemptsRef.current - 1)));
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!cancelledRef.current) openStreamRef.current?.();
      }, delay);
    };
  }, [ingest, orderId, orderKey, teardown]);

  useLayoutEffect(() => {
    openStreamRef.current = openStream;
  }, [openStream]);

  useEffect(() => {
    cancelledRef.current = false;
    if (orderId) openStream();
    return () => {
      cancelledRef.current = true;
      teardown();
    };
  }, [openStream, orderId, teardown]);

  const latestEvent = useMemo(() => events.at(-1) || null, [events]);
  return { events, latestEvent, streaming, error };
}

function mergeEvents(setEvents, incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  setEvents((previous) => {
    const seen = new Set(previous.map(eventKey));
    const next = incoming.filter((event) => !seen.has(eventKey(event)));
    if (next.length === 0) return previous;
    return [...previous, ...next].sort((left, right) => new Date(left.occurred_at) - new Date(right.occurred_at));
  });
}

function eventKey(event) {
  return `${event.id || ''}|${event.type || ''}|${event.occurred_at || ''}|${event.status || ''}`;
}

export default useOrderEventStream;
