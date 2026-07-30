(() => {
	'use strict';
	const config = window.DTBQuickBooksAdmin;
	const root = document.getElementById('dtb-qbo-admin-root');
	if (!config || !root) return;

	const state = { active: 'overview', page: 1, busy: false, timer: null, controller: null, failures: 0, dashboard: null };
	const q = (selector, context = root) => context.querySelector(selector);
	const qa = (selector, context = root) => Array.from(context.querySelectorAll(selector));
	const endpoint = (path) => `${String(config.restRoot || '').replace(/\/?$/, '/')}${String(config.basePath || '').replace(/^\//, '').replace(/\/$/, '')}${path}`;
	const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
	const formatDate = (value) => {
		if (!value) return '—';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
	};
	const money = (value, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(Number(value || 0));
	const badge = (value) => `<span class="dtb-qbo-badge is-${esc(value || 'unknown')}">${esc(value || 'unknown')}</span>`;

	async function api(path, options = {}) {
		if (state.controller) state.controller.abort();
		state.controller = new AbortController();
		const response = await fetch(endpoint(path), {
			method: options.method || 'GET', credentials: 'same-origin', cache: 'no-store', signal: state.controller.signal,
			headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
			body: options.body ? JSON.stringify(options.body) : undefined,
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(payload.message || `QuickBooks request failed (${response.status}).`);
		return payload;
	}

	function setBusy(busy) {
		state.busy = busy;
		root.classList.toggle('is-busy', busy);
		root.setAttribute('aria-busy', busy ? 'true' : 'false');
		qa('[data-qbo-action]').forEach((el) => { el.disabled = busy; });
	}

	function showAlert(message, tone = 'info') {
		const el = q('[data-qbo-alert]');
		if (!el) return;
		el.hidden = !message;
		el.className = `dtb-qbo-alert is-${tone}`;
		el.textContent = message || '';
	}

	function table(headers, rows) {
		if (!rows.length) return '<div class="dtb-qbo-empty">No records are available for this view.</div>';
		return `<div class="dtb-qbo-table-wrap"><table class="dtb-qbo-table"><thead><tr>${headers.map((h) => `<th>${esc(h.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${h.render ? h.render(row) : esc(row[h.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
	}

	const schemas = {
		overview: [
			{ label: 'Order', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.number)}</a><small>${esc(r.docNumber)}</small>` },
			{ label: 'Customer', render: (r) => `${esc(r.customer || 'Guest')}<small>${esc(r.email)}</small>` },
			{ label: 'Total', render: (r) => money(r.total, r.currency) },
			{ label: 'Projection', render: (r) => badge(r.state) },
			{ label: 'Created', render: (r) => formatDate(r.date) },
		],
		transactions: [
			{ label: 'Order', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.number)}</a><small>${esc(r.docNumber)}</small>` },
			{ label: 'Customer', render: (r) => `${esc(r.customer || 'Guest')}<small>${esc(r.email)}</small>` },
			{ label: 'Amount', render: (r) => money(r.total, r.currency) },
			{ label: 'Woo status', key: 'orderStatus' },
			{ label: 'QuickBooks', render: (r) => badge(r.state) },
			{ label: 'Entity ID', render: (r) => `<code>${esc(r.entityId || '—')}</code>` },
		],
		refunds: [
			{ label: 'Refund', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.id)}</a><small>Order #${esc(r.orderNumber)}</small>` },
			{ label: 'Amount', render: (r) => money(r.amount, r.currency) },
			{ label: 'Reason', key: 'reason' },
			{ label: 'Projection', render: (r) => badge(r.state) },
			{ label: 'Entity ID', render: (r) => `<code>${esc(r.entityId || '—')}</code>` },
			{ label: 'Created', render: (r) => formatDate(r.date) },
		],
		customers: [
			{ label: 'Customer', render: (r) => `${esc(r.name || 'Guest')}<small>${esc(r.email)}</small>` },
			{ label: 'Orders', key: 'orders' },
			{ label: 'Revenue', render: (r) => money(r.total) },
			{ label: 'QuickBooks', render: (r) => badge(r.state) },
			{ label: 'Entity ID', render: (r) => `<code>${esc(r.entityId || '—')}</code>` },
			{ label: 'Last order', render: (r) => formatDate(r.lastOrder) },
		],
		reconciliation: [
			{ label: 'Order', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.number)}</a>` },
			{ label: 'Document', key: 'docNumber' },
			{ label: 'Amount', render: (r) => money(r.total, r.currency) },
			{ label: 'State', render: (r) => badge(r.state) },
			{ label: 'Paid', render: (r) => r.paid ? 'Yes' : 'No' },
			{ label: 'Created', render: (r) => formatDate(r.date) },
		],
		activity: [
			{ label: 'Hook', render: (r) => `<code>${esc(r.hook)}</code>` },
			{ label: 'Status', render: (r) => badge(r.status) },
			{ label: 'Scheduled', render: (r) => formatDate(r.date) },
		],
	};

	function renderPagination(data) {
		const host = q(`[data-qbo-panel="${state.active}"] [data-qbo-pagination]`);
		if (!host || !data || !data.pages || data.pages <= 1) { if (host) host.hidden = true; return; }
		host.hidden = false;
		host.innerHTML = `<button class="button" data-qbo-page="${Math.max(1, data.page - 1)}" ${data.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${data.page} of ${data.pages}${data.truncated ? ' · bounded scan' : ''}</span><button class="button" data-qbo-page="${Math.min(data.pages, data.page + 1)}" ${data.page >= data.pages ? 'disabled' : ''}>Next</button>`;
	}

	function renderOverview(data) {
		const metrics = data.metrics || {};
		const host = q('[data-qbo-panel="overview"] [data-qbo-kpis]');
		if (host) {
			host.hidden = false;
			host.innerHTML = [
				['Gross sampled', money(metrics.gross, metrics.currency)], ['Refunded sampled', money(metrics.refunded, metrics.currency)],
				['Eligible', metrics.eligible || 0], ['Synced', metrics.synced || 0], ['Pending', metrics.pending || 0],
				['Failed', metrics.failed || 0], ['Sync rate', `${Number(metrics.syncRate || 0).toFixed(1)}%`], ['Sample size', metrics.sampleSize || 0],
			].map(([label, value]) => `<article class="dtb-qbo-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join('');
		}
	}

	function renderView(view, payload) {
		const data = payload.data || {};
		if (view === 'overview') renderOverview(data);
		const host = q(`[data-qbo-table="${view}"]`);
		if (host) host.innerHTML = table(schemas[view] || [], data.rows || data.latest || []);
		renderPagination(data);
		const updated = q('[data-qbo-last-refresh]');
		if (updated) updated.textContent = `Updated ${formatDate(payload.generatedAt)}${data.cached ? ' · cached' : ''}`;
	}

	async function loadDashboard() {
		const dashboard = await api('/dashboard');
		state.dashboard = dashboard;
		const checks = Object.values(dashboard.readiness?.checks || {});
		const complete = checks.filter((item) => item.complete).length;
		const text = (selector, value) => { const el = q(selector); if (el) el.textContent = value; };
		text('[data-qbo-company]', dashboard.company?.name || 'Not connected');
		text('[data-qbo-environment]', String(dashboard.status?.environment || config.environment || '—').toUpperCase());
		text('[data-qbo-realm]', dashboard.company?.realmSuffix ? `••••${dashboard.company.realmSuffix}` : '—');
		text('[data-qbo-token]', formatDate(dashboard.token?.expiresAtIso));
		text('[data-qbo-verified]', formatDate(dashboard.company?.verifiedAt));
		text('[data-qbo-redirect]', dashboard.status?.redirect_uri || '—');
		text('[data-qbo-webhook]', dashboard.status?.webhook_endpoint || '—');
		text('[data-qbo-readiness-score]', `${checks.length ? Math.round((complete / checks.length) * 100) : 0}%`);
		const connection = q('[data-qbo-connection-state]');
		if (connection) { connection.textContent = dashboard.status?.connected ? 'Connected' : 'Disconnected'; connection.className = `dtb-qbo-state ${dashboard.status?.connected ? 'is-connected' : 'is-disconnected'}`; }
		const checksHost = q('[data-qbo-checks]');
		if (checksHost) checksHost.innerHTML = checks.map((item) => `<div class="dtb-qbo-check ${item.complete ? 'is-complete' : ''}"><strong>${esc(item.label)}</strong><span>${esc(item.description)}</span></div>`).join('');
		const itemsHost = q('[data-qbo-items]');
		if (itemsHost) itemsHost.innerHTML = table([
			{ label: 'Role', render: (r) => `${esc(r.label)}<small>${esc(r.description)}</small>` },
			{ label: 'QuickBooks item', render: (r) => `${esc(r.name || r.expected)}<small>${esc(r.expected)}</small>` },
			{ label: 'Item ID', render: (r) => `<code>${esc(r.id || '—')}</code>` },
			{ label: 'Source', key: 'source' },
			{ label: 'Status', render: (r) => badge(r.verified ? 'verified' : 'attention') },
		], dashboard.items || []);
		const open = q('[data-qbo-open-link]'); if (open) { open.hidden = !dashboard.status?.connected; open.href = dashboard.links?.quickbooks || '#'; }
		const connect = q('[data-qbo-action="connect"]'); if (connect) connect.hidden = Boolean(dashboard.status?.connected);
		const orders = q('[data-qbo-orders-link]'); if (orders) orders.href = dashboard.links?.orders || '#';
		const scheduler = q('[data-qbo-scheduler-link]'); if (scheduler) scheduler.href = dashboard.links?.scheduler || '#';
	}

	async function loadView(view = state.active, quiet = false) {
		if (state.busy) return;
		setBusy(true);
		if (!quiet) showAlert('');
		try {
			if (view === 'settings') await loadDashboard();
			else renderView(view, await api(`/enterprise?view=${encodeURIComponent(view)}&page=${state.page}&limit=${Number(config.pageSize || 25)}`));
			state.failures = 0;
		} catch (error) {
			if (error.name !== 'AbortError') { state.failures += 1; showAlert(error.message, 'error'); }
		} finally { setBusy(false); schedule(); }
	}

	function schedule() {
		clearTimeout(state.timer);
		if (document.hidden) return;
		const delay = Math.min(120000, Number(config.pollInterval || 15000) * Math.max(1, 2 ** state.failures));
		state.timer = window.setTimeout(() => loadView(state.active, true), delay);
	}

	function activate(view, focus = false) {
		state.active = view; state.page = 1;
		qa('[data-qbo-tab]').forEach((tab) => { const active = tab.dataset.qboTab === view; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); tab.tabIndex = active ? 0 : -1; if (active && focus) tab.focus(); });
		qa('[data-qbo-panel]').forEach((panel) => { const active = panel.dataset.qboPanel === view; panel.hidden = !active; panel.classList.toggle('is-active', active); });
		loadView(view);
	}

	async function handleAction(action) {
		if (action === 'refresh') return loadView(state.active);
		setBusy(true); showAlert('');
		try {
			if (action === 'test') { await api('/test', { method: 'POST', body: {} }); showAlert(config.labels.connectionPassed, 'success'); }
			if (action === 'discover') { await api('/items/discover', { method: 'POST', body: {} }); showAlert(config.labels.itemsMapped, 'success'); }
			if (action === 'queue') { const result = await api('/sync/queue', { method: 'POST', body: { limit: 25 } }); showAlert(`Queued ${Number(result.queued || result.count || 0)} eligible order(s).`, 'success'); }
			if (action === 'connect') { const result = await api('/connect', { method: 'POST', body: {} }); if (!result.authorization_url) throw new Error('QuickBooks did not return an authorization URL.'); window.location.assign(result.authorization_url); return; }
			if (action === 'disconnect') { if (!window.confirm(config.labels.confirmDisconnect)) return; await api('/disconnect', { method: 'POST', body: { confirm: true } }); showAlert('QuickBooks disconnected.', 'success'); }
			await loadDashboard();
		} finally { setBusy(false); }
	}

	root.addEventListener('click', (event) => {
		const tab = event.target.closest('[data-qbo-tab]'); if (tab) { activate(tab.dataset.qboTab); return; }
		const page = event.target.closest('[data-qbo-page]'); if (page && !page.disabled) { state.page = Number(page.dataset.qboPage || 1); loadView(state.active); return; }
		const action = event.target.closest('[data-qbo-action]'); if (action && !action.disabled) { handleAction(action.dataset.qboAction).catch((error) => showAlert(error.message, 'error')); return; }
		const copy = event.target.closest('[data-qbo-copy]'); if (copy) { const selector = copy.dataset.qboCopy === 'redirect' ? '[data-qbo-redirect]' : '[data-qbo-webhook]'; navigator.clipboard.writeText(q(selector)?.textContent || '').then(() => showAlert(config.labels.copied, 'success')); }
	});
	root.addEventListener('keydown', (event) => {
		const current = event.target.closest('[data-qbo-tab]'); if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		const tabs = qa('[data-qbo-tab]'); let index = tabs.indexOf(current);
		if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
		if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
		if (event.key === 'Home') index = 0; if (event.key === 'End') index = tabs.length - 1;
		event.preventDefault(); activate(tabs[index].dataset.qboTab, true);
	});
	document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(state.timer); if (state.controller) state.controller.abort(); } else loadView(state.active, true); });
	window.addEventListener('focus', () => { if (!document.hidden) loadView(state.active, true); });
	activate('overview');
})();
