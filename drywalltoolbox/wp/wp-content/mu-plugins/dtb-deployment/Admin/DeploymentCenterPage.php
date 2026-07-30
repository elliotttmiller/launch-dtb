<?php
/**
 * Admin — DeploymentCenterPage
 *
 * Renders dtb-deployment-center — the Release Management console. Tabs:
 * Overview | History | Rollback | Settings.
 *
 * Production status is read directly from the wp_dtb_release_events log
 * (reported by .github/workflows/release-siteground.yml) and from the
 * GitHub API (repository drift, recent workflow runs). Deploy/rollback
 * actions dispatch the release workflow; this page never talks to
 * SiteGround directly.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_deployment_center_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_deployments' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$active_tab = sanitize_key( $_GET['tab'] ?? 'overview' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	$base_url = admin_url( 'admin.php?page=dtb-deployment-center' );
	$tabs = [
		[ 'id' => 'overview', 'label' => __( 'Overview', 'drywall-toolbox' ), 'active' => 'overview' === $active_tab, 'url' => add_query_arg( 'tab', 'overview', $base_url ) ],
		[ 'id' => 'history',  'label' => __( 'History', 'drywall-toolbox' ),  'active' => 'history' === $active_tab,  'url' => add_query_arg( 'tab', 'history', $base_url ) ],
		[ 'id' => 'rollback', 'label' => __( 'Rollback', 'drywall-toolbox' ), 'active' => 'rollback' === $active_tab, 'url' => add_query_arg( 'tab', 'rollback', $base_url ) ],
		[ 'id' => 'settings', 'label' => __( 'Settings', 'drywall-toolbox' ), 'active' => 'settings' === $active_tab, 'url' => add_query_arg( 'tab', 'settings', $base_url ) ],
	];

	dtb_admin_shell_open( [
		'title'       => __( 'Deployment Center', 'drywall-toolbox' ),
		'subtitle'    => __( 'Release Management for the production WordPress application tree via the official SiteGround Git repository.', 'drywall-toolbox' ),
		'section'     => 'operations',
		'page'        => 'dtb-deployment-center',
		'template'    => 'dashboard',
		'icon'        => 'dashicons-cloud-upload',
		'tabs'        => $tabs,
		'live_target' => 'dtb-deployment-workspace',
	] );

	dtb_admin_shell_live_region_open( [
		'id'       => 'dtb-deployment-workspace',
		'module'   => 'deployment-center',
		'endpoint' => add_query_arg( 'tab', $active_tab, rest_url( 'dtb/v1/admin/deployment' ) ),
		'interval' => 15000,
	] );

	switch ( $active_tab ) {
		case 'history':
			dtb_deployment_center_render_history_tab();
			break;
		case 'rollback':
			dtb_deployment_center_render_rollback_tab();
			break;
		case 'settings':
			dtb_deployment_center_render_settings_tab();
			break;
		default:
			dtb_deployment_center_render_overview_tab();
			break;
	}

	dtb_admin_shell_live_region_close();
	dtb_deployment_center_render_script();
	dtb_admin_shell_close();
}

// ── Tab renderers ───────────────────────────────────────────────────────────

function dtb_deployment_center_render_overview_tab(): void {
	$overview = dtb_deployment_overview_get();
	$current  = $overview['current_production'];
	$progress = $overview['in_progress'];
	$drift    = $overview['drift'];

	echo dtb_admin_ui_kpi_grid( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[
			'value' => $current ? substr( (string) $current['commit_sha'], 0, 7 ) : '—',
			'label' => __( 'Deployed Commit', 'drywall-toolbox' ),
			'icon'  => 'dashicons-yes-alt',
			'icon_color' => $current ? 'success' : 'neutral',
		],
		[
			'value' => $current ? human_time_diff( strtotime( $current['updated_at'] . ' UTC' ) ) . ' ago' : '—',
			'label' => __( 'Deployed', 'drywall-toolbox' ),
			'icon'  => 'dashicons-clock',
		],
		[
			'value' => $drift['ok'] ? (string) $drift['ahead_by'] : '?',
			'label' => __( 'Commits Ahead on GitHub', 'drywall-toolbox' ),
			'icon'  => 'dashicons-migrate',
			'icon_color' => $drift['ok'] && $drift['ahead_by'] > 0 ? 'warning' : 'success',
		],
		[
			'value' => $progress ? dtb_release_status_label( $progress['status'] ) : __( 'Idle', 'drywall-toolbox' ),
			'label' => __( 'Release In Progress', 'drywall-toolbox' ),
			'icon'  => 'dashicons-update',
			'icon_color' => $progress ? 'processing' : 'success',
		],
	] );

	if ( $progress ) {
		ob_start();
		echo dtb_admin_ui_alert( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			sprintf(
				/* translators: 1: release id, 2: status label */
				__( 'Release %1$s is currently %2$s. This panel refreshes automatically.', 'drywall-toolbox' ),
				$progress['release_id'],
				dtb_release_status_label( $progress['status'] )
			),
			'warning',
			__( 'Release In Progress', 'drywall-toolbox' )
		);
		echo dtb_deployment_center_render_timeline( $progress['events'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$body = ob_get_clean();
		echo dtb_admin_ui_card( $body, [ 'title' => __( 'Live Release Progress', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	ob_start();
	if ( $current ) {
		echo dtb_admin_ui_detail_row( __( 'Commit', 'drywall-toolbox' ), '<code>' . esc_html( (string) $current['commit_sha'] ) . '</code>' );
		echo dtb_admin_ui_detail_row( __( 'Ref', 'drywall-toolbox' ), esc_html( (string) $current['ref'] ) );
		echo dtb_admin_ui_detail_row( __( 'Release ID', 'drywall-toolbox' ), '<code>' . esc_html( (string) $current['release_id'] ) . '</code>' );
		echo dtb_admin_ui_detail_row( __( 'Actor', 'drywall-toolbox' ), esc_html( (string) ( $current['actor'] ?: '—' ) ) );
		echo dtb_admin_ui_detail_row( __( 'Kind', 'drywall-toolbox' ), dtb_admin_ui_badge( ucfirst( (string) $current['kind'] ), 'deploy' === $current['kind'] ? 'primary' : 'info' ) );
	} else {
		echo dtb_admin_ui_empty_state( __( 'No Recorded Production Release', 'drywall-toolbox' ), __( 'Dispatch the first release below, or check that DTB_DEPLOYMENT_WEBHOOK_SECRET is configured.', 'drywall-toolbox' ) );
	}
	echo dtb_admin_ui_detail_row( __( 'GitHub Default Branch', 'drywall-toolbox' ), $drift['github_branch'] ? '<code>' . esc_html( $drift['github_branch'] ) . '@' . esc_html( substr( (string) $drift['github_sha'], 0, 7 ) ) . '</code>' : '—' );
	if ( ! $drift['ok'] && $drift['error'] ) {
		echo dtb_admin_ui_alert( esc_html( $drift['error'] ), 'info' );
	}
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Production Status', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Deploy action.
	ob_start();
	if ( ! $overview['github_enabled'] || ! $overview['webhook_enabled'] ) {
		echo dtb_admin_ui_alert( __( 'GitHub dispatch and/or webhook reporting is not fully configured yet. See the Settings tab.', 'drywall-toolbox' ), 'warning' );
	}
	?>
	<div class="dtb-field">
		<label class="dtb-label" for="dtb-deploy-ref"><?php esc_html_e( 'Branch, tag, or commit SHA', 'drywall-toolbox' ); ?></label>
		<?php echo dtb_admin_ui_input( 'ref', 'main', [ 'id' => 'dtb-deploy-ref', 'placeholder' => 'main' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<?php
	echo dtb_admin_ui_button( __( 'Deploy to Production', 'drywall-toolbox' ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'type' => 'primary',
		'id'   => 'dtb-deploy-dispatch',
		'icon' => 'dashicons-cloud-upload',
		'disabled' => (bool) $progress,
	] );
	echo '<span id="dtb-deploy-status" class="dtb-cache-status" aria-live="polite"></span>';
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'    => __( 'Deploy a Release', 'drywall-toolbox' ),
		'subtitle' => __( 'Runs plan, validate, backup, deploy, and verify against the official SiteGround Git repository.', 'drywall-toolbox' ),
	] );
}

function dtb_deployment_center_render_history_tab(): void {
	$releases = dtb_release_history_get( 50 );

	if ( empty( $releases ) ) {
		echo dtb_admin_ui_empty_state( __( 'No Releases Yet', 'drywall-toolbox' ), __( 'Dispatch a release from the Overview tab to begin building history.', 'drywall-toolbox' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		return;
	}

	ob_start();
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Release', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Kind', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Ref / Commit', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Status', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Actor', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Started', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Updated', 'drywall-toolbox' ) ],
	], [] );

	foreach ( $releases as $release ) {
		echo '<tr>';
		echo '<td><code>' . esc_html( (string) $release['release_id'] ) . '</code></td>';
		echo '<td>' . dtb_admin_ui_badge( ucfirst( (string) $release['kind'] ), 'deploy' === $release['kind'] ? 'primary' : 'info' ) . '</td>';
		echo '<td>' . esc_html( (string) $release['ref'] ) . ( $release['commit_sha'] ? ' <code>' . esc_html( substr( (string) $release['commit_sha'], 0, 7 ) ) . '</code>' : '' ) . '</td>';
		echo '<td>' . dtb_admin_ui_badge( (string) $release['status_label'], (string) $release['badge_type'] ) . '</td>';
		echo '<td>' . esc_html( (string) ( $release['actor'] ?: '—' ) ) . '</td>';
		echo '<td>' . esc_html( (string) $release['started_at'] ) . '</td>';
		echo '<td>' . esc_html( (string) $release['updated_at'] ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close();
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Release History', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function dtb_deployment_center_render_rollback_tab(): void {
	$restorable_statuses = [ 'validated', 'backed_up', 'deploying', 'deployed', 'verified', 'completed' ];
	$candidates = array_values( array_filter(
		dtb_release_history_get( 50 ),
		static fn( array $r ): bool => 'deploy' === $r['kind'] && in_array( $r['status'], $restorable_statuses, true )
	) );

	if ( empty( $candidates ) ) {
		echo dtb_admin_ui_empty_state( __( 'No Restorable Releases', 'drywall-toolbox' ), __( 'A release must reach at least a validated manifest before it can be restored.', 'drywall-toolbox' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		return;
	}

	$options = [ '' => __( 'Select a release…', 'drywall-toolbox' ) ];
	foreach ( $candidates as $release ) {
		$options[ $release['release_id'] ] = sprintf(
			'%s — %s (%s)',
			$release['release_id'],
			$release['ref'],
			dtb_release_status_label( $release['status'] )
		);
	}

	ob_start();
	echo dtb_admin_ui_alert( __( 'Restoring a release replays its exact GitHub-tagged manifest — production is returned to that release\'s recorded state, not an ad hoc file replacement.', 'drywall-toolbox' ), 'info' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	?>
	<div class="dtb-field">
		<label class="dtb-label" for="dtb-rollback-release"><?php esc_html_e( 'Release to restore', 'drywall-toolbox' ); ?></label>
		<?php echo dtb_admin_ui_select( 'release_id', $options, '', [ 'id' => 'dtb-rollback-release' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<?php
	echo dtb_admin_ui_button( __( 'Restore This Release', 'drywall-toolbox' ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'type' => 'danger',
		'id'   => 'dtb-rollback-dispatch',
		'icon' => 'dashicons-undo',
	] );
	echo '<span id="dtb-rollback-status" class="dtb-cache-status" aria-live="polite"></span>';
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Restore a Prior Release', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function dtb_deployment_center_render_settings_tab(): void {
	$policy = [
		'owned_paths'     => dtb_deployment_owned_paths(),
		'protected_paths' => dtb_deployment_protected_paths(),
		'github_enabled'  => dtb_deployment_github_enabled(),
		'webhook_enabled' => dtb_deployment_webhook_configured(),
	];

	ob_start();
	echo dtb_admin_ui_detail_row( __( 'GitHub Dispatch (wp-admin → GitHub Actions)', 'drywall-toolbox' ), dtb_admin_ui_badge( $policy['github_enabled'] ? __( 'Configured', 'drywall-toolbox' ) : __( 'Not Configured', 'drywall-toolbox' ), $policy['github_enabled'] ? 'success' : 'warning' ) );
	echo dtb_admin_ui_detail_row( __( 'Release Webhook (GitHub Actions → wp-admin)', 'drywall-toolbox' ), dtb_admin_ui_badge( $policy['webhook_enabled'] ? __( 'Configured', 'drywall-toolbox' ) : __( 'Not Configured', 'drywall-toolbox' ), $policy['webhook_enabled'] ? 'success' : 'warning' ) );
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Integration Status', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	ob_start();
	echo '<p><strong>' . esc_html__( 'wp-config.php constants', 'drywall-toolbox' ) . '</strong></p><ul>';
	foreach ( [ 'DTB_DEPLOYMENT_WEBHOOK_SECRET', 'DTB_GITHUB_DEPLOYMENT_TOKEN', 'DTB_GITHUB_REPO_OWNER (optional)', 'DTB_GITHUB_REPO_NAME (optional)' ] as $c ) {
		echo '<li><code>' . esc_html( $c ) . '</code></li>';
	}
	echo '</ul><p><strong>' . esc_html__( 'GitHub Actions repository secrets', 'drywall-toolbox' ) . '</strong></p><ul>';
	foreach ( [ 'SITEGROUND_GIT_REMOTE', 'SITEGROUND_GIT_BRANCH', 'SITEGROUND_GIT_SSH_PRIVATE_KEY', 'SITEGROUND_GIT_KNOWN_HOSTS', 'DTB_DEPLOYMENT_WEBHOOK_SECRET' ] as $s ) {
		echo '<li><code>' . esc_html( $s ) . '</code></li>';
	}
	echo '</ul>';
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Required Manual Setup', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	ob_start();
	echo '<p><strong>' . esc_html__( 'Owned (writable) paths', 'drywall-toolbox' ) . '</strong></p><ul>';
	foreach ( $policy['owned_paths'] as $p ) {
		echo '<li><code>' . esc_html( $p ) . '</code></li>';
	}
	echo '</ul><p><strong>' . esc_html__( 'Protected paths (never touched)', 'drywall-toolbox' ) . '</strong></p><ul>';
	foreach ( $policy['protected_paths'] as $p ) {
		echo '<li><code>' . esc_html( $p ) . '</code></li>';
	}
	echo '</ul>';
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => __( 'Release Boundary Policy', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Render an event timeline for a single release using the shared timeline widget.
 *
 * @param array<int,array<string,mixed>> $events
 */
function dtb_deployment_center_render_timeline( array $events ): string {
	$items = array_map(
		static function ( array $event ): array {
			return [
				'time'  => (string) $event['created_at'],
				'title' => dtb_release_status_label( dtb_release_status_for_events( [ (string) $event['event_type'] ] ) ),
				'desc'  => '<code>' . esc_html( (string) $event['event_type'] ) . '</code>',
				'badge' => str_contains( (string) $event['event_type'], 'failed' ) ? 'danger' : 'primary',
			];
		},
		$events
	);

	return dtb_admin_ui_timeline( $items );
}

/**
 * Inline admin script: wires the Deploy/Rollback buttons to the Deployment
 * Center REST API via the shared DtbAdmin.apiFetch() helper.
 */
function dtb_deployment_center_render_script(): void {
	?>
	<script>
	( function () {
		document.addEventListener( 'DOMContentLoaded', function () {
			var deployBtn = document.getElementById( 'dtb-deploy-dispatch' );
			if ( deployBtn ) {
				deployBtn.addEventListener( 'click', function () {
					var refEl = document.getElementById( 'dtb-deploy-ref' );
					var ref = refEl ? refEl.value.trim() : '';
					if ( ! ref ) { window.alert( 'Enter a branch, tag, or commit SHA.' ); return; }
					var confirmText = window.prompt( 'Type DEPLOY to confirm releasing "' + ref + '" to production:' );
					if ( 'DEPLOY' !== confirmText ) { return; }

					var statusEl = document.getElementById( 'dtb-deploy-status' );
					deployBtn.disabled = true;
					if ( statusEl ) statusEl.textContent = 'Dispatching…';

					window.DtbAdmin.apiFetch( '/dtb/v1/deployment/dispatch/deploy', {
						method: 'POST',
						body: JSON.stringify( { ref: ref, confirm: 'DEPLOY' } ),
					} ).then( function ( data ) {
						if ( statusEl ) statusEl.textContent = data.message || 'Dispatched.';
					} ).catch( function ( err ) {
						if ( statusEl ) statusEl.textContent = ( err && err.message ) || 'Dispatch failed.';
					} ).finally( function () {
						deployBtn.disabled = false;
					} );
				} );
			}

			var rollbackBtn = document.getElementById( 'dtb-rollback-dispatch' );
			if ( rollbackBtn ) {
				rollbackBtn.addEventListener( 'click', function () {
					var selectEl = document.getElementById( 'dtb-rollback-release' );
					var releaseId = selectEl ? selectEl.value : '';
					if ( ! releaseId ) { window.alert( 'Select a release to restore.' ); return; }
					var confirmText = window.prompt( 'Type ROLLBACK to confirm restoring "' + releaseId + '" to production:' );
					if ( 'ROLLBACK' !== confirmText ) { return; }

					var statusEl = document.getElementById( 'dtb-rollback-status' );
					rollbackBtn.disabled = true;
					if ( statusEl ) statusEl.textContent = 'Dispatching…';

					window.DtbAdmin.apiFetch( '/dtb/v1/deployment/dispatch/rollback', {
						method: 'POST',
						body: JSON.stringify( { release_id: releaseId, confirm: 'ROLLBACK' } ),
					} ).then( function ( data ) {
						if ( statusEl ) statusEl.textContent = data.message || 'Dispatched.';
					} ).catch( function ( err ) {
						if ( statusEl ) statusEl.textContent = ( err && err.message ) || 'Dispatch failed.';
					} ).finally( function () {
						rollbackBtn.disabled = false;
					} );
				} );
			}
		} );
	} )();
	</script>
	<?php
}
