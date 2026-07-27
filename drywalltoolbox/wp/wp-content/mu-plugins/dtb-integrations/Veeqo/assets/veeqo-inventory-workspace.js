/* global wp, DTBVeeqoAdmin */
(() => {
  'use strict';

  const config = window.DTBVeeqoAdmin || {};
  const apiFetch = window.wp && window.wp.apiFetch;
  if (!apiFetch) return;

  const base = config.basePath || '/dtb/v1/veeqo/admin/control-center';
  const state = {
    page: 1,
    per_page: 50,
    search: '',
    stock_status: '',
    mapping: '',
    type: '',
    orderby: 'sku',
    order: 'asc',
    selected: new Set(),
    data: null,
    mounted: false,
  };

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const fmt = (value) => value == null ? '—' : new Intl.NumberFormat(config.locale || undefined).format(Number(value));
  const date = (value) => value ? new Intl.DateTimeFormat(config.locale || undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  const request = (suffix, options = {}) => apiFetch({ path: `${base}${suffix}`, ...options });
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function queryString() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (['selected', 'data', 'mounted'].includes(key)) return;
      if (value !== '' && value != null) params.set(key, String(value));
    });
    return `?${params.toString()}`;
  }

  function isInventoryView() {
    const active = qs('.dtb-veeqo-nav [aria-current="page"], .dtb-veeqo-nav .is-active');
    return active && /inventory/i.test(active.textContent || '');
  }

  async function load() {
    const view = qs('#dtb-veeqo-view');
    if (!view || !isInventoryView()) return;
    view.innerHTML = '<div class="dtb-veeqo-workspace-loading"><span class="spinner is-active"></span> Loading inventory workspace…</div>';
    try {
      state.data = await request(`/inventory${queryString()}`);
      render();
    } catch (error) {
      view.innerHTML = `<div class="notice notice-error"><p>${esc(error.message || 'Unable to load inventory workspace.')}</p></div>`;
    }
  }

  function sortHeader(label, key, number = false) {
    const active = state.orderby === key;
    const symbol = active ? (state.order === 'asc' ? '▲' : '▼') : '↕';
    return `<th class="${number ? 'dtb-veeqo-number' : ''}"><button type="button" class="dtb-veeqo-sort" data-sort="${esc(key)}" aria-sort="${active ? (state.order === 'asc' ? 'ascending' : 'descending') : 'none'}">${esc(label)} <span>${symbol}</span></button></th>`;
  }

  function render() {
    const view = qs('#dtb-veeqo-view');
    if (!view || !state.data) return;
    const items = state.data.items || [];
    const allSelected = items.length > 0 && items.every((item) => state.selected.has(Number(item.product_id)));
    view.innerHTML = `
      <section class="dtb-veeqo-inventory-workspace">
        <form id="dtb-veeqo-workspace-filters" class="dtb-veeqo-toolbar dtb-veeqo-workspace-toolbar">
          <label class="dtb-veeqo-search"><span class="screen-reader-text">Search inventory</span><input name="search" value="${esc(state.search)}" placeholder="Search product name or SKU"></label>
          ${select('stock_status', state.stock_status, [['','All stock'],['instock','In stock'],['lowstock','Low stock'],['outofstock','Out of stock'],['onbackorder','Backorder'],['negative','Negative available'],['committed_exceeds_on_hand','Committed exceeds on hand']])}
          ${select('mapping', state.mapping, [['','All mappings'],['mapped','Mapped'],['unmapped','Unmapped'],['mismatch','Mismatch']])}
          ${select('type', state.type, [['','All product types'],['simple','Simple'],['variation','Variation']])}
          ${select('per_page', state.per_page, [[25,'25 / page'],[50,'50 / page'],[100,'100 / page']])}
          <button class="dtb-veeqo-button" type="submit">Filter</button>
          <button class="dtb-veeqo-button" type="button" data-workspace-action="clear">Clear</button>
          <span class="dtb-veeqo-results-meta">${fmt(state.data.total)} variants</span>
        </form>
        <div class="dtb-veeqo-selection-bar ${state.selected.size ? 'is-visible' : ''}">
          <strong>${fmt(state.selected.size)} selected</strong>
          <button type="button" class="dtb-veeqo-button is-primary" data-workspace-action="bulk-edit">Edit fields</button>
          <button type="button" class="dtb-veeqo-button" data-workspace-action="export">Export selected</button>
          <button type="button" class="dtb-veeqo-button" data-workspace-action="clear-selection">Clear selection</button>
          <span>Inventory quantities and identifiers remain read-only.</span>
        </div>
        <div class="dtb-veeqo-table-wrap"><table class="dtb-veeqo-table dtb-veeqo-workspace-table">
          <thead><tr>
            <th><input type="checkbox" data-select-page ${allSelected ? 'checked' : ''} aria-label="Select current page"></th>
            ${sortHeader('Product','name')}${sortHeader('SKU','sku')}<th>Location</th>${sortHeader('On hand','on_hand',true)}${sortHeader('Committed','committed',true)}${sortHeader('Available','available',true)}${sortHeader('Incoming','incoming',true)}${sortHeader('Mapping','mapping')}${sortHeader('Updated','updated')}<th></th>
          </tr></thead>
          <tbody>${rows(items)}</tbody>
        </table></div>
        ${pagination()}
      </section>
      <div id="dtb-veeqo-workspace-overlay"></div>`;
    bind();
  }

  function select(name, current, options) {
    return `<select class="dtb-veeqo-filter" name="${esc(name)}">${options.map(([value, label]) => `<option value="${esc(value)}" ${String(value) === String(current) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
  }

  function rows(items) {
    if (!items.length) return '<tr><td colspan="11"><div class="dtb-veeqo-empty"><strong>No matching inventory</strong>Adjust filters or clear the search.</div></td></tr>';
    return items.map((item) => {
      const selected = state.selected.has(Number(item.product_id));
      const image = item.image_url ? `<img class="dtb-veeqo-thumb" src="${esc(item.image_url)}" alt="">` : '<span class="dtb-veeqo-thumb is-empty">No image</span>';
      const anomaly = (item.anomalies || []).length ? `<span class="dtb-veeqo-anomaly">${esc(item.anomalies.join(', ').replaceAll('_', ' '))}</span>` : '';
      return `<tr class="${selected ? 'is-selected' : ''}">
        <td><input type="checkbox" data-select-product="${Number(item.product_id)}" ${selected ? 'checked' : ''} aria-label="Select ${esc(item.name)}"></td>
        <td><div class="dtb-veeqo-product-cell">${image}<div><button type="button" class="button-link dtb-veeqo-product-name" data-inspect-product="${Number(item.product_id)}">${esc(item.name || '(untitled product)')}</button><span class="dtb-veeqo-secondary">${esc(item.type)} · ${esc(item.publish_status)}</span>${anomaly}</div></div></td>
        <td><button type="button" class="button-link" data-inspect-product="${Number(item.product_id)}">${esc(item.sku)}</button></td>
        <td>${esc(item.location || 'Configured warehouse')}</td>
        <td class="dtb-veeqo-number">${fmt(item.on_hand)}</td><td class="dtb-veeqo-number">${fmt(item.committed)}</td><td class="dtb-veeqo-number ${Number(item.available) < 0 ? 'is-negative' : ''}">${fmt(item.available)}</td><td class="dtb-veeqo-number">${fmt(item.incoming)}</td>
        <td><span class="dtb-veeqo-status is-${item.mapping_status === 'mapped' ? 'success' : 'warning'}">${esc(item.mapping_status)}</span></td><td>${date(item.updated_at)}</td>
        <td><button type="button" class="dtb-veeqo-button is-small" data-inspect-product="${Number(item.product_id)}">Inspect</button></td>
      </tr>`;
    }).join('');
  }

  function pagination() {
    const page = Number(state.data.page || 1);
    const pages = Number(state.data.pages || 1);
    return `<div class="dtb-veeqo-pagination"><span>Page ${page} of ${pages}</span><button type="button" class="dtb-veeqo-button is-small" data-page="${Math.max(1,page-1)}" ${page <= 1 ? 'disabled' : ''}>Previous</button><button type="button" class="dtb-veeqo-button is-small" data-page="${Math.min(pages,page+1)}" ${page >= pages ? 'disabled' : ''}>Next</button></div>`;
  }

  function bind() {
    qs('#dtb-veeqo-workspace-filters')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      ['search','stock_status','mapping','type'].forEach((key) => { state[key] = String(data.get(key) || '').trim(); });
      state.per_page = Number(data.get('per_page') || 50);
      state.page = 1;
      state.selected.clear();
      load();
    });
    qsa('[data-sort]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.sort;
      if (state.orderby === key) state.order = state.order === 'asc' ? 'desc' : 'asc';
      else { state.orderby = key; state.order = 'asc'; }
      state.page = 1;
      load();
    }));
    qsa('[data-page]').forEach((button) => button.addEventListener('click', () => { state.page = Number(button.dataset.page || 1); load(); }));
    qs('[data-select-page]')?.addEventListener('change', (event) => {
      (state.data.items || []).forEach((item) => event.target.checked ? state.selected.add(Number(item.product_id)) : state.selected.delete(Number(item.product_id)));
      render();
    });
    qsa('[data-select-product]').forEach((box) => box.addEventListener('change', () => { const id = Number(box.dataset.selectProduct); box.checked ? state.selected.add(id) : state.selected.delete(id); render(); }));
    qsa('[data-inspect-product]').forEach((button) => button.addEventListener('click', () => inspect(Number(button.dataset.inspectProduct))));
    qsa('[data-workspace-action]').forEach((button) => button.addEventListener('click', () => action(button.dataset.workspaceAction)));
  }

  async function inspect(id) {
    const overlay = qs('#dtb-veeqo-workspace-overlay');
    overlay.innerHTML = '<div class="dtb-veeqo-drawer-backdrop"></div><aside class="dtb-veeqo-drawer"><div class="dtb-veeqo-workspace-loading"><span class="spinner is-active"></span> Loading product…</div></aside>';
    try {
      const item = await request(`/inventory/${id}`);
      overlay.innerHTML = `<div class="dtb-veeqo-drawer-backdrop" data-close-drawer></div><aside class="dtb-veeqo-drawer" role="dialog" aria-modal="true" aria-label="Product inspector">
        <header><div><span class="dtb-veeqo-secondary">${esc(item.type)} · ${esc(item.publish_status)}</span><h2>${esc(item.name)}</h2><code>${esc(item.sku)}</code></div><button type="button" class="dtb-veeqo-drawer-close" data-close-drawer aria-label="Close">×</button></header>
        <div class="dtb-veeqo-drawer-body">
          <section><h3>Inventory projection</h3><div class="dtb-veeqo-detail-grid">${detail('Warehouse',item.location)}${detail('On hand',fmt(item.on_hand))}${detail('Committed',fmt(item.committed))}${detail('Available',fmt(item.available))}${detail('Incoming',fmt(item.incoming))}${detail('Stock status',item.stock_status)}</div><p class="description">Veeqo remains authoritative. Quantity fields are intentionally read-only.</p></section>
          <section><h3>Mapping</h3><div class="dtb-veeqo-detail-grid">${detail('Status',item.mapping_status)}${detail('Sellable ID',item.veeqo_sellable_id || '—')}${detail('Mapped SKU',item.veeqo_mapped_sku || '—')}${detail('WooCommerce ID',item.product_id)}</div></section>
          <section><h3>Merchandising</h3><div class="dtb-veeqo-detail-grid">${detail('Visibility',item.catalog_visibility)}${detail('Backorders',item.backorders)}${detail('Low-stock threshold',item.low_stock_amount == null ? 'Inherited' : item.low_stock_amount)}</div></section>
          <section><h3>History</h3>${(item.history || []).map((entry) => `<div class="dtb-veeqo-history-row"><strong>${esc(entry.label)}</strong><span>${date(entry.at)}</span></div>`).join('')}</section>
        </div>
        <footer><a class="dtb-veeqo-button is-primary" href="${esc(item.edit_url)}">Open WooCommerce product</a>${item.parent ? `<a class="dtb-veeqo-button" href="${esc(item.parent.url)}">Open parent</a>` : ''}</footer>
      </aside>`;
      qsa('[data-close-drawer]', overlay).forEach((el) => el.addEventListener('click', () => { overlay.innerHTML = ''; }));
    } catch (error) {
      overlay.innerHTML = '';
      window.alert(error.message || 'Unable to inspect product.');
    }
  }

  function detail(label, value) { return `<div class="dtb-veeqo-detail"><span class="dtb-veeqo-detail-label">${esc(label)}</span><span class="dtb-veeqo-detail-value">${esc(value)}</span></div>`; }

  function action(name) {
    if (name === 'clear') { Object.assign(state, { page:1, search:'', stock_status:'', mapping:'', type:'', orderby:'sku', order:'asc' }); state.selected.clear(); load(); }
    if (name === 'clear-selection') { state.selected.clear(); render(); }
    if (name === 'bulk-edit') bulkEditor();
    if (name === 'export') exportSelected();
  }

  function bulkEditor() {
    if (!state.selected.size) return;
    const overlay = qs('#dtb-veeqo-workspace-overlay');
    overlay.innerHTML = `<div class="dtb-veeqo-modal-backdrop" data-close-modal></div><section class="dtb-veeqo-modal" role="dialog" aria-modal="true" aria-label="Bulk edit products">
      <header><div><h2>Bulk edit ${fmt(state.selected.size)} products</h2><p>Only WooCommerce-owned merchandising fields can be changed here.</p></div><button type="button" data-close-modal>×</button></header>
      <form id="dtb-veeqo-bulk-form"><div class="dtb-veeqo-bulk-grid">
        <label>Status<select name="status"><option value="">No change</option><option value="publish">Publish</option><option value="draft">Draft</option><option value="private">Private</option><option value="pending">Pending review</option></select></label>
        <label>Catalog visibility<select name="catalog_visibility"><option value="">No change</option><option value="visible">Visible</option><option value="catalog">Catalog only</option><option value="search">Search only</option><option value="hidden">Hidden</option></select></label>
        <label>Backorders<select name="backorders"><option value="">No change</option><option value="no">Do not allow</option><option value="notify">Allow, notify customer</option><option value="yes">Allow</option></select></label>
        <label>Low-stock threshold<input type="number" name="low_stock_amount" min="0" max="100000" placeholder="No change"></label>
      </div><div id="dtb-veeqo-bulk-preview"></div><footer><button type="button" class="dtb-veeqo-button" data-close-modal>Cancel</button><button type="submit" class="dtb-veeqo-button is-primary">Preview changes</button></footer></form>
    </section>`;
    qsa('[data-close-modal]', overlay).forEach((el) => el.addEventListener('click', () => { overlay.innerHTML = ''; }));
    qs('#dtb-veeqo-bulk-form', overlay).addEventListener('submit', previewBulk);
  }

  async function previewBulk(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const changes = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== ''));
    const payload = { product_ids: Array.from(state.selected), changes };
    const holder = qs('#dtb-veeqo-bulk-preview');
    holder.innerHTML = '<p>Validating preview…</p>';
    try {
      const preview = await request('/inventory/bulk-preview', { method: 'POST', data: payload });
      holder.innerHTML = `<div class="notice notice-info inline"><p><strong>${fmt(preview.items.length)} valid products.</strong> Review the field changes before applying.</p></div><div class="dtb-veeqo-preview-list">${preview.items.slice(0,20).map((item) => `<div><strong>${esc(item.sku)}</strong><span>${esc(Object.keys(changes).join(', '))}</span></div>`).join('')}</div><button type="button" class="dtb-veeqo-button is-primary" id="dtb-veeqo-apply-bulk">Apply confirmed changes</button>`;
      qs('#dtb-veeqo-apply-bulk').addEventListener('click', async () => {
        if (!window.confirm(`Apply these changes to ${preview.items.length} products?`)) return;
        const result = await request('/inventory/bulk-apply', { method: 'POST', data: { ...payload, preview_hash: preview.preview_hash } });
        window.alert(result.message || 'Bulk update completed.');
        qs('#dtb-veeqo-workspace-overlay').innerHTML = '';
        state.selected.clear();
        load();
      });
    } catch (error) { holder.innerHTML = `<div class="notice notice-error inline"><p>${esc(error.message || 'Preview failed.')}</p></div>`; }
  }

  function exportSelected() {
    const rows = (state.data.items || []).filter((item) => state.selected.has(Number(item.product_id)));
    const csv = [['Product ID','SKU','Product','On hand','Committed','Available','Incoming','Mapping'], ...rows.map((item) => [item.product_id,item.sku,item.name,item.on_hand,item.committed,item.available,item.incoming,item.mapping_status])]
      .map((row) => row.map((value) => `"${String(value == null ? '' : value).replaceAll('"','""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `veeqo-inventory-selection-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const observer = new MutationObserver(() => {
    if (!state.mounted && isInventoryView() && qs('#dtb-veeqo-view .dtb-veeqo-table')) {
      state.mounted = true;
      load();
    }
    if (!isInventoryView()) state.mounted = false;
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
