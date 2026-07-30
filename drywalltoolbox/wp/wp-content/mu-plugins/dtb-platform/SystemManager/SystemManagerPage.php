<?php
/**
 * DTB Platform — SystemManagerPage
 *
 * Renders dtb-system-manager — the unified operations console for
 * technical admins. This is the single home for both platform health and
 * Git-backed release management; it replaces the previous separate
 * "Git Control Center" page. Tabs:
 *
 *   Overview
 *   Platform Health:    System Info | Queues & Cron | Integrations | Webhooks
 *   Release Management: Deployment | Repository | Pull Requests |
 *                        Workflow Runs | Releases & Tags | Release History |
 *                        Rollback | Deploy Settings
 *   Diagnostics:         Audit Log | Debug Log
 *
 * Release Management tab content is rendered by
 * dtb-deployment/Admin/GitControlCenterTabs.php — this page surfaces it
 * without owning it, the same pattern dtb-media's admin screen already uses
 * to surface (without owning) dtb-schematics registration.
 *
 * This console is live by default: dtb-system-manager.js polls the active
 * tab's content automatically (faster while a release is in progress) with
 * an operator-facing pause/resume control, rather than the manual-only
 * snapshot mode this page used previously.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Tab groups, in display order. Used to build the tab bar and to drive the
 * page-scoped CSS group dividers in dtb-system-manager.css (first tab of
 * each group after the first carries a `data-dtb-group-start` marker).
 *
 * @return array<string, array{label:string, tabs: array<int, array{id:string, label:string, requires?:string}>}>
 */
function dtb_system_manager_tab_groups(): array {
	return [
		'overview' => [
			'label' => __( 'Overview', 'drywall-toolbox' ),
			'tabs'  => [
				[ 'id' => 'overview', 'label' => __( 'Overview', 'drywall-toolbox' ) ],
			],
		],
		'platform' => [
			'label' => __( 'Platform Health', 'drywall-toolbox' ),
			'tabs'  => [
				[ 'id' => 'system',       'label' => __( 'System Info', 'drywall-toolbox' ) ],
				[ 'id' => 'queues',       'label' => __( 'Queues & Cron', 'drywall-toolbox' ) ],
				[ 'id' => 'integrations', 'label' => __( 'Integrations', 'drywall-toolbox' ) ],
				[ 'id' => 'webhooks',     'label' => __( 'Webhooks', 'drywall-toolbox' ) ],
			],
		],
		'release' => [
			'label' => __( 'Release Management', 'drywall-toolbox' ),
			'tabs'  => [
				[ 'id' => 'deployment',      'label' => __( 'Deployment', 'drywall-toolbox' ),      'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'repository',      'label' => __( 'Repository', 'drywall-toolbox' ),      'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'pull-requests',   'label' => __( 'Pull Requests', 'drywall-toolbox' ),   'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'workflow-runs',   'label' => __( 'Workflow Runs', 'drywall-toolbox' ),   'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'releases',        'label' => __( 'Releases & Tags', 'drywall-toolbox' ), 'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'history',         'label' => __( 'Release History', 'drywall-toolbox' ), 'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'rollback',        'label' => __( 'Rollback', 'drywall-toolbox' ),        'requires' => 'dtb_manage_deployments' ],
				[ 'id' => 'deploy-settings', 'label' => __( 'Deploy Settings', 'drywall-toolbox' ), 'requires' => 'dtb_manage_deployments' ],
			],
		],
		'diagnostics' => [
			'label' => __( 'Diagnostics', 'drywall-toolbox' ),
			'tabs'  => [
				[ 'id' => 'audit', 'label' => __( 'Audit Log', 'drywall-toolbox' ) ],
				[ 'id' => 'logs',  'label' => __( 'Debug Log', 'drywall-toolbox' ) ],
			],
		],
	];
}

