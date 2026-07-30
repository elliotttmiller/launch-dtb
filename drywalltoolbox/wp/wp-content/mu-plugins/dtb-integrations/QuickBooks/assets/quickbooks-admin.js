(() => {
	'use strict';
	const config = window.DTBQuickBooksAdmin;
	const root = document.getElementById('dtb-qbo-admin-root');
	if (!config || !root) return;

	const state = { active: 'overview', timer: null, busy: false, dashboard: null };
	const q = (s, c = root) => c.querySelector(s);
	const qa = (s, c = root) => Array.from(c.querySelectorAll(s));
	const endpoint = (path) => `${String(config.restRoot).replace(/\/?$/, '/')}${String(config.basePath).replace(/^\//, '').replace(/\/$/, '')}${path}`;
	const api = async (path, options = {}) => {
		const response = await fetch(endpoint(path), {
			method: options.method || 'GET', credentials: 'same-origin', cache: 'no-store',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
			body: options.body ? JSON.stringify(options.body) : undefined,
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(payload.message || `QuickBooks request failed (${response.status}).`);
		return payload;
	};
	const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[ch]));
	const money = (value, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(Number(value || 0));
	const date = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
	const badge = (value) => `<span class="dtb-qbo-badge is-${esc(value)}">${esc(value || 'unknown')}</span>`;
	const alert = (message, tone = 'info') => { const el = q('[data-qbo-alert]'); if (!el) return; el.hidden = !message; el.className = `dtb-qbo-alert is-${tone}`; el.textContent = message || ''; };
	const setText = (selector, value) => { const el = q(selector); if (el) el.textContent = value; };

	function table(headers, rows) {
		if (!rows.length) return '<div class="dtb-qbo-empty">No records are available for this view.</div>';
		return `<div class="dtb-qbo-table-wrap"><table class="dtb-qbo-table"><thead><tr>${headers.map((h) => `<th>${esc(h.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${h.render ? h.render(row) : esc(row[h.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
	}

	function renderRows(view, data) {
		const target = q(`[data-qbo-table="${view}"]`); if (!target) return;
		const rows = data.rows || data.latest || [];
		const schemas = {
			overview: [
				{ label: 'Order', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.number)}</a><small>${esc(r.docNumber)}</small>` },
				{ label: 'Customer', render: (r) => `${esc(r.customer || 'Guest')}<small>${esc(r.email)}</small>` },
				{ label: 'Total', render: (r) => money(r.total, r.currency) },
				{ label: 'Projection', render: (r) => badge(r.state) },
				{ label: 'Created', render: (r) => date(r.date) },
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
				{ label: 'Refund', render: (r) => `#${esc(r.id)}<small>Order #${esc(r.orderNumber)}</small>` },
				{ label: 'Amount', render: (r) => money(r.amount, r.currency) },
				{ label: 'Reason', key: 'reason' },
				{ label: 'Projection', render: (r) => badge(r.state) },
				{ label: 'Entity ID', render: (r) => `<code>${esc(r.entityId || '—')}</code>` },
				{ label: 'Created', render: (r) => date(r.date) },
			],
			customers: [
				{ label: 'Customer', render: (r) => `${esc(r.name || 'Guest')}<small>${esc(r.email)}</small>` },
				{ label: 'Orders', key: 'orders' },
				{ label: 'Revenue', render: (r) => money(r.total) },
				{ label: 'QuickBooks', render: (r) => badge(r.state) },
				{ label: 'Entity ID', render: (r) => `<code>${esc(r.entityId || '—')}</code>` },
				{ label: 'Last order', render: (r) => date(r.lastOrder) },
			],
			reconciliation: [
				{ label: 'Order', render: (r) => `<a href="${esc(r.adminUrl)}">#${esc(r.number)}</a>` },
				{ label: 'Document', key: 'docNumber' },
				{ label: 'Amount', render: (r) => money(r.total, r.currency) },
				{ label: 'State', render: (r) => badge(r.state) },
				{ label: 'Paid', render: (r) => r.paid ? 'Yes' : 'No' },
				{ label: 'Created', render: (r) => date(r.date) },
			],
			activity: [
				{ label: 'Hook', render: (r) => `<code>${esc(r.hook)}</code>` },
				{ label: 'Status', render: (r) => badge(r.status) },
				{ label: 'Scheduled', render: (r) => date(r.date) },
			],
		};
		return labels[source] || source || '—';
	};

	const renderChecks = (checks) => {
		const list = query('[data-qbo-checks]');
		if (!list) {
			return;
		}
		list.replaceChildren();
		Object.values(checks || {}).forEach((check) => {
			const item = document.createElement('li');
			item.className = `dtb-qbo-check${check.complete ? ' is-complete' : ''}`;

			const label = document.createElement('strong');
			label.textContent = check.label || 'Check';
			const description = document.createElement('small');
			description.textContent = check.description || '';

			item.append(label, description);
			list.append(item);
		});
	};

	const renderItems = (items, discoveryByKey = {}) => {
		const container = query('[data-qbo-items]');
		if (!container) {
			return;
		}
		container.replaceChildren();

		(items || []).forEach((item) => {
			const row = document.createElement('div');
			row.className = 'dtb-qbo-item-row';
			row.setAttribute('role', 'row');

			const role = document.createElement('div');
			role.className = 'dtb-qbo-item-role';
			role.setAttribute('role', 'cell');
			const roleName = document.createElement('strong');
			roleName.textContent = item.label || item.key;
			const roleDescription = document.createElement('small');
			roleDescription.textContent = item.description || '';
			role.append(roleName, roleDescription);

			const name = document.createElement('div');
			name.className = 'dtb-qbo-item-name';
			name.setAttribute('role', 'cell');
			const mappedName = document.createElement('strong');
			mappedName.textContent = item.name || item.expected || '—';
			const expected = document.createElement('small');
			if (item.verified) {
				expected.textContent = `Verified for connected company: ${item.expected}`;
			} else if (item.configured) {
				expected.textContent = `Configured but not verified for connected company: ${item.expected}`;
			} else {
				expected.textContent = `Expected: ${item.expected}`;
			}
			name.append(mappedName, expected);

			// A locked (wp-config.php constant) mapping can only be satisfied by an
			// exact ID match — it will never self-correct. If the last discovery run
			// found the real item under a different ID (e.g. the constant still holds
			// a placeholder), surface that real ID so the operator knows exactly what
			// to paste into wp-config.php instead of guessing.
			const discovered = discoveryByKey[item.key];
			if (item.locked && !item.verified && discovered && discovered.id && discovered.id !== item.id) {
				const hint = document.createElement('small');
				hint.className = 'dtb-qbo-item-discovered-hint';
				hint.textContent = `Discovered ID in connected company: ${discovered.id} — update the wp-config.php constant to this value.`;
				name.append(hint);
			}

			const id = document.createElement('code');
			id.className = 'dtb-qbo-item-id';
			id.setAttribute('role', 'cell');
			id.textContent = item.id || '—';

			const source = document.createElement('span');
			source.setAttribute('role', 'cell');
			source.textContent = sourceLabel(item.source);

			const status = document.createElement('span');
			status.className = `dtb-qbo-item-status ${item.verified ? 'is-ready' : 'is-missing'}`;
			status.setAttribute('role', 'cell');
			status.textContent = item.verified ? 'Verified' : item.configured ? 'Needs verification' : 'Missing';

			row.append(role, name, id, source, status);
			container.append(row);
		});
	};

	const setText = (selector, value) => {
		const element = query(selector);
		if (element) {
			element.textContent = value;
		}
	};

	const render = (dashboard, discoveryItems = null) => {
		state.dashboard = dashboard;
		const status = dashboard.status || {};
		const checks = dashboard.readiness?.checks || {};
		const checkValues = Object.values(checks);
		const completeCount = checkValues.filter((check) => check.complete).length;
		const score = checkValues.length ? Math.round((completeCount / checkValues.length) * 100) : 0;
		const connected = Boolean(status.connected);
		const ready = Boolean(dashboard.readiness?.ready);

		setText('[data-qbo-readiness-score]', `${score}%`);
		setText('[data-qbo-readiness-title]', ready ? 'Ready for accounting projection' : 'Configuration requires attention');
		setText(
			'[data-qbo-readiness-copy]',
			ready
				? 'All required connection, company, webhook, and accounting item checks are complete.'
				: `${completeCount} of ${checkValues.length} required readiness checks are complete.`
		);
		renderChecks(checks);
		const discoveryByKey = {};
		(discoveryItems || []).forEach((entry) => {
			if (entry && entry.key) {
				discoveryByKey[entry.key] = entry;
			}
		});
		renderItems(dashboard.items || [], discoveryByKey);

		setText('[data-qbo-company]', dashboard.company?.name || (connected ? 'Connected company' : 'Not connected'));
		setText('[data-qbo-environment]', String(status.environment || config.environment || '—').toUpperCase());
		setText('[data-qbo-realm]', dashboard.company?.realmSuffix ? `••••${dashboard.company.realmSuffix}` : '—');
		setText('[data-qbo-token]', date(dashboard.token?.expiresAtIso));
		setText('[data-qbo-verified]', date(dashboard.company?.verifiedAt));
		setText('[data-qbo-webhook]', status.webhook_endpoint || '—');
		setText('[data-qbo-redirect]', status.redirect_uri || '—');
		setText('[data-qbo-readiness-score]', `${checks.length ? Math.round((complete / checks.length) * 100) : 0}%`);
		setText('[data-qbo-readiness-title]', dashboard.readiness?.ready ? 'Ready for accounting projection' : 'Configuration requires attention');
		const stateEl = q('[data-qbo-connection-state]'); if (stateEl) { stateEl.textContent = status.connected ? 'Connected' : 'Disconnected'; stateEl.className = `dtb-qbo-state ${status.connected ? 'is-connected' : 'is-disconnected'}`; }
		const checksEl = q('[data-qbo-checks]'); if (checksEl) checksEl.innerHTML = checks.map((item) => `<div class="dtb-qbo-check ${item.complete ? 'is-complete' : ''}"><strong>${esc(item.label)}</strong><span>${esc(item.description)}</span></div>`).join('');
		const itemsEl = q('[data-qbo-items]'); if (itemsEl) itemsEl.innerHTML = table([
			{ label: 'Role', render: (r) => `${esc(r.label)}<small>${esc(r.description)}</small>` },
			{ label: 'QuickBooks item', render: (r) => `${esc(r.name || r.expected)}<small>${esc(r.expected)}</small>` },
			{ label: 'Item ID', render: (r) => `<code>${esc(r.id || '—')}</code>` },
			{ label: 'Source', key: 'source' },
			{ label: 'Status', render: (r) => badge(r.verified ? 'verified' : 'attention') },
		], dashboard.items || []);
	}

		const connectionState = query('[data-qbo-connection-state]');
		if (connectionState) {
			connectionState.textContent = connected ? 'Connected' : 'Disconnected';
			connectionState.className = `dtb-qbo-state ${connected ? 'is-connected' : 'is-disconnected'}`;
		}

		const connectButton = query('[data-qbo-action="connect"]');
		const openLink = query('[data-qbo-open-link]');
		if (connectButton) {
			connectButton.hidden = connected;
		}
		if (openLink) {
			openLink.hidden = !connected;
			openLink.href = dashboard.links?.quickbooks || '#';
		}

		const ordersLink = query('[data-qbo-orders-link]');
		if (ordersLink) {
			ordersLink.href = dashboard.links?.orders || '#';
		}
		const schedulerLink = query('[data-qbo-scheduler-link]');
		if (schedulerLink) {
			schedulerLink.href = dashboard.links?.scheduler || '#';
		}

		syncActionStates();
		root.classList.add('is-ready');
	};

	const loadDashboard = async ({ quiet = false } = {}) => {
		if (!quiet) {
			setBusy(true);
		}
		try {
			const dashboard = await api('/dashboard');
			render(dashboard);
			return dashboard;
		} catch (error) {
			showAlert(error.message, 'error');
			throw error;
		} finally {
			if (!quiet) {
				setBusy(false);
			}
		}
	};

	const actions = {
		refresh: async () => {
			clearAlert();
			await loadDashboard();
		},
		test: async () => {
			clearAlert();
			setBusy(true);
			try {
				await api('/test', { method: 'POST', body: {} });
				showAlert(config.labels.connectionPassed, 'success');
				await loadDashboard({ quiet: true });
			} finally {
				setBusy(false);
			}
		},
		discover: async () => {
			clearAlert();
			setBusy(true);
			try {
				const result = await api('/items/discover', { method: 'POST', body: {} });
				// discovery.items is a PHP associative array (keyed by role: product,
				// shipping, discount, refund) — wp_json_encode serializes it as a JSON
				// object, not an array, so it must be unwrapped with Object.values().
				render(result.dashboard, Object.values(result.discovery?.items || {}));
				const ready = Boolean(result.discovery?.ready);
				showAlert(
					ready ? config.labels.itemsMapped : 'Discovery completed, but one or more exact active Service items still require attention.',
					ready ? 'success' : 'warning'
				);
			} finally {
				setBusy(false);
			}
		},
		connect: async () => {
			clearAlert();
			setBusy(true);
			try {
				const result = await api('/connect', { method: 'POST', body: {} });
				if (!result?.authorization_url) {
					throw new Error('QuickBooks did not return an authorization URL.');
				}
				window.location.assign(result.authorization_url);
			} finally {
				setBusy(false);
			}
		},
		disconnect: async () => {
			if (!window.confirm(config.labels.confirmDisconnect)) {
				return;
			}
			clearAlert();
			setBusy(true);
			try {
				await api('/disconnect', { method: 'POST', body: { confirm: true } });
				showAlert('QuickBooks was disconnected from the active environment.', 'success');
				await loadDashboard({ quiet: true });
			} finally {
				setBusy(false);
			}
		},
	};

	async function load(view = state.active, quiet = false) {
		if (state.busy) return;
		state.busy = true;
		root.classList.toggle('is-busy', !quiet);
		try {
			if (view === 'settings') {
				renderSettings(await api('/dashboard'));
			} else {
				const payload = await api(`/enterprise?view=${encodeURIComponent(view)}&limit=25`);
				if (view === 'overview') renderOverview(payload.data || {}); else renderRows(view, payload.data || {});
			}
			setText('[data-qbo-last-refresh]', `Updated ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date())}`);
			alert('');
		} catch (error) { alert(error.message, 'error'); }
		finally { state.busy = false; root.classList.remove('is-busy'); }
	}

	function activate(view) {
		state.active = view;
		qa('[data-qbo-tab]').forEach((el) => { const active = el.dataset.qboTab === view; el.classList.toggle('is-active', active); el.setAttribute('aria-selected', active ? 'true' : 'false'); });
		qa('[data-qbo-view]').forEach((el) => { const active = el.dataset.qboView === view; el.classList.toggle('is-active', active); el.hidden = !active; });
		load(view);
	}

	async function action(name) {
		try {
			if (name === 'refresh') return load(state.active);
			if (name === 'test') { await api('/test', { method: 'POST', body: {} }); alert(config.labels.connectionPassed, 'success'); return load('settings', true); }
			if (name === 'discover') { await api('/items/discover', { method: 'POST', body: {} }); alert(config.labels.itemsMapped, 'success'); return load('settings', true); }
			if (name === 'connect') { const result = await api('/connect', { method: 'POST', body: {} }); if (result.authorization_url) window.location.assign(result.authorization_url); return; }
			if (name === 'disconnect') { if (!window.confirm(config.labels.confirmDisconnect)) return; await api('/disconnect', { method: 'POST', body: { confirm: true } }); return load('settings'); }
		} catch (error) { alert(error.message, 'error'); }
	}

	root.addEventListener('click', async (event) => {
		const tab = event.target.closest('[data-qbo-tab]'); if (tab) { activate(tab.dataset.qboTab); return; }
		const button = event.target.closest('[data-qbo-action]'); if (button) { await action(button.dataset.qboAction); return; }
		const queue = event.target.closest('[data-qbo-queue]'); if (queue) { try { const result = await api('/sync/queue', { method: 'POST', body: { limit: 25 } }); alert(`Queued ${result.queued || 0} eligible orders.`, 'success'); await load('reconciliation', true); } catch (error) { alert(error.message, 'error'); } }
	});

	document.addEventListener('visibilitychange', () => { if (!document.hidden) load(state.active, true); });
	state.timer = window.setInterval(() => { if (!document.hidden) load(state.active, true); }, Math.max(10000, Number(config.pollMs || 15000)));
	load('overview');
})();
