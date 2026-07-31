/**
 * DTB Visual UI Designer — admin editor application.
 *
 * Plain, dependency-free JS (matches the other MU-plugin Admin/assets files —
 * no build step). Talks exclusively to the dtb/v1 REST API localized via
 * window.dtbAdminConfig (restUrl/nonce, shared with every DTB admin page)
 * and window.dtbVisualDesignerConfig (storefrontOrigin/surfaces/breakpoints,
 * specific to this page — see Admin/DesignerPage.php).
 */
(function () {
	'use strict';

	var cfg = window.dtbAdminConfig || {};
	var vd = window.dtbVisualDesignerConfig || {};
	var root = document.getElementById('dtb-vd-root');
	if (!root) {
		return;
	}

	var state = {
		registry: null,
		draft: null,
		selectedSurfaceId: null,
		selectedComponentId: null,
		breakpoint: 'base',
		activeTab: 'properties',
		history: null,
		previewToken: null,
		conflict: null,
		pendingOps: [],
		flushTimer: null,
	};

	// ── REST helpers ──────────────────────────────────────────────────────

	function restUrl(path) {
		return (cfg.restUrl || '/wp-json/').replace(/\/$/, '') + path;
	}

	function api(method, path, body) {
		return fetch(restUrl(path), {
			method: method,
			credentials: 'same-origin',
			headers: Object.assign(
				{ 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce || '' }
			),
			body: body ? JSON.stringify(body) : undefined,
		}).then(function (res) {
			return res.json().then(function (json) {
				if (!res.ok) {
					var err = new Error(json.message || 'Request failed');
					err.status = res.status;
					err.body = json;
					throw err;
				}
				return json;
			});
		});
	}

	// ── Bootstrap ─────────────────────────────────────────────────────────

	function boot() {
		Promise.all([
			api('GET', '/dtb/v1/design/registry'),
			api('GET', '/dtb/v1/design/draft'),
			api('GET', '/dtb/v1/design/revisions?perPage=20'),
		])
			.then(function (results) {
				state.registry = results[0];
				state.draft = results[1];
				state.history = results[2];
				var firstSurface = Object.keys(state.registry.surfaces || {})[0];
				state.selectedSurfaceId = firstSurface || null;
				render();
				startPreviewSession();
			})
			.catch(function (err) {
				renderFatalError(err);
			});
	}

	function startPreviewSession() {
		api('POST', '/dtb/v1/design/preview/session', { draftKey: 'default' })
			.then(function (session) {
				state.previewToken = session.token;
				renderStage();
			})
			.catch(function () {
				/* Preview is optional enhancement; editor still works without it. */
			});
	}

	// ── Rendering ─────────────────────────────────────────────────────────

	function h(tag, attrs, children) {
		var el = document.createElement(tag);
		attrs = attrs || {};
		Object.keys(attrs).forEach(function (key) {
			if (key === 'class') el.className = attrs[key];
			else if (key.indexOf('on') === 0) el.addEventListener(key.slice(2), attrs[key]);
			else if (attrs[key] !== null && attrs[key] !== undefined) el.setAttribute(key, attrs[key]);
		});
		(children || []).forEach(function (child) {
			if (child === null || child === undefined) return;
			el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
		});
		return el;
	}

	function render() {
		root.innerHTML = '';
		root.appendChild(renderTopbar());
		var workspace = h('div', { class: 'dtb-vd__workspace' }, [
			renderNav(),
			renderStageContainer(),
			renderInspector(),
		]);
		root.appendChild(workspace);
	}

	function renderFatalError(err) {
		root.innerHTML = '';
		root.appendChild(
			h('div', { class: 'dtb-vd__empty' }, [
				h('strong', {}, ['Unable to load the Visual Designer']),
				h('span', {}, [err && err.message ? err.message : 'Please refresh the page.']),
			])
		);
	}

	function statusBadge() {
		var draft = state.draft;
		if (state.conflict) {
			return h('span', { class: 'dtb-vd__status dtb-vd__status--conflict' }, [
				h('span', { class: 'dtb-vd__status-dot' }, []),
				'Conflict — reload required',
			]);
		}
		if (draft && draft.dirty) {
			return h('span', { class: 'dtb-vd__status dtb-vd__status--dirty' }, [
				h('span', { class: 'dtb-vd__status-dot' }, []),
				'Unpublished changes',
			]);
		}
		return h('span', { class: 'dtb-vd__status dtb-vd__status--saved' }, [
			h('span', { class: 'dtb-vd__status-dot' }, []),
			'Up to date',
		]);
	}

	function renderTopbar() {
		var deviceBtns = (vd.breakpoints || ['base', 'desktop', 'tablet', 'mobile']).map(function (bp) {
			return h(
				'button',
				{
					class: 'dtb-vd__device-btn',
					'aria-pressed': String(state.breakpoint === bp),
					'aria-label': bp,
					title: bp.charAt(0).toUpperCase() + bp.slice(1),
					onclick: function () {
						state.breakpoint = bp;
						render();
					},
				},
				[bp.slice(0, 1).toUpperCase()]
			);
		});

		return h('div', { class: 'dtb-vd__topbar' }, [
			h('span', { class: 'dtb-vd__title' }, ['DTB Visual Designer']),
			statusBadge(),
			h('div', { class: 'dtb-vd__topbar-spacer' }, []),
			h('div', { class: 'dtb-vd__device-toolbar', role: 'group', 'aria-label': 'Responsive preview size' }, deviceBtns),
			h('div', { class: 'dtb-vd__actions' }, [
				h(
					'button',
					{
						class: 'dtb-vd__btn dtb-vd__btn--ghost',
						onclick: onDiscard,
						disabled: state.draft && !state.draft.dirty ? 'disabled' : null,
					},
					['Discard']
				),
				h('button', { class: 'dtb-vd__btn dtb-vd__btn--primary', onclick: onPublish }, ['Publish']),
			]),
		]);
	}

	function renderNav() {
		var surfaces = state.registry.surfaces || {};
		var byCategory = {};
		Object.keys(surfaces).forEach(function (id) {
			var s = surfaces[id];
			byCategory[s.category] = byCategory[s.category] || [];
			byCategory[s.category].push(s);
		});

		var children = [];
		Object.keys(byCategory).forEach(function (cat) {
			children.push(h('div', { class: 'dtb-vd__nav-section' }, [cat.replace(/-/g, ' ')]));
			byCategory[cat].forEach(function (surface) {
				var isCurrent = surface.id === state.selectedSurfaceId;
				children.push(
					h(
						'button',
						{
							class: 'dtb-vd__nav-item',
							'aria-current': String(isCurrent),
							onclick: function () {
								state.selectedSurfaceId = surface.id;
								state.selectedComponentId = null;
								render();
							},
						},
						[
							surface.name,
							surface.commerce_critical
								? h('span', { class: 'dtb-vd__nav-badge dtb-vd__nav-badge--commerce' }, ['commerce'])
								: null,
						]
					)
				);
			});
		});

		if (state.selectedSurfaceId) {
			children.push(renderTree(surfaces[state.selectedSurfaceId]));
		}

		return h('nav', { class: 'dtb-vd__nav', 'aria-label': 'Surfaces' }, children);
	}

	function renderTree(surface) {
		var components = surface.components || {};
		var ids = Object.keys(components);

		if (!ids.length) {
			return h('div', { class: 'dtb-vd__empty' }, ['This surface has no registered components yet.']);
		}

		function depthOf(id, seen) {
			seen = seen || {};
			if (seen[id]) return 0;
			seen[id] = true;
			var parent = components[id] && components[id].parent;
			return parent && components[parent] ? 1 + depthOf(parent, seen) : 0;
		}

		var nodes = ids.map(function (id) {
			var c = components[id];
			var selected = id === state.selectedComponentId;
			var node = h(
				'button',
				{
					class: 'dtb-vd__tree-node',
					style: '--depth:' + depthOf(id),
					'aria-selected': String(selected),
					onclick: function () {
						state.selectedComponentId = id;
						state.activeTab = 'properties';
						render();
						postToPreview({ type: 'dtb-vd:select-component', surfaceId: surface.id, componentId: id });
					},
				},
				[h('span', { class: 'dtb-vd__tree-kind-dot dtb-vd__tree-kind-dot--' + c.kind }, []), c.name]
			);
			return node;
		});

		return h('div', { class: 'dtb-vd__tree', role: 'tree', 'aria-label': surface.name + ' components' }, nodes);
	}

	function renderStageContainer() {
		return h('div', { class: 'dtb-vd__stage', id: 'dtb-vd-stage' }, [renderStageBanner(), renderStageFrame()]);
	}

	function renderStage() {
		var stage = document.getElementById('dtb-vd-stage');
		if (!stage) return;
		stage.innerHTML = '';
		stage.appendChild(renderStageBanner());
		stage.appendChild(renderStageFrame());
	}

	function renderStageBanner() {
		return h('div', { class: 'dtb-vd__stage-banner' }, [
			'⬤ Live Preview — unpublished draft, visible only to you in this session',
		]);
	}

	function renderStageFrame() {
		var surface = state.registry.surfaces[state.selectedSurfaceId];
		var wrap = h('div', { class: 'dtb-vd__stage-frame-wrap', 'data-device': state.breakpoint === 'base' ? 'desktop' : state.breakpoint }, []);

		if (!surface || !state.previewToken || !looksLikeRoute(surface.route)) {
			wrap.appendChild(
				h('div', { class: 'dtb-vd__empty' }, [
					'Live embedded preview is not yet wired for this surface.',
					h('span', {}, ['Token and property edits are still fully authored, drafted, and published below.']),
				])
			);
			return wrap;
		}

		var src =
			(vd.storefrontOrigin || '') +
			firstRoute(surface.route) +
			(firstRoute(surface.route).indexOf('?') === -1 ? '?' : '&') +
			'dtb_preview=1&dtb_preview_token=' +
			encodeURIComponent(state.previewToken) +
			'&dtb_preview_bp=' +
			encodeURIComponent(state.breakpoint);

		var iframe = h('iframe', { src: src, title: 'Storefront preview', loading: 'lazy' }, []);
		wrap.appendChild(iframe);
		return wrap;
	}

	function looksLikeRoute(route) {
		return typeof route === 'string' && route.indexOf('/') === 0;
	}
	function firstRoute(route) {
		return String(route).split(',')[0].split(' ')[0].replace(/:[a-zA-Z]+/g, '1');
	}

	function postToPreview(message) {
		var iframe = document.querySelector('.dtb-vd__stage-frame-wrap iframe');
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage(message, vd.storefrontOrigin || '*');
		}
	}

	window.addEventListener('message', function (event) {
		if (!vd.storefrontOrigin || event.origin !== vd.storefrontOrigin) return;
		var data = event.data || {};
		if (data.type === 'dtb-preview:component-selected') {
			state.selectedSurfaceId = data.surfaceId || state.selectedSurfaceId;
			state.selectedComponentId = data.componentId || null;
			render();
		}
	});

	// ── Inspector ─────────────────────────────────────────────────────────

	function renderInspector() {
		var tabs = ['properties', 'tokens', 'history'];
		var tabButtons = tabs.map(function (tab) {
			return h(
				'button',
				{
					class: 'dtb-vd__inspector-tab',
					'aria-selected': String(state.activeTab === tab),
					onclick: function () {
						state.activeTab = tab;
						render();
					},
				},
				[tab.charAt(0).toUpperCase() + tab.slice(1)]
			);
		});

		var body;
		if (state.activeTab === 'properties') body = renderPropertiesTab();
		else if (state.activeTab === 'tokens') body = renderTokensTab();
		else body = renderHistoryTab();

		return h('aside', { class: 'dtb-vd__inspector', 'aria-label': 'Inspector' }, [
			h('div', { class: 'dtb-vd__inspector-tabs', role: 'tablist' }, tabButtons),
			h('div', { class: 'dtb-vd__inspector-body' }, [body]),
		]);
	}

	function getResolvedComponent(surfaceId, componentId) {
		var config = state.draft && state.draft.config;
		if (!config) return null;
		var surface = config.surfaces[surfaceId];
		return surface ? surface.components[componentId] : null;
	}

	function renderPropertiesTab() {
		if (!state.selectedSurfaceId || !state.selectedComponentId) {
			return h('div', { class: 'dtb-vd__empty' }, ['Select a component from the tree or the live preview to edit its properties.']);
		}

		var surfaceDef = state.registry.surfaces[state.selectedSurfaceId];
		var componentDef = surfaceDef.components[state.selectedComponentId];
		var resolved = getResolvedComponent(state.selectedSurfaceId, state.selectedComponentId) || { properties: {} };

		var fields = [];

		if (componentDef.kind === 'commerce_critical') {
			fields.push(
				h('div', { class: 'dtb-vd__commerce-lock' }, [
					'This component is commerce-critical. It cannot be hidden, removed, or reordered outside its approved position — only its approved visual properties below may be adjusted.',
				])
			);
		}

		Object.keys(componentDef.properties || {}).forEach(function (propId) {
			var schema = componentDef.properties[propId];
			var resolvedProp = resolved.properties[propId] || { value: schema.default, source: 'default' };
			fields.push(renderPropertyField(surfaceDef.id, state.selectedComponentId, propId, schema, resolvedProp, componentDef));
		});

		if (componentDef.visibility_toggle && componentDef.kind !== 'commerce_critical') {
			fields.push(renderVisibilityField(surfaceDef.id, state.selectedComponentId, resolved));
		}

		if (componentDef.reorder) {
			fields.push(renderOrderField(surfaceDef.id, state.selectedComponentId, resolved));
		}

		return h('div', {}, fields);
	}

	function fieldSourceLabel(source) {
		return source || 'default';
	}

	function renderResetButton(onReset) {
		return h('button', { class: 'dtb-vd__field-reset', onclick: onReset }, ['Reset']);
	}

	function renderPropertyField(surfaceId, componentId, propId, schema, resolvedProp, componentDef) {
		var value = resolvedProp.value;
		var control;
		var breakpointScope = state.breakpoint !== 'base' && componentDef.responsive;

		function commit(newValue) {
			queueOp({
				op: 'set',
				surfaceId: surfaceId,
				componentId: componentId,
				propertyId: propId,
				scope: breakpointScope ? 'responsive' : 'component',
				breakpoint: breakpointScope ? state.breakpoint : 'base',
				value: newValue,
			});
		}

		if (schema.type === 'boolean') {
			control = h('div', { class: 'dtb-vd__toggle-row' }, [
				h('input', {
					type: 'checkbox',
					checked: value ? 'checked' : null,
					onchange: function (e) {
						commit(e.target.checked);
					},
				}),
			]);
		} else if (schema.type === 'enum' || schema.type === 'text_align' || schema.type === 'aspect_ratio') {
			var options = schema.allowed_values || (schema.type === 'text_align' ? ['left', 'center', 'right', 'justify'] : ['1:1', '4:3', '16:9', '3:2', 'auto']);
			control = h(
				'div',
				{ class: 'dtb-vd__segmented' },
				options.map(function (opt) {
					return h(
						'button',
						{
							type: 'button',
							'aria-pressed': String(value === opt),
							onclick: function () {
								commit(opt);
							},
						},
						[opt]
					);
				})
			);
		} else if (schema.type === 'number' || schema.type === 'spacing') {
			control = h('div', {}, [
				h('input', {
					class: 'dtb-vd__slider',
					type: 'range',
					min: schema.min != null ? schema.min : 0,
					max: schema.max != null ? schema.max : 100,
					value: value,
					oninput: function (e) {
						commit(Number(e.target.value));
					},
				}),
				h('span', { class: 'dtb-vd__slider-value' }, [String(value) + (schema.type === 'spacing' ? 'px' : '')]),
			]);
		} else if (schema.type === 'color_ref') {
			var tokenGroups = state.registry.tokenGroups || {};
			var tokenOptions = [];
			Object.keys(tokenGroups).forEach(function (gid) {
				Object.keys(tokenGroups[gid].tokens).forEach(function (tid) {
					tokenOptions.push(tid);
				});
			});
			control = h(
				'select',
				{
					class: 'dtb-vd__select',
					onchange: function (e) {
						commit(e.target.value);
					},
				},
				tokenOptions.map(function (tid) {
					return h('option', { value: tid, selected: tid === value ? 'selected' : null }, [tid]);
				})
			);
		} else {
			control = h('input', {
				class: 'dtb-vd__input',
				type: 'text',
				value: value,
				onchange: function (e) {
					commit(e.target.value);
				},
			});
		}

		return h('div', { class: 'dtb-vd__field' }, [
			h('div', { class: 'dtb-vd__field-label' }, [
				h('span', {}, [schema.name || propId]),
				h('span', { class: 'dtb-vd__field-source dtb-vd__field-source--' + resolvedProp.source }, [fieldSourceLabel(resolvedProp.source)]),
			]),
			control,
			resolvedProp.source !== 'default'
				? renderResetButton(function () {
						resetScope('property', {
							surfaceId: surfaceId,
							componentId: componentId,
							propertyId: propId,
							breakpoint: breakpointScope ? state.breakpoint : null,
						});
				  })
				: null,
		]);
	}

	function renderVisibilityField(surfaceId, componentId, resolved) {
		return h('div', { class: 'dtb-vd__field' }, [
			h('div', { class: 'dtb-vd__field-label' }, [h('span', {}, ['Visible'])]),
			h('div', { class: 'dtb-vd__toggle-row' }, [
				h('input', {
					type: 'checkbox',
					checked: !resolved.hidden ? 'checked' : null,
					onchange: function (e) {
						queueOp({ op: 'visibility', surfaceId: surfaceId, componentId: componentId, hidden: !e.target.checked });
					},
				}),
			]),
		]);
	}

	function renderOrderField(surfaceId, componentId, resolved) {
		return h('div', { class: 'dtb-vd__field' }, [
			h('div', { class: 'dtb-vd__field-label' }, [h('span', {}, ['Order Position'])]),
			h('input', {
				class: 'dtb-vd__input',
				type: 'number',
				min: '0',
				max: '200',
				value: resolved.order != null ? resolved.order : 0,
				onchange: function (e) {
					queueOp({ op: 'order', surfaceId: surfaceId, componentId: componentId, order: Number(e.target.value) });
				},
			}),
		]);
	}

	function renderTokensTab() {
		var groups = state.registry.tokenGroups || {};
		var config = state.draft && state.draft.config;
		var sections = Object.keys(groups).map(function (gid) {
			var group = groups[gid];
			var fields = Object.keys(group.tokens).map(function (tid) {
				var schema = group.tokens[tid];
				var resolvedToken = (config && config.tokens[tid]) || { value: schema.default, source: 'default' };
				return renderTokenField(tid, schema, resolvedToken);
			});
			return h('div', {}, [h('div', { class: 'dtb-vd__nav-section' }, [group.name]), h('div', {}, fields)]);
		});
		return h('div', {}, sections);
	}

	function renderTokenField(tokenId, schema, resolvedToken) {
		var control;
		if (schema.type === 'color') {
			control = h('div', { class: 'dtb-vd__color-swatch-row' }, [
				h('span', { class: 'dtb-vd__color-swatch', style: 'background:' + resolvedToken.value }, []),
				h('input', {
					class: 'dtb-vd__input',
					type: 'text',
					value: resolvedToken.value,
					onchange: function (e) {
						queueTokenOp(tokenId, e.target.value);
					},
				}),
			]);
		} else {
			control = h('div', {}, [
				h('input', {
					class: 'dtb-vd__slider',
					type: 'range',
					min: schema.min,
					max: schema.max,
					value: resolvedToken.value,
					oninput: function (e) {
						queueTokenOp(tokenId, Number(e.target.value));
					},
				}),
				h('span', { class: 'dtb-vd__slider-value' }, [String(resolvedToken.value) + 'px']),
			]);
		}

		return h('div', { class: 'dtb-vd__field' }, [
			h('div', { class: 'dtb-vd__field-label' }, [
				h('span', {}, [schema.name || tokenId]),
				h('span', { class: 'dtb-vd__field-source dtb-vd__field-source--' + resolvedToken.source }, [fieldSourceLabel(resolvedToken.source)]),
			]),
			control,
		]);
	}

	function renderHistoryTab() {
		var history = state.history;
		if (!history || !history.items.length) {
			return h('div', { class: 'dtb-vd__empty' }, ['No revisions yet. Publish your first draft to start history.']);
		}

		var items = history.items.map(function (rev) {
			var isPublished = rev.id === history.publishedRevisionId;
			return h('div', { class: 'dtb-vd__history-item' + (isPublished ? ' dtb-vd__history-item--published' : '') }, [
				h('div', { class: 'dtb-vd__history-meta' }, [
					h('span', {}, ['#' + rev.id + ' · ' + rev.author_name]),
					h('span', {}, [new Date(rev.created_at + 'Z').toLocaleString()]),
				]),
				h('div', { class: 'dtb-vd__history-note' }, [rev.note || (isPublished ? 'Currently published' : 'No description')]),
				isPublished
					? null
					: h(
							'button',
							{
								class: 'dtb-vd__btn dtb-vd__btn--ghost',
								onclick: function () {
									onRollback(rev.id);
								},
							},
							['Restore this revision']
					  ),
			]);
		});

		return h('div', {}, items);
	}

	// ── Mutations ─────────────────────────────────────────────────────────

	function queueOp(op) {
		state.pendingOps.push(op);
		scheduleFlush();
	}

	function queueTokenOp(tokenId, value) {
		state.pendingTokens = state.pendingTokens || {};
		state.pendingTokens[tokenId] = value;
		scheduleFlush();
	}

	function scheduleFlush() {
		clearTimeout(state.flushTimer);
		state.flushTimer = setTimeout(flush, 350);
	}

	function flush() {
		if (!state.pendingOps.length && !state.pendingTokens) return;

		var ops = state.pendingOps;
		var tokens = state.pendingTokens || {};
		state.pendingOps = [];
		state.pendingTokens = null;

		api('PATCH', '/dtb/v1/design/draft', {
			draftKey: 'default',
			revisionSeq: state.draft.revisionSeq,
			ops: ops,
			tokens: tokens,
		})
			.then(function (result) {
				state.draft.revisionSeq = result.revisionSeq;
				state.draft.config = result.config;
				state.draft.dirty = true;
				state.conflict = null;
				render();
				postToPreview({ type: 'dtb-vd:config-updated' });
			})
			.catch(function (err) {
				if (err.status === 409) {
					state.conflict = err.body;
					render();
				}
			});
	}

	function resetScope(level, target) {
		api('POST', '/dtb/v1/design/draft/reset', {
			draftKey: 'default',
			revisionSeq: state.draft.revisionSeq,
			level: level,
			target: target,
		}).then(function (result) {
			state.draft.revisionSeq = result.revisionSeq;
			state.draft.config = result.config;
			render();
			postToPreview({ type: 'dtb-vd:config-updated' });
		});
	}

	function onDiscard() {
		if (!window.confirm('Discard all unpublished changes and revert to the last published version?')) return;
		api('POST', '/dtb/v1/design/draft/discard', { draftKey: 'default' }).then(function (result) {
			state.draft.revisionSeq = result.revisionSeq;
			state.draft.config = result.config;
			state.draft.dirty = false;
			render();
			postToPreview({ type: 'dtb-vd:config-updated' });
		});
	}

	function onPublish() {
		var note = window.prompt('Optional note for this revision:', '') || '';
		api('POST', '/dtb/v1/design/publish', { draftKey: 'default', revisionSeq: state.draft.revisionSeq, note: note })
			.then(function () {
				return api('GET', '/dtb/v1/design/draft');
			})
			.then(function (draft) {
				return api('GET', '/dtb/v1/design/revisions?perPage=20').then(function (history) {
					state.draft = draft;
					state.history = history;
					render();
				});
			})
			.catch(function (err) {
				if (err.status === 409) {
					window.alert('This draft is out of date on the server. Reloading…');
					window.location.reload();
				}
			});
	}

	function onRollback(revisionId) {
		if (!window.confirm('Restore this revision as the live published version?')) return;
		api('POST', '/dtb/v1/design/rollback', { draftKey: 'default', revisionId: revisionId }).then(function () {
			return Promise.all([api('GET', '/dtb/v1/design/draft'), api('GET', '/dtb/v1/design/revisions?perPage=20')]).then(function (r) {
				state.draft = r[0];
				state.history = r[1];
				render();
			});
		});
	}

	boot();
})();