function dtb_system_manager_render_page(): void {
	$can_system      = current_user_can( 'dtb_manage_system' );
	$can_deployments = current_user_can( 'dtb_manage_deployments' );

	if ( ! $can_system && ! $can_deployments ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$active_tab = sanitize_key( $_GET['tab'] ?? 'overview' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$base_url   = admin_url( 'admin.php?page=dtb-system-manager' );

	$tabs = [];
	foreach ( dtb_system_manager_tab_groups() as $group_key => $group ) {
		$first_in_group = true;
		foreach ( $group['tabs'] as $tab ) {
			$tabs[] = [
				'id'     => $tab['id'],
				'label'  => $tab['label'],
				'active' => $active_tab === $tab['id'],
				'url'    => add_query_arg( 'tab', $tab['id'], $base_url ),
				'group'  => $group_key,
				'group_start' => $first_in_group,
			];
			$first_in_group = false;
		}
	}

	$in_progress = ( $can_deployments && function_exists( 'dtb_release_history_in_progress' ) )
		? dtb_release_history_in_progress()
		: null;

	dtb_admin_shell_open( [
		'title'       => __( 'System Manager', 'drywall-toolbox' ),
		'subtitle'    => __( 'Unified platform health, queues, integrations, webhooks, and Git-backed release management.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-system-manager',
		'template'    => 'dashboard',
		'icon'        => 'dashicons-monitor',
		'tabs'        => $tabs,
		'live_target' => 'dtb-system-workspace',
	] );

	// Live region wraps all tab content panels. The dtb-live-fast class
	// signals dtb-system-manager.js to poll faster while a release is
	// actively running, and is refreshed on every live-region swap because
	// the server re-renders this open() call each time.
	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-system-workspace',
		'module'   => 'system-manager',
		'endpoint' => add_query_arg( 'tab', $active_tab, rest_url( 'dtb/v1/admin/system' ) ),
		'interval' => 15000,
		'class'    => $in_progress ? 'dtb-live-fast' : '',
	] );

	dtb_system_manager_dispatch_tab( $active_tab, $can_system, $can_deployments );

	dtb_admin_shell_live_region_close();

	if ( $can_deployments && function_exists( 'dtb_deployment_center_render_script' ) ) {
		dtb_deployment_center_render_script();
	}

	dtb_admin_shell_close();
}

/**
 * Dispatch to the correct tab renderer, enforcing per-tab capability where
 * a tab belongs to release management (dtb_manage_deployments) rather than
 * general platform health (dtb_manage_system).
 */
function dtb_system_manager_dispatch_tab( string $active_tab, bool $can_system, bool $can_deployments ): void {
	$deployment_tabs = [ 'deployment', 'repository', 'pull-requests', 'workflow-runs', 'releases', 'history', 'rollback', 'deploy-settings' ];

	if ( in_array( $active_tab, $deployment_tabs, true ) ) {
		if ( ! $can_deployments ) {
			dtb_system_manager_render_tab_access_denied( __( 'Release management requires the "Manage Deployments" capability.', 'drywall-toolbox' ) );
			return;
		}
		if ( ! function_exists( 'dtb_deployment_center_render_deployment_tab' ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_alert( __( 'The dtb-deployment module is not deployed to this server.', 'drywall-toolbox' ), 'danger', __( 'Module Unavailable', 'drywall-toolbox' ) );
			return;
		}
		switch ( $active_tab ) {
			case 'deployment':
				dtb_deployment_center_render_deployment_tab();
				break;
			case 'repository':
				dtb_deployment_center_render_repository_tab();
				break;
			case 'pull-requests':
				dtb_deployment_center_render_pull_requests_tab();
				break;
			case 'workflow-runs':
				dtb_deployment_center_render_workflow_runs_tab();
				break;
			case 'releases':
				dtb_deployment_center_render_releases_tab();
				break;
			case 'history':
				dtb_deployment_center_render_history_tab();
				break;
			case 'rollback':
				dtb_deployment_center_render_rollback_tab();
				break;
			case 'deploy-settings':
				dtb_deployment_center_render_settings_tab();
				break;
		}
		return;
	}

	if ( ! $can_system ) {
		dtb_system_manager_render_tab_access_denied( __( 'Platform health requires the "Manage System" capability.', 'drywall-toolbox' ) );
		return;
	}

	switch ( $active_tab ) {
		case 'queues':
			dtb_system_manager_render_queues_tab();
			break;
		case 'integrations':
			dtb_system_manager_render_integrations_tab();
			break;
		case 'webhooks':
			dtb_system_manager_render_webhooks_tab();
			break;
		case 'audit':
			dtb_system_manager_render_audit_tab();
			break;
		case 'logs':
			dtb_system_manager_render_logs_tab();
			break;
		case 'system':
			dtb_system_manager_render_system_tab();
			break;
		default:
			dtb_system_manager_render_overview_tab( $can_system, $can_deployments );
			break;
	}
}

function dtb_system_manager_render_tab_access_denied( string $message ): void {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_alert( esc_html( $message ), 'warning', __( 'Insufficient Permission', 'drywall-toolbox' ) );
}

// ── Overview (mission control) ──────────────────────────────────────────────

function dtb_system_manager_render_overview_tab( bool $can_system, bool $can_deployments ): void {
	$h    = $can_system ? dtb_system_health_get() : null;
	$q    = $can_system ? dtb_queue_health_get() : null;
	$ih   = $can_system ? dtb_integration_health_get() : null;
	$wh   = $can_system ? dtb_webhook_health_get() : null;
	$dep  = ( $can_deployments && function_exists( 'dtb_deployment_overview_get' ) ) ? dtb_deployment_overview_get() : null;

	$kpis = [];
	if ( $h ) {
		$kpis[] = [
			'value'      => $h['php_ok'] && $h['ssl_active'] ? __( 'Healthy', 'drywall-toolbox' ) : __( 'Attention', 'drywall-toolbox' ),
			'label'      => __( 'System', 'drywall-toolbox' ),
			'icon'       => 'dashicons-desktop',
			'icon_color' => $h['php_ok'] && $h['ssl_active'] ? 'success' : 'danger',
			'href'       => add_query_arg( 'tab', 'system', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
	}
	if ( $q ) {
		$kpis[] = [
			'value'      => (string) $q['failed'],
			'label'      => __( 'Failed Queue Jobs', 'drywall-toolbox' ),
			'icon'       => 'dashicons-database',
			'icon_color' => $q['failed'] > 0 ? 'danger' : 'success',
			'href'       => add_query_arg( 'tab', 'queues', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
	}
	if ( $ih ) {
		$missing = count( array_filter( $ih['integrations'], static fn( array $i ): bool => empty( $i['ok'] ) ) );
		$kpis[]  = [
			'value'      => sprintf( '%d/%d', count( $ih['integrations'] ) - $missing, count( $ih['integrations'] ) ),
			'label'      => __( 'Integrations Active', 'drywall-toolbox' ),
			'icon'       => 'dashicons-admin-plugins',
			'icon_color' => $missing > 0 ? 'warning' : 'success',
			'href'       => add_query_arg( 'tab', 'integrations', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
	}
	if ( $wh ) {
		$kpis[] = [
			'value'      => (string) $wh['failing'],
			'label'      => __( 'Failing Webhooks', 'drywall-toolbox' ),
			'icon'       => 'dashicons-rest-api',
			'icon_color' => $wh['failing'] > 0 ? 'danger' : 'success',
			'href'       => add_query_arg( 'tab', 'webhooks', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
	}
	if ( $dep ) {
		$current = $dep['current_production'];
		$drift   = $dep['drift'];
		$kpis[]  = [
			'value'      => $current ? substr( (string) $current['commit_sha'], 0, 7 ) : '—',
			'label'      => __( 'Deployed Commit', 'drywall-toolbox' ),
			'icon'       => 'dashicons-cloud-upload',
			'icon_color' => $current ? 'success' : 'neutral',
			'href'       => add_query_arg( 'tab', 'deployment', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
		$kpis[]  = [
			'value'      => $drift['ok'] ? (string) $drift['ahead_by'] : '?',
			'label'      => __( 'Commits Ahead on GitHub', 'drywall-toolbox' ),
			'icon'       => 'dashicons-migrate',
			'icon_color' => $drift['ok'] && $drift['ahead_by'] > 0 ? 'warning' : 'success',
			'href'       => add_query_arg( 'tab', 'repository', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
		$kpis[]  = [
			'value'      => $dep['in_progress'] ? dtb_release_status_label( $dep['in_progress']['status'] ) : __( 'Idle', 'drywall-toolbox' ),
			'label'      => __( 'Release Status', 'drywall-toolbox' ),
			'icon'       => 'dashicons-update',
			'icon_color' => $dep['in_progress'] ? 'processing' : 'success',
			'href'       => add_query_arg( 'tab', 'deployment', admin_url( 'admin.php?page=dtb-system-manager' ) ),
		];
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( $kpis );

	if ( $dep && $dep['in_progress'] ) {
		ob_start();
		echo dtb_admin_ui_alert( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			sprintf(
				/* translators: 1: release id, 2: status label */
				__( 'Release %1$s is currently %2$s. This console is polling live.', 'drywall-toolbox' ),
				$dep['in_progress']['release_id'],
				dtb_release_status_label( $dep['in_progress']['status'] )
			),
			'warning',
			__( 'Release In Progress', 'drywall-toolbox' )
		);
		echo dtb_deployment_center_render_timeline( $dep['in_progress']['events'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$body = ob_get_clean();
		echo dtb_admin_ui_card( $body, [ 'title' => __( 'Live Release Progress', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	echo '<div class="dtb-grid dtb-grid--two dtb-sm-columns">';

	// Attention Needed.
	$attention = dtb_system_manager_collect_attention( $h, $q, $ih, $wh, $dep );
	ob_start();
	if ( empty( $attention ) ) {
		echo dtb_admin_ui_empty_state( __( 'All Systems Nominal', 'drywall-toolbox' ), __( 'No open issues across platform health, queues, integrations, webhooks, or release management.', 'drywall-toolbox' ), [ 'icon' => 'dashicons-yes-alt' ] );
	} else {
		echo '<ul class="dtb-sm-attention-list">';
		foreach ( $attention as $item ) {
			printf(
				'<li class="dtb-sm-attention-row"><a href="%s">%s<span class="dtb-sm-attention-text">%s</span></a></li>',
				esc_url( $item['href'] ),
				dtb_admin_ui_badge( $item['label'], $item['type'] ),
				esc_html( $item['text'] )
			);
		}
		echo '</ul>';
	}
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Attention Needed', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Recent Activity — merged audit log + release events.
	ob_start();
	$activity = dtb_system_manager_collect_recent_activity( $can_system, $can_deployments, 12 );
	if ( empty( $activity ) ) {
		echo dtb_admin_ui_empty_state( __( 'No Recent Activity', 'drywall-toolbox' ) );
	} else {
		echo dtb_admin_ui_timeline( $activity );
	}
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Recent Activity', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	echo '</div>';
}

/**
 * Aggregate cross-subsystem warnings for the "Attention Needed" panel.
 *
 * @return array<int, array{label:string, type:string, text:string, href:string}>
 */
function dtb_system_manager_collect_attention( ?array $h, ?array $q, ?array $ih, ?array $wh, ?array $dep ): array {
	$base = admin_url( 'admin.php?page=dtb-system-manager' );
	$out  = [];

	if ( $h && ( ! $h['php_ok'] || ! $h['ssl_active'] ) ) {
		$out[] = [ 'label' => __( 'System', 'drywall-toolbox' ), 'type' => 'danger', 'text' => __( 'PHP version or SSL requires attention.', 'drywall-toolbox' ), 'href' => add_query_arg( 'tab', 'system', $base ) ];
	}
	if ( $q && $q['failed'] > 0 ) {
		$out[] = [ 'label' => __( 'Queue', 'drywall-toolbox' ), 'type' => 'danger', 'text' => sprintf( _n( '%d failed queue job.', '%d failed queue jobs.', $q['failed'], 'drywall-toolbox' ), $q['failed'] ), 'href' => add_query_arg( 'tab', 'queues', $base ) ];
	}
	if ( $ih ) {
		foreach ( $ih['integrations'] as $item ) {
			if ( empty( $item['ok'] ) ) {
				$out[] = [ 'label' => __( 'Integration', 'drywall-toolbox' ), 'type' => 'warning', 'text' => sprintf( /* translators: %s: integration name */ __( '%s is not active.', 'drywall-toolbox' ), $item['name'] ), 'href' => add_query_arg( 'tab', 'integrations', $base ) ];
			}
		}
	}
	if ( $wh && $wh['failing'] > 0 ) {
		$out[] = [ 'label' => __( 'Webhook', 'drywall-toolbox' ), 'type' => 'danger', 'text' => sprintf( _n( '%d webhook is failing.', '%d webhooks are failing.', $wh['failing'], 'drywall-toolbox' ), $wh['failing'] ), 'href' => add_query_arg( 'tab', 'webhooks', $base ) ];
	}
	if ( $dep ) {
		if ( ! $dep['github_enabled'] || ! $dep['webhook_enabled'] ) {
			$out[] = [ 'label' => __( 'Release', 'drywall-toolbox' ), 'type' => 'warning', 'text' => __( 'GitHub dispatch or webhook reporting is not configured.', 'drywall-toolbox' ), 'href' => add_query_arg( 'tab', 'deploy-settings', $base ) ];
		}
		if ( $dep['drift']['ok'] && $dep['drift']['ahead_by'] > 0 ) {
			$out[] = [ 'label' => __( 'Release', 'drywall-toolbox' ), 'type' => 'warning', 'text' => sprintf( /* translators: %d: commit count */ __( '%d commit(s) on GitHub are not yet deployed.', 'drywall-toolbox' ), $dep['drift']['ahead_by'] ), 'href' => add_query_arg( 'tab', 'repository', $base ) ];
		}
		if ( $dep['in_progress'] && in_array( $dep['in_progress']['status'], [ 'failed', 'rollback_failed' ], true ) ) {
			$out[] = [ 'label' => __( 'Release', 'drywall-toolbox' ), 'type' => 'danger', 'text' => sprintf( /* translators: %s: release id */ __( 'Release %s needs operator attention.', 'drywall-toolbox' ), $dep['in_progress']['release_id'] ), 'href' => add_query_arg( 'tab', 'history', $base ) ];
		}
	}

	return $out;
}

/**
 * Merge recent audit-log entries and release events into one
 * chronologically sorted activity feed for the Overview timeline.
 *
 * @return array<int, array{time:string, title:string, desc:string, badge:string}>
 */
function dtb_system_manager_collect_recent_activity( bool $can_system, bool $can_deployments, int $limit ): array {
	$items = [];

	if ( $can_system && function_exists( 'dtb_audit_log_get_recent' ) ) {
		foreach ( dtb_audit_log_get_recent( $limit ) as $e ) {
			$ts = (string) ( $e['ts'] ?? '' );
			if ( '' === $ts ) {
				continue;
			}
			$ts_unix = strtotime( $ts . ' UTC' ) ?: 0;
			$items[] = [
				'sort'  => $ts_unix,
				'time'  => sprintf( /* translators: %s: human-readable time difference */ __( '%s ago', 'drywall-toolbox' ), human_time_diff( $ts_unix ) ),
				'title' => (string) ( $e['summary'] ?? $e['action'] ?? '' ),
				'desc'  => '<code>' . esc_html( sanitize_key( (string) ( $e['module'] ?? '' ) ) ) . '</code>',
				'badge' => 'muted',
			];
		}
	}

	if ( $can_deployments && function_exists( 'dtb_release_history_get' ) ) {
		foreach ( dtb_release_history_get( 8 ) as $release ) {
			foreach ( array_slice( $release['events'], -3 ) as $event ) {
				$ts = (string) ( $event['created_at'] ?? '' );
				if ( '' === $ts ) {
					continue;
				}
				$items[] = [
					'sort'  => strtotime( $ts . ' UTC' ) ?: 0,
					'time'  => dtb_time_ago( $ts, true ),
					'title' => sprintf( '%s — %s', $release['release_id'], dtb_release_status_label( dtb_release_status_for_events( [ (string) $event['event_type'] ] ) ) ),
					'desc'  => '<code>' . esc_html( (string) $event['event_type'] ) . '</code>',
					'badge' => str_contains( (string) $event['event_type'], 'failed' ) ? 'danger' : 'primary',
				];
			}
		}
	}

	usort( $items, static fn( array $a, array $b ): int => $b['sort'] <=> $a['sort'] );

	return array_slice( $items, 0, $limit );
}

// ── Platform health tab renderers ───────────────────────────────────────────

function dtb_system_manager_render_system_tab(): void {
	$h = dtb_system_health_get();

	ob_start();
	echo dtb_admin_ui_detail_row( __( 'PHP Version', 'drywall-toolbox' ),
		dtb_admin_ui_badge( esc_html( $h['php_version'] ), $h['php_ok'] ? 'success' : 'danger' ) );
	echo dtb_admin_ui_detail_row( __( 'WordPress Version', 'drywall-toolbox' ), esc_html( $h['wp_version'] ) );
	echo dtb_admin_ui_detail_row( __( 'Memory Limit', 'drywall-toolbox' ),      esc_html( $h['memory_limit'] ) );
	echo dtb_admin_ui_detail_row( __( 'Max Execution', 'drywall-toolbox' ),     esc_html( $h['max_execution_time'] . 's' ) );
	echo dtb_admin_ui_detail_row( __( 'Upload Max Size', 'drywall-toolbox' ),   esc_html( $h['upload_max_filesize'] ) );
	echo dtb_admin_ui_detail_row( __( 'SSL Active', 'drywall-toolbox' ),        dtb_admin_ui_badge( $h['ssl_active'] ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ), $h['ssl_active'] ? 'success' : 'danger' ) );
	echo dtb_admin_ui_detail_row( __( 'WP Debug', 'drywall-toolbox' ),          dtb_admin_ui_badge( $h['wp_debug'] ? 'ON' : 'OFF', $h['wp_debug'] ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'WP Debug Log', 'drywall-toolbox' ),      dtb_admin_ui_badge( $h['wp_debug_log'] ? 'ON' : 'OFF', $h['wp_debug_log'] ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Timezone', 'drywall-toolbox' ),          esc_html( $h['timezone'] ) );
	echo dtb_admin_ui_detail_row( __( 'Site URL', 'drywall-toolbox' ),          esc_html( $h['site_url'] ) );
	$body = ob_get_clean();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'PHP & WordPress Environment', 'drywall-toolbox' ) ] );

	$php_log = (array) ( $h['php_log'] ?? [] );
	$rest    = (array) ( $h['rest'] ?? [] );
	$cache   = (array) ( $h['cache'] ?? [] );
	$proj    = (array) ( $h['projections'] ?? [] );

	ob_start();
	echo dtb_admin_ui_detail_row( __( 'PHP Log', 'drywall-toolbox' ), dtb_admin_ui_badge( ! empty( $php_log['available'] ) ? __( 'Available', 'drywall-toolbox' ) : __( 'Unavailable', 'drywall-toolbox' ), ! empty( $php_log['available'] ) ? 'success' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'PHP Log Size', 'drywall-toolbox' ), esc_html( size_format( (int) ( $php_log['size_bytes'] ?? 0 ) ) ) );
	echo dtb_admin_ui_detail_row( __( 'DTB REST Routes', 'drywall-toolbox' ), dtb_admin_ui_badge( (string) ( $rest['dtb_routes'] ?? 0 ), ( (int) ( $rest['dtb_routes'] ?? 0 ) > 0 ) ? 'success' : 'warning' ) );
	echo dtb_admin_ui_detail_row( __( 'Expired DTB Cache Entries', 'drywall-toolbox' ), dtb_admin_ui_badge( (string) ( $cache['expired_dtb_transients'] ?? 0 ), ( (int) ( $cache['expired_dtb_transients'] ?? 0 ) > 25 ) ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Stale Projections', 'drywall-toolbox' ), dtb_admin_ui_badge( (string) ( $proj['stale'] ?? 0 ), ( (int) ( $proj['stale'] ?? 0 ) > 0 ) ? 'warning' : 'success' ) );
	$ops_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $ops_body, [ 'title' => __( 'Diagnostics Summary', 'drywall-toolbox' ) ] );

	$catalog    = (array) ( $h['catalog'] ?? [] );
	$media      = (array) ( $h['media'] ?? [] );
	$schematics = (array) ( $h['schematics'] ?? [] );
	ob_start();
	echo dtb_admin_ui_detail_row( __( 'Catalog Services', 'drywall-toolbox' ), dtb_admin_ui_badge( ! empty( $catalog['dtb_catalog_available'] ) ? __( 'Available', 'drywall-toolbox' ) : __( 'Missing', 'drywall-toolbox' ), ! empty( $catalog['dtb_catalog_available'] ) ? 'success' : 'warning' ) );
	echo dtb_admin_ui_detail_row( __( 'Uploads Writable', 'drywall-toolbox' ), dtb_admin_ui_badge( ! empty( $media['uploads_writable'] ) ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ), ! empty( $media['uploads_writable'] ) ? 'success' : 'danger' ) );
	echo dtb_admin_ui_detail_row( __( 'Image Sync', 'drywall-toolbox' ), dtb_admin_ui_badge( ! empty( $media['image_sync_available'] ) ? __( 'Available', 'drywall-toolbox' ) : __( 'Missing', 'drywall-toolbox' ), ! empty( $media['image_sync_available'] ) ? 'success' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Schematics', 'drywall-toolbox' ), dtb_admin_ui_badge( ! empty( $schematics['schematics_available'] ) ? __( 'Available', 'drywall-toolbox' ) : __( 'Missing', 'drywall-toolbox' ), ! empty( $schematics['schematics_available'] ) ? 'success' : 'warning' ) );
	$library_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $library_body, [ 'title' => __( 'Catalog, Media & Schematics', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_queues_tab(): void {
	$q = dtb_queue_health_get();
	$c = dtb_cron_health_get();

	// Action Scheduler.
	ob_start();
	echo dtb_admin_ui_detail_row( __( 'Pending', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $q['pending'], $q['pending'] > 50 ? 'warning' : 'neutral' ) );
	echo dtb_admin_ui_detail_row( __( 'Running', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $q['running'], 'processing' ) );
	echo dtb_admin_ui_detail_row( __( 'Failed', 'drywall-toolbox' ),    dtb_admin_ui_badge( (string) $q['failed'], $q['failed'] > 0 ? 'danger' : 'success' ) );
	echo dtb_admin_ui_detail_row( __( 'Completed', 'drywall-toolbox' ), esc_html( number_format( $q['complete'] ) ) );
	echo dtb_admin_ui_detail_row( __( 'Failed Notification Jobs', 'drywall-toolbox' ), dtb_admin_ui_badge( (string) ( $q['failed_notification_jobs'] ?? 0 ), ( (int) ( $q['failed_notification_jobs'] ?? 0 ) > 0 ) ? 'danger' : 'success' ) );
	if ( $q['oldest_pending_seconds'] > 0 ) {
		$mins = round( $q['oldest_pending_seconds'] / 60 );
		echo dtb_admin_ui_detail_row( __( 'Oldest Pending', 'drywall-toolbox' ), dtb_admin_ui_badge( "{$mins}m ago", $mins > 30 ? 'danger' : 'neutral' ) );
	}
	foreach ( array_slice( (array) ( $q['failed_notification_hooks'] ?? [] ), 0, 5 ) as $hook ) {
		echo dtb_admin_ui_detail_row( esc_html( (string) ( $hook['hook'] ?? '' ) ), dtb_admin_ui_badge( (string) ( $hook['count'] ?? 0 ), 'danger' ) );
	}
	$q_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $q_body, [ 'title' => __( 'Action Scheduler Queue', 'drywall-toolbox' ) ] );

	// WP-Cron.
	ob_start();
	echo dtb_admin_ui_detail_row( __( 'WP-Cron Enabled', 'drywall-toolbox' ), dtb_admin_ui_badge( $c['wp_cron_active'] ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ), $c['wp_cron_active'] ? 'success' : 'warning' ) );
	echo dtb_admin_ui_detail_row( __( 'Overdue Events', 'drywall-toolbox' ),   dtb_admin_ui_badge( (string) $c['overdue_count'], $c['overdue_count'] > 0 ? 'danger' : 'success' ) );
	foreach ( array_slice( $c['overdue'], 0, 5 ) as $ev ) {
		$mins = round( $ev['overdue_s'] / 60 );
		echo dtb_admin_ui_detail_row( esc_html( $ev['hook'] ), dtb_admin_ui_badge( "{$mins}m overdue", 'danger' ) );
	}
	$c_body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $c_body, [ 'title' => __( 'WP-Cron', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_integrations_tab(): void {
	$ih = dtb_integration_health_get();

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Integration', 'drywall-toolbox' ), 'key' => 'name' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),      'key' => 'ok' ],
		[ 'label' => __( 'Version', 'drywall-toolbox' ),     'key' => 'version' ],
	], [] );
	foreach ( $ih['integrations'] as $item ) {
		echo '<tr>';
		echo '<td>' . esc_html( $item['name'] ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( $item['ok'] ? __( 'Active', 'drywall-toolbox' ) : __( 'Missing', 'drywall-toolbox' ), $item['ok'] ? 'success' : 'danger' ) . '</td>';
		echo '<td>' . esc_html( $item['version'] ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Integration Health', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_webhooks_tab(): void {
	$wh = dtb_webhook_health_get();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( [
		[ 'value' => $wh['total'],   'label' => __( 'Total Webhooks', 'drywall-toolbox' ) ],
		[ 'value' => $wh['active'],  'label' => __( 'Active', 'drywall-toolbox' ), 'icon_color' => 'success' ],
		[ 'value' => $wh['failing'], 'label' => __( 'Failing', 'drywall-toolbox' ), 'icon_color' => $wh['failing'] > 0 ? 'danger' : 'success' ],
	] );

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Name', 'drywall-toolbox' ),          'key' => 'name' ],
		[ 'label' => __( 'Topic', 'drywall-toolbox' ),         'key' => 'topic' ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ),        'key' => 'status' ],
		[ 'label' => __( 'Failures', 'drywall-toolbox' ),      'key' => 'failure_count' ],
	], [] );
	foreach ( $wh['webhooks'] as $w ) {
		echo '<tr>';
		echo '<td>' . esc_html( $w['name'] ) . '</td>';
		echo '<td>' . esc_html( $w['topic'] ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( esc_html( $w['status'] ), $w['status'] === 'active' ? 'success' : 'neutral' ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( (string) $w['failure_count'], $w['failure_count'] > 0 ? 'danger' : 'neutral' ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Registered Webhooks', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_audit_tab(): void {
	$entries = dtb_audit_log_get_recent( 50 );

	if ( empty( $entries ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No Audit Events', 'drywall-toolbox' ), __( 'Audit entries will appear here as admin actions are taken.', 'drywall-toolbox' ) );
		return;
	}

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Time (UTC)', 'drywall-toolbox' ), 'key' => 'ts' ],
		[ 'label' => __( 'Module', 'drywall-toolbox' ),     'key' => 'module' ],
		[ 'label' => __( 'Record', 'drywall-toolbox' ),     'key' => 'record_id' ],
		[ 'label' => __( 'User', 'drywall-toolbox' ),       'key' => 'user_id' ],
		[ 'label' => __( 'Action', 'drywall-toolbox' ),     'key' => 'action' ],
		[ 'label' => __( 'Source', 'drywall-toolbox' ),     'key' => 'source' ],
	], [] );
	foreach ( $entries as $e ) {
		$user_id = absint( $e['user_id'] ?? 0 );
		$user    = $user_id ? get_userdata( $user_id ) : false;
		$actor   = ! empty( $e['actor_label'] ) ? (string) $e['actor_label'] : ( $user ? $user->display_name : ( $user_id ? '#' . $user_id : __( 'System', 'drywall-toolbox' ) ) );
		$module  = sanitize_key( (string) ( $e['module'] ?? '' ) );
		$record  = absint( $e['record_id'] ?? 0 );
		$summary = (string) ( $e['summary'] ?? $e['action'] ?? '' );

		echo '<tr>';
		echo '<td>' . esc_html( (string) ( $e['ts'] ?? '' ) ) . '</td>';
		echo '<td>' . ( $module ? esc_html( $module ) : '&mdash;' ) . '</td>';
		echo '<td>' . ( $record ? esc_html( '#' . $record ) : '&mdash;' ) . '</td>';
		echo '<td>' . esc_html( $actor ) . '</td>';
		echo '<td><strong>' . esc_html( $summary ) . '</strong><br><code>' . esc_html( (string) ( $e['action'] ?? '' ) ) . '</code></td>';
		echo '<td>' . esc_html( (string) ( $e['source'] ?? '' ) ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Recent Audit Events', 'drywall-toolbox' ) ] );
}

function dtb_system_manager_render_logs_tab(): void {
	$log = dtb_system_php_log_tail( 200 );

	ob_start();
	echo dtb_admin_ui_detail_row(
		__( 'Status', 'drywall-toolbox' ),
		dtb_admin_ui_badge(
			! empty( $log['available'] ) ? __( 'Readable', 'drywall-toolbox' ) : __( 'Unavailable', 'drywall-toolbox' ),
			! empty( $log['available'] ) ? 'success' : 'warning'
		)
	);
	echo dtb_admin_ui_detail_row( __( 'Path', 'drywall-toolbox' ), $log['path'] ? '<code>' . esc_html( $log['path'] ) . '</code>' : '&mdash;' );
	echo dtb_admin_ui_detail_row( __( 'Size', 'drywall-toolbox' ), esc_html( size_format( (int) ( $log['size_bytes'] ?? 0 ) ) ) );
	echo dtb_admin_ui_detail_row( __( 'Modified', 'drywall-toolbox' ), $log['modified_gmt'] ? esc_html( $log['modified_gmt'] ) : '&mdash;' );
	$summary = ob_get_clean();

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $summary, [ 'title' => __( 'Debug Log Source', 'drywall-toolbox' ) ] );

	if ( empty( $log['available'] ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'Debug Log Unavailable', 'drywall-toolbox' ),
			esc_html( (string) ( $log['error'] ?? __( 'Enable WP_DEBUG_LOG or make the configured log path readable.', 'drywall-toolbox' ) ) )
		);
		return;
	}

	$lines = (array) ( $log['lines'] ?? [] );
	if ( empty( $lines ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'Debug Log Empty', 'drywall-toolbox' ), __( 'No log entries were found in the readable log file.', 'drywall-toolbox' ) );
		return;
	}

	$body = '<pre class="dtb-system-log-tail" style="max-height:560px;overflow:auto;white-space:pre-wrap;word-break:break-word;margin:0;font-size:12px;line-height:1.55;">'
		. esc_html( implode( "\n", $lines ) )
		. '</pre>';

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Latest Log Entries', 'drywall-toolbox' ) ] );
}
