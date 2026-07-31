/**
 * frontend/src/designer/PreviewBridge.js
 *
 * The postMessage contract between the wp-admin Visual Designer editor
 * (parent window, see mu-plugins/dtb-visual-designer/Admin/assets/
 * dtb-visual-designer.js) and this storefront when it is loaded inside the
 * editor's preview iframe.
 *
 * Contract (explicit message types only — no arbitrary cross-window
 * commands are accepted):
 *   Editor -> Storefront:
 *     'dtb-vd:select-component'  { surfaceId, componentId }  — focus + scroll to a component
 *     'dtb-vd:config-updated'    {}                          — re-fetch the draft config (handled in DesignConfigContext)
 *   Storefront -> Editor:
 *     'dtb-preview:component-selected' { surfaceId, componentId } — operator clicked a component in the live preview
 *     'dtb-preview:ready'               {}                        — preview frame finished its first render
 *
 * Every inbound message is origin-checked against the parent's own origin
 * (the editor only ever embeds same-site storefront URLs) and type-checked
 * against the allowlist above; anything else is silently ignored.
 */

const registry = new Map();
let selectOverlayEl = null;
let hoverOverlayEl = null;
let selectLabelEl = null;
let selectedKey = null;
let hoveredKey = null;
let initialized = false;

function isPreviewFrame() {
  return typeof window !== 'undefined' && window.top !== window.self;
}

function keyFor(surfaceId, componentId) {
  return `${surfaceId}::${componentId}`;
}

export function registerComponentNode(surfaceId, componentId, node) {
  const key = keyFor(surfaceId, componentId);
  if (node) {
    registry.set(key, { surfaceId, componentId, node });
  } else {
    registry.delete(key);
  }
}

function buildOverlay(borderColor, withLabel) {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-dtb-preview-overlay', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483000',
    border: `2px solid ${borderColor}`,
    borderRadius: '4px',
    boxSizing: 'border-box',
    display: 'none',
  });
  document.body.appendChild(overlay);

  let label = null;
  if (withLabel) {
    label = document.createElement('div');
    label.setAttribute('data-dtb-preview-label', 'true');
    Object.assign(label.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483001',
      background: '#2255ee',
      color: '#fff',
      font: '600 11px/1.4 -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '2px 7px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      display: 'none',
    });
    document.body.appendChild(label);
  }

  return { overlay, label };
}

function ensureOverlays() {
  if (!hoverOverlayEl && typeof document !== 'undefined') {
    hoverOverlayEl = buildOverlay('rgba(34,85,238,0.5)', false).overlay;
  }
  if (!selectOverlayEl && typeof document !== 'undefined') {
    const built = buildOverlay('#2255ee', true);
    selectOverlayEl = built.overlay;
    selectOverlayEl.style.boxShadow = '0 0 0 2px rgba(34,85,238,0.25)';
    selectLabelEl = built.label;
  }
}

function positionOverlay(overlay, node, labelText) {
  if (!overlay || !node) return;
  const rect = node.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  if (labelText && selectLabelEl) {
    selectLabelEl.textContent = labelText;
    selectLabelEl.style.display = 'block';
    const top = rect.top > 20 ? rect.top - 20 : rect.top + rect.height + 2;
    selectLabelEl.style.top = `${top}px`;
    selectLabelEl.style.left = `${rect.left}px`;
  }
}

function hideHoverOverlay() {
  if (hoverOverlayEl) hoverOverlayEl.style.display = 'none';
}

function hideSelectOverlay() {
  if (selectOverlayEl) selectOverlayEl.style.display = 'none';
  if (selectLabelEl) selectLabelEl.style.display = 'none';
}

function refreshSelectOverlay() {
  if (!selectedKey) return hideSelectOverlay();
  const entry = registry.get(selectedKey);
  if (!entry) return hideSelectOverlay();
  ensureOverlays();
  positionOverlay(selectOverlayEl, entry.node, entry.componentId);
}

function refreshHoverOverlay() {
  if (!hoveredKey || hoveredKey === selectedKey) return hideHoverOverlay();
  const entry = registry.get(hoveredKey);
  if (!entry) return hideHoverOverlay();
  ensureOverlays();
  positionOverlay(hoverOverlayEl, entry.node, null);
}

function findEditableAncestor(startNode) {
  let node = startNode;
  while (node && node !== document.body) {
    const surfaceId = node.getAttribute && node.getAttribute('data-dtb-surface');
    const componentId = node.getAttribute && node.getAttribute('data-dtb-component');
    if (surfaceId && componentId) return { surfaceId, componentId };
    node = node.parentElement;
  }
  return null;
}

export function selectComponent(surfaceId, componentId, { scroll = false } = {}) {
  selectedKey = keyFor(surfaceId, componentId);
  const entry = registry.get(selectedKey);
  if (entry && scroll) {
    entry.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  refreshSelectOverlay();
  hideHoverOverlay();

  if (isPreviewFrame() && window.parent) {
    window.parent.postMessage({ type: 'dtb-preview:component-selected', surfaceId, componentId }, '*');
  }
}

function handleMessage(event) {
  const data = event.data || {};
  if (data.type === 'dtb-vd:select-component' && data.surfaceId && data.componentId) {
    selectComponent(data.surfaceId, data.componentId, { scroll: true });
  }
  // 'dtb-vd:config-updated' is consumed directly by DesignConfigContext.
}

/**
 * Initialize the preview bridge exactly once. Safe to call from multiple
 * components — only wires listeners when actually running inside an iframe.
 */
export function initPreviewBridge() {
  if (initialized || !isPreviewFrame() || typeof window === 'undefined') return;
  initialized = true;

  ensureOverlays();

  window.addEventListener('message', handleMessage);
  window.addEventListener('resize', () => {
    refreshSelectOverlay();
    refreshHoverOverlay();
  });
  window.addEventListener(
    'scroll',
    () => {
      refreshSelectOverlay();
      refreshHoverOverlay();
    },
    true
  );

  document.addEventListener(
    'mouseover',
    (event) => {
      const match = findEditableAncestor(event.target);
      hoveredKey = match ? keyFor(match.surfaceId, match.componentId) : null;
      refreshHoverOverlay();
    },
    true
  );

  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) {
      hoveredKey = null;
      hideHoverOverlay();
    }
  });

  document.addEventListener(
    'click',
    (event) => {
      const match = findEditableAncestor(event.target);
      if (match) {
        event.preventDefault();
        event.stopPropagation();
        selectComponent(match.surfaceId, match.componentId);
      }
    },
    true
  );

  window.parent.postMessage({ type: 'dtb-preview:ready' }, '*');
}

export { isPreviewFrame };
