/**
 * frontend/src/hooks/useSchematicDetail.js
 *
 * Fetches the full detail record for one schematic (pages, hotspot
 * datasets, resolved parts) and exposes explicit loading/refreshing/
 * success/not-found/error states.
 *
 * This is the single source of truth for deep-link resolution: given only
 * a schematic ID from the URL, brand/category/title/pages are derived from
 * this response — no local mapping table required.
 */

import { useEffect, useState } from 'react';
import { fetchSchematicDetail, SchematicApiError } from '../api/schematicsApi.js';

/**
 * @typedef {'idle'|'loading'|'refreshing'|'success'|'not_found'|'error'} SchematicDetailStatus
 */

export function useSchematicDetail(schematicId) {
  const [status, setStatus] = useState(schematicId ? 'loading' : 'idle');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [hadDetail, setHadDetail] = useState(false);
  const [prevId, setPrevId] = useState(schematicId);

  // "Adjusting state when a prop changes" pattern: react synchronously
  // during render (not inside an effect) whenever the requested schematic
  // ID changes, so the loading/idle transition is visible on the very next
  // paint instead of a follow-up effect-triggered render.
  if (prevId !== schematicId) {
    setPrevId(schematicId);
    if (!schematicId) {
      setStatus('idle');
      setDetail(null);
      setError(null);
      setHadDetail(false);
    } else {
      setStatus(hadDetail ? 'refreshing' : 'loading');
    }
  }

  useEffect(() => {
    if (!schematicId) return undefined;

    const controller = new AbortController();

    fetchSchematicDetail(schematicId, { signal: controller.signal })
      .then((body) => {
        if (controller.signal.aborted) return;
        setDetail(body);
        setHadDetail(true);
        setStatus('success');
        setError(null);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setHadDetail(false);
        setDetail(null);
        if (err instanceof SchematicApiError && err.kind === 'not_found') {
          setStatus('not_found');
          setError(null);
          return;
        }
        setStatus('error');
        setError(
          err instanceof SchematicApiError
            ? err.message
            : 'This schematic could not be loaded.',
        );
      });

    return () => controller.abort();
  }, [schematicId]);

  return { status, detail, error };
}
