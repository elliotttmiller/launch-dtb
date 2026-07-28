(() => {
	'use strict';

	const config = window.DTBQuickBooksAdmin;
	const root = document.getElementById('dtb-qbo-admin-root');

	if (!config || !root) {
		return;
	}

	const state = {
		dashboard: null,
		busy: false,
	};

	const query = (selector, context = root) => context.querySelector(selector);
	const queryAll = (selector, context = root) => Array.from(context.querySelectorAll(selector));

	const endpoint = (path) => {
		const rootUrl = String(config.restRoot || '').replace(/\/?$/, '/');
		const basePath = String(config.basePath || '').replace(/^\//, '').replace(/\/$/, '');
		return `${rootUrl}${basePath}${path}`;
	};

	const api = async (path, options = {}) => {
		const response = await fetch(endpoint(path), {
			method: options.method || 'GET',
			credentials: 'same-origin',
			cache: 'no-store',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-WP-Nonce': config.nonce,
				...(options.headers || {}),
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
		});

		const payload = await response.json().catch(() => null);
		if (!response.ok) {
			const error = new Error(payload?.message || `QuickBooks request failed with HTTP ${response.status}.`);
			error.status = response.status;
			error.code = payload?.code || 'qbo_request_failed';
			throw error;
		}

		return payload;
	};

	const syncActionStates = () => {
		const dashboard = state.dashboard;
		if (!dashboard) {
			const refresh = query('[data-qbo-action="refresh"]');
			if (refresh) {
				refresh.disabled = state.busy;
			}
			return;
		}

		const status = dashboard.status || {};
		const connected = Boolean(status.connected);
		const states = {
			refresh: false,
			test: !connected,
			discover: !connected,
			connect: connected || !status.ready_for_connection,
			disconnect: !connected,
		};

		queryAll('[data-qbo-action]').forEach((button) => {
			button.disabled = state.busy || Boolean(states[button.dataset.qboAction]);
		});
	};

	const setBusy = (busy) => {
		state.busy = busy;
		root.classList.toggle('is-busy', busy);
		root.setAttribute('aria-busy', busy ? 'true' : 'false');
		syncActionStates();
	};

	const showAlert = (message, tone = 'info') => {
		const alert = query('[data-qbo-alert]');
		if (!alert) {
			return;
		}
		alert.textContent = message;
		alert.className = `dtb-qbo-alert is-${tone}`;
		alert.hidden = false;
		alert.setAttribute('tabindex', '-1');
		alert.focus();
	};

	const clearAlert = () => {
		const alert = query('[data-qbo-alert]');
		if (alert) {
			alert.hidden = true;
			alert.textContent = '';
			alert.removeAttribute('tabindex');
		}
	};

	const formatDate = (value, includeTime = true) => {
		if (!value) {
			return '—';
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return '—';
		}
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			...(includeTime ? { timeStyle: 'short' } : {}),
		}).format(date);
	};

	const sourceLabel = (source) => {
		const labels = {
			constant: 'wp-config.php',
			managed: 'Control Center',
			legacy: 'Legacy option',
			unconfigured: 'Not configured',
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

	const renderItems = (items) => {
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

	const render = (dashboard) => {
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
		renderItems(dashboard.items || []);

		setText('[data-qbo-company]', dashboard.company?.name || (connected ? 'Connected company' : 'Not connected'));
		setText('[data-qbo-environment]', String(status.environment || config.environment || '—').toUpperCase());
		setText('[data-qbo-realm]', dashboard.company?.realmSuffix ? `••••${dashboard.company.realmSuffix}` : '—');
		setText('[data-qbo-token]', dashboard.token?.expiresAtIso ? formatDate(dashboard.token.expiresAtIso) : '—');
		setText('[data-qbo-verified]', dashboard.company?.verifiedAt ? formatDate(dashboard.company.verifiedAt) : '—');
		setText('[data-qbo-redirect]', status.redirect_uri || '—');
		setText('[data-qbo-webhook]', status.webhook_endpoint || '—');

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
				render(result.dashboard);
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

	const handleAction = async (event) => {
		const button = event.target.closest('[data-qbo-action]');
		if (!button || state.busy || button.disabled) {
			return;
		}
		const action = actions[button.dataset.qboAction];
		if (!action) {
			return;
		}
		try {
			await action();
		} catch (error) {
			showAlert(error.message, 'error');
		}
	};

	const activateTab = (name, focus = false) => {
		queryAll('[data-qbo-tab]').forEach((tab) => {
			const active = tab.dataset.qboTab === name;
			tab.classList.toggle('is-active', active);
			tab.setAttribute('aria-selected', active ? 'true' : 'false');
			tab.setAttribute('tabindex', active ? '0' : '-1');
			if (active && focus) {
				tab.focus();
			}
		});
		queryAll('[data-qbo-panel]').forEach((panel) => {
			const active = panel.dataset.qboPanel === name;
			panel.classList.toggle('is-active', active);
			panel.hidden = !active;
		});
	};

	const handleTabs = (event) => {
		const tab = event.target.closest('[data-qbo-tab]');
		if (tab) {
			activateTab(tab.dataset.qboTab);
		}
	};

	const handleTabKeys = (event) => {
		const tab = event.target.closest('[data-qbo-tab]');
		if (!tab) {
			return;
		}

		const tabs = queryAll('[data-qbo-tab]');
		const current = tabs.indexOf(tab);
		let next = current;

		switch (event.key) {
			case 'ArrowRight':
				next = (current + 1) % tabs.length;
				break;
			case 'ArrowLeft':
				next = (current - 1 + tabs.length) % tabs.length;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = tabs.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		activateTab(tabs[next].dataset.qboTab, true);
	};

	const copyDiagnostic = async (event) => {
		const button = event.target.closest('[data-qbo-copy]');
		if (!button) {
			return;
		}
		const selector = button.dataset.qboCopy === 'redirect' ? '[data-qbo-redirect]' : '[data-qbo-webhook]';
		const value = query(selector)?.textContent?.trim();
		if (!value || value === '—') {
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			showAlert(config.labels.copied, 'success');
		} catch (error) {
			showAlert('Clipboard access was unavailable. Select and copy the endpoint manually.', 'warning');
		}
	};

	root.addEventListener('click', handleAction);
	root.addEventListener('click', handleTabs);
	root.addEventListener('keydown', handleTabKeys);
	root.addEventListener('click', copyDiagnostic);

	const noticeMessages = {
		connected: ['QuickBooks connected and the selected company was verified.', 'success'],
		invalid_state: ['The QuickBooks authorization session was invalid or expired. Start a new connection from this page.', 'error'],
		authorization_denied: ['QuickBooks authorization was cancelled.', 'warning'],
		invalid_response: ['QuickBooks returned an incomplete authorization response.', 'error'],
		token_exchange: ['QuickBooks token exchange failed. Verify the app credentials and redirect URI.', 'error'],
		token_storage: ['QuickBooks connected, but encrypted token storage failed.', 'error'],
		company_verification: ['QuickBooks connected, but company verification failed.', 'error'],
	};

	activateTab('configuration');

	if (noticeMessages[config.notice]) {
		showAlert(...noticeMessages[config.notice]);
	}

	loadDashboard().catch(() => {
		root.classList.add('is-ready');
	});
})();
