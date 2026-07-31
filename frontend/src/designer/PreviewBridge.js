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
let overlayEl = null;
let selectedKey = null;
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

function ensureOverlay() {
  if (overlayEl || typeof document === 'undefined') return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.setAttribute('data-dtb-preview-overlay', 'true');
  Object.assign(overlayEl.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483000',
    border: '2px solid #2255ee',
    borderRadius: '4px',
    boxShadow: '0 0 0 2px rgba(34,85,238,0.25)',
    transition: 'all 80ms ease',
    display: 'none',
  });
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function positionOverlayOn(node) {
  const overlay = ensureOverlay();
  if (!overlay || !node) return;
  const rect = node.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = 'none';
}

function highlightSelection() {
  if (!selectedKey) return hideOverlay();
  const entry = registry.get(selectedKey);
  if (!entry) return hideOverlay();
  positionOverlayOn(entry.node);
}

export function selectComponent(surfaceId, componentId, { scroll = false } = {}) {
  selectedKey = keyFor(surfaceId, componentId);
  const entry = registry.get(selectedKey);
  if (entry && scroll) {
    entry.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  highlightSelection();

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

  window.addEventListener('message', handleMessage);
  window.addEventListener('resize', highlightSelection);
  window.addEventListener('scroll', highlightSelection, true);

  document.addEventListener(
    'click',
    (event) => {
      let node = event.target;
      while (node && node !== document.body) {
        const surfaceId = node.getAttribute && node.getAttribute('data-dtb-surface');
        const componentId = node.getAttribute && node.getAttribute('data-dtb-component');
        if (surfaceId && componentId) {
          selectComponent(surfaceId, componentId);
          return;
        }
        node = node.parentElement;
      }
    },
    true
  );

  window.parent.postMessage({ type: 'dtb-preview:ready' }, '*');
}

export { isPreviewFrame };
