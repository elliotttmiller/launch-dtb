(() => {
	'use strict';

	const root = document.querySelector('[data-dtb-pricing-root]');
	if (!root || !window.dtbAdminConfig) return;

	const config = window.dtbAdminConfig;
	const activeTab = root.dataset.activeTab || 'products';
	const message = root.querySelector('[data-pricing-message]');
	const currency = config.currencySymbol || '$';
	let summary = null;
	let lastFocused = null;

	const escapeHtml = (value) => String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

	const money = (value) => {
		if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
		return `${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const percent = (value) => {
		if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
		return `${Number(value).toFixed(2)}%`;
	};

	const setMessage = (text = '', type = '') => {
		if (!message) return;
		message.textContent = text;
		message.classList.remove('is-error', 'is-success');
		if (type) message.classList.add(`is-${type}`);
	};

	const request = async (path, options = {}) => {
		const url = `${config.restUrl.replace(/\/$/, '')}/dtb/v1/admin/pricing${path}`;
		const response = await fetch(url, {
			credentials: 'same-origin',
			...options,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': config.nonce,
				...(options.headers || {}),
			},
		});
		let payload = {};
		try {
			payload = await response.json();
		} catch (error) {
			payload = {};
		}
		if (!response.ok) {
			throw new Error(payload.message || 'The pricing request could not be completed.');
		}
		return payload;
	};

	const statusBadge = (row) => {
		const tone = {
			healthy: 'success',
			below_target: 'warning',
			below_map: 'danger',
			missing_cost: 'neutral',
			missing_price: 'danger',
			sale_active: 'info',
		}[row.status] || 'neutral';
		return `<span class="dtb-badge dtb-badge--${tone}">${escapeHtml(row.status_label || row.status)}</span>`;
	};

	const productCell = (row) => {
		const image = row.image_url
			? `<img class="dtb-pricing-product__image" src="${escapeHtml(row.image_url)}" alt="">`
			: '<span class="dtb-pricing-product__placeholder" aria-hidden="true">IMG</span>';
		const meta = [row.sku ? `SKU ${row.sku}` : '', row.brand || '', row.type === 'variation' ? 'Variation' : ''].filter(Boolean);
		return `<div class="dtb-pricing-product">${image}<div><span class="dtb-pricing-product__name">${escapeHtml(row.name)}</span><span class="dtb-pricing-product__meta">${meta.map(escapeHtml).join('<span aria-hidden="true">·</span>')}</span></div></div>`;
	};

	const loadSummary = async () => {
		summary = await request('/data');
		return summary;
	};

	const reviewCount = (counts) => Number(counts.below_target || 0) + Number(counts.below_map || 0) + Number(counts.missing_cost || 0) + Number(counts.missing_price || 0);

	const renderSummary = () => {
		if (!summary) return;
		const counts = summary.counts || {};
		const assignments = [
			['[data-summary-total]', counts.total],
			['[data-summary-cost]', counts.with_cost],
			['[data-summary-map]', counts.with_map],
			['[data-summary-review]', reviewCount(counts)],
		];
		assignments.forEach(([selector, value]) => {
			const node = root.querySelector(selector);
			if (node) node.textContent = Number(value || 0).toLocaleString();
		});
	};

	const buildPagination = (container, data, onPage) => {
		if (!container) return;
		container.replaceChildren();
		if (!data || data.total_pages <= 1) {
			const label = document.createElement('span');
			label.className = 'dtb-pricing-pagination__label';
			label.textContent = `${Number(data?.total || 0).toLocaleString()} records`;
			container.append(label);
			return;
		}
		const previous = document.createElement('button');
		previous.type = 'button';
		previous.className = 'button button-secondary';
		previous.textContent = 'Previous';
		previous.disabled = data.page <= 1;
		previous.addEventListener('click', () => onPage(data.page - 1));
		const label = document.createElement('span');
		label.className = 'dtb-pricing-pagination__label';
		label.textContent = `Page ${data.page} of ${data.total_pages} · ${Number(data.total).toLocaleString()} records`;
		const next = document.createElement('button');
		next.type = 'button';
		next.className = 'button button-secondary';
		next.textContent = 'Next';
		next.disabled = data.page >= data.total_pages;
		next.addEventListener('click', () => onPage(data.page + 1));
		container.append(previous, label, next);
	};

	const initDrawer = () => {
		const drawer = root.querySelector('[data-pricing-drawer]');
		if (!drawer) return null;
		const form = drawer.querySelector('[data-pricing-drawer-form]');
		const close = drawer.querySelector('[data-drawer-close]');
		const price = drawer.querySelector('[data-drawer-regular-price]');
		const map = drawer.querySelector('[data-drawer-map-price]');
		const mapSource = drawer.querySelector('[data-drawer-map-source]');
		const productId = drawer.querySelector('[data-drawer-product-id]');
		const useTarget = drawer.querySelector('[data-drawer-use-target]');
		let current = null;

		const closeDrawer = () => {
			drawer.hidden = true;
			current = null;
			if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
		};

		const populate = (row) => {
			current = row;
			drawer.querySelector('[data-drawer-title]').textContent = row.name || 'Product pricing';
			drawer.querySelector('[data-drawer-sku]').textContent = row.sku ? `SKU ${row.sku}` : row.type || '';
			drawer.querySelector('[data-drawer-cost]').textContent = money(row.cost);
			drawer.querySelector('[data-drawer-margin]').textContent = percent(row.gross_margin);
			drawer.querySelector('[data-drawer-markup]').textContent = percent(row.markup);
			drawer.querySelector('[data-drawer-target]').textContent = money(row.suggested_price);
		productId.value = row.id;
		price.value = row.regular_price ?? '';
		map.value = row.map_price ?? '';
		mapSource.value = row.map_source ?? '';
		useTarget.disabled = row.suggested_price === null || row.suggested_price === undefined;
		drawer.querySelector('[data-drawer-sale-note]').hidden = !row.on_sale;
		};

		const openDrawer = async (id, trigger) => {
			lastFocused = trigger || document.activeElement;
			setMessage('');
			try {
				populate(await request(`/product/${id}`));
				drawer.hidden = false;
				close.focus();
			} catch (error) {
				setMessage(error.message, 'error');
			}
		};

		close.addEventListener('click', closeDrawer);
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !drawer.hidden) closeDrawer();
		});
		useTarget.addEventListener('click', () => {
			if (current?.suggested_price !== null && current?.suggested_price !== undefined) {
				price.value = Number(current.suggested_price).toFixed(2);
			}
		});
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const submit = form.querySelector('button[type="submit"]');
			submit.disabled = true;
			try {
				const updated = await request(`/product/${productId.value}`, {
					method: 'POST',
					body: JSON.stringify({
						regular_price: price.value,
						map_price: map.value,
						map_source: mapSource.value,
					}),
				});
				populate(updated);
				setMessage('Pricing saved to WooCommerce.', 'success');
				await refreshActiveView();
			} catch (error) {
				setMessage(error.message, 'error');
			} finally {
				submit.disabled = false;
			}
		});

		return { open: openDrawer };
	};

	const drawerApi = initDrawer();
	let refreshActiveView = async () => {};

	const initProducts = async () => {
		const tbody = root.querySelector('[data-pricing-products-body]');
		const pagination = root.querySelector('[data-pricing-pagination]');
		const search = root.querySelector('[data-pricing-search]');
		const brand = root.querySelector('[data-pricing-brand]');
		const status = root.querySelector('[data-pricing-status]');
		let page = 1;
		let timer = null;

		await loadSummary();
		renderSummary();
		(summary.brands || []).forEach((name) => {
			const option = document.createElement('option');
			option.value = name;
			option.textContent = name;
			brand.append(option);
		});

		const load = async (requestedPage = page) => {
			page = requestedPage;
			tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-loading">Loading pricing data…</td></tr>';
			const params = new URLSearchParams({
				page: String(page),
				per_page: '25',
				search: search.value.trim(),
				brand: brand.value,
				status: status.value,
				sort: 'name',
				direction: 'asc',
			});
			try {
				const data = await request(`/products?${params.toString()}`);
				if (!data.items.length) {
					tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-empty">No pricing records match these filters.</td></tr>';
				} else {
					tbody.innerHTML = data.items.map((row) => `<tr>
					<td>${productCell(row)}</td>
					<td><span class="dtb-pricing-money${row.cost === null ? ' dtb-pricing-money--muted' : ''}">${money(row.cost)}</span></td>
					<td><span class="dtb-pricing-money${row.map_price === null ? ' dtb-pricing-money--muted' : ''}">${money(row.map_price)}</span></td>
					<td><div class="dtb-pricing-margin"><strong>${money(row.effective_price)}</strong>${row.on_sale ? `<span>Regular ${money(row.regular_price)}</span>` : ''}</div></td>
					<td><div class="dtb-pricing-margin"><strong>${percent(row.gross_margin)}</strong><span>${money(row.gross_profit)} profit</span></div></td>
					<td><span class="dtb-pricing-money">${money(row.suggested_price)}</span></td>
					<td>${statusBadge(row)}</td>
					<td class="dtb-pricing-table__actions"><button type="button" class="button button-secondary" data-edit-pricing="${Number(row.id)}">Edit</button></td>
				</tr>`).join('');
				}
				buildPagination(pagination, data, load);
			} catch (error) {
				tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-empty">Pricing data could not be loaded.</td></tr>';
				setMessage(error.message, 'error');
			}
		};

		tbody.addEventListener('click', (event) => {
			const button = event.target.closest('[data-edit-pricing]');
			if (button && drawerApi) drawerApi.open(button.dataset.editPricing, button);
		});
		search.addEventListener('input', () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => load(1), 250);
		});
		brand.addEventListener('change', () => load(1));
		status.addEventListener('change', () => load(1));
		refreshActiveView = async () => {
			await loadSummary();
			renderSummary();
			await load(page);
		};
		await load();
	};

	const initOptimizer = async () => {
		const tbody = root.querySelector('[data-optimizer-body]');
		const pagination = root.querySelector('[data-optimizer-pagination]');
		const filter = root.querySelector('[data-optimizer-filter]');
		const apply = root.querySelector('[data-optimizer-apply]');
		const selectAll = root.querySelector('[data-optimizer-select-all]');
		let page = 1;

		await loadSummary();
		root.querySelector('[data-optimizer-target]').textContent = `${Number(summary.target_margin).toFixed(1)}%`;

		const updateApplyState = () => {
			apply.disabled = !tbody.querySelector('input[data-optimizer-row]:checked');
		};

		const load = async (requestedPage = page) => {
			page = requestedPage;
			selectAll.checked = false;
			apply.disabled = true;
			tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-loading">Loading recommendations…</td></tr>';
			const params = new URLSearchParams({
				page: String(page),
				per_page: '25',
				status: filter.value,
				sort: 'margin',
				direction: 'asc',
			});
			try {
				const data = await request(`/products?${params.toString()}`);
				if (!data.items.length) {
					tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-empty">No pricing recommendations in this group.</td></tr>';
				} else {
					tbody.innerHTML = data.items.map((row) => {
					const targetMargin = row.suggested_price && row.cost ? ((row.suggested_price - row.cost) / row.suggested_price) * 100 : null;
					const reason = row.status === 'below_map' ? 'Current price is below MAP.' : `Current margin is below the ${Number(row.target_margin).toFixed(1)}% target.`;
					return `<tr>
						<td class="dtb-pricing-check"><input type="checkbox" data-optimizer-row data-product-id="${Number(row.id)}" data-regular-price="${escapeHtml(row.regular_price ?? '')}" data-suggested-price="${escapeHtml(row.suggested_price ?? '')}" aria-label="Select ${escapeHtml(row.name)}"></td>
						<td>${productCell(row)}</td>
						<td>${money(row.cost)}</td>
						<td>${money(row.regular_price)}</td>
						<td>${percent(row.gross_margin)}</td>
						<td><strong>${money(row.suggested_price)}</strong></td>
						<td>${percent(targetMargin)}</td>
						<td class="dtb-pricing-muted">${escapeHtml(reason)}</td>
					</tr>`;
				}).join('');
				}
				buildPagination(pagination, data, load);
			} catch (error) {
				tbody.innerHTML = '<tr><td colspan="8" class="dtb-pricing-empty">Recommendations could not be loaded.</td></tr>';
				setMessage(error.message, 'error');
			}
		};

		tbody.addEventListener('change', (event) => {
			if (event.target.matches('[data-optimizer-row]')) updateApplyState();
		});
		selectAll.addEventListener('change', () => {
			tbody.querySelectorAll('[data-optimizer-row]').forEach((box) => { box.checked = selectAll.checked; });
			updateApplyState();
		});
		filter.addEventListener('change', () => load(1));
		apply.addEventListener('click', async () => {
			const selected = [...tbody.querySelectorAll('[data-optimizer-row]:checked')];
			if (!selected.length) return;
			apply.disabled = true;
			try {
				const result = await request('/apply', {
					method: 'POST',
					body: JSON.stringify({
						items: selected.map((box) => ({
							product_id: Number(box.dataset.productId),
							regular_price: box.dataset.suggestedPrice,
							expected_regular_price: box.dataset.regularPrice,
						})),
					}),
				});
				const updated = result.updated?.length || 0;
				const conflicts = result.conflicts?.length || 0;
				const errors = result.errors?.length || 0;
				setMessage(`Applied ${updated} price change${updated === 1 ? '' : 's'}${conflicts ? ` · ${conflicts} changed elsewhere` : ''}${errors ? ` · ${errors} failed` : ''}.`, errors ? 'error' : 'success');
				await loadSummary();
				await load(page);
			} catch (error) {
				setMessage(error.message, 'error');
				updateApplyState();
			}
		});
		refreshActiveView = async () => load(page);
		await load();
	};

	const initData = async () => {
		const form = root.querySelector('[data-pricing-policy-form]');
		const input = root.querySelector('[data-pricing-target-margin]');

		const render = async () => {
			await loadSummary();
			const counts = summary.counts || {};
			input.value = Number(summary.target_margin).toFixed(1);
			root.querySelector('[data-data-cost-coverage]').textContent = `${Number(counts.with_cost || 0).toLocaleString()} / ${Number(counts.total || 0).toLocaleString()}`;
			root.querySelector('[data-data-map-coverage]').textContent = `${Number(counts.with_map || 0).toLocaleString()} / ${Number(counts.total || 0).toLocaleString()}`;
			root.querySelector('[data-data-total]').textContent = Number(counts.total || 0).toLocaleString();
			root.querySelector('[data-data-missing-cost]').textContent = Number(counts.missing_cost || 0).toLocaleString();
			root.querySelector('[data-data-below-target]').textContent = Number(counts.below_target || 0).toLocaleString();
			root.querySelector('[data-data-below-map]').textContent = Number(counts.below_map || 0).toLocaleString();
		};

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const button = form.querySelector('button[type="submit"]');
			button.disabled = true;
			try {
				await request('/settings', { method: 'POST', body: JSON.stringify({ target_margin: input.value }) });
				setMessage('Pricing policy saved.', 'success');
				await render();
			} catch (error) {
				setMessage(error.message, 'error');
			} finally {
				button.disabled = false;
			}
		});
		refreshActiveView = render;
		await render();
	};

	(async () => {
		try {
			if (activeTab === 'products') await initProducts();
			else if (activeTab === 'optimizer') await initOptimizer();
			else await initData();
		} catch (error) {
			setMessage(error.message || 'Catalog Pricing could not be initialized.', 'error');
		}
	})();
})();
