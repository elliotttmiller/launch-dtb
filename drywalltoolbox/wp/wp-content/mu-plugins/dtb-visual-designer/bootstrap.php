<?php
/**
 * dtb-visual-designer — bootstrap.
 *
 * DTB Visual UI Designer: wp-admin authoring subsystem for the presentation
 * layer of the React storefront (design tokens + registered component visual
 * properties). Owns: registry, schemas, drafts, revisions, publish/rollback,
 * preview authorization, audit, and REST contracts.
 *
 * Ownership boundary: this module never becomes an alternate checkout, cart,
 * order, pricing, or business-rule authority. It only stores and resolves
 * presentation configuration that the React storefront applies on top of its
 * own components and repository-default styling.
 *
 * Loads after dtb-platform (capabilities, admin shell, audit log) and
 * dtb-commerce/dtb-order-platform so checkout-critical surface metadata can
 * reference their real route/component names.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Domain — registries and schema contracts (no WordPress side effects at load).
require_once __DIR__ . '/Domain/PropertyTypes.php';
require_once __DIR__ . '/Domain/ConfigSchema.php';
require_once __DIR__ . '/Domain/SurfaceRegistry.php';
require_once __DIR__ . '/Domain/TokenRegistry.php';

// Infrastructure — schema install + repositories.
require_once __DIR__ . '/Infrastructure/DesignSchemaInstaller.php';
require_once __DIR__ . '/Infrastructure/DraftRepository.php';
require_once __DIR__ . '/Infrastructure/RevisionRepository.php';
require_once __DIR__ . '/Infrastructure/PublishedPointerRepository.php';
require_once __DIR__ . '/Infrastructure/PreviewSessionRepository.php';

// Application — deterministic resolution + workflow services.
require_once __DIR__ . '/Application/AuditEvents.php';
require_once __DIR__ . '/Application/ConfigResolver.php';
require_once __DIR__ . '/Application/DraftService.php';
require_once __DIR__ . '/Application/PublishService.php';
require_once __DIR__ . '/Application/RollbackService.php';
require_once __DIR__ . '/Application/PreviewAuthService.php';
require_once __DIR__ . '/Application/ImportExportService.php';

// Registrations — concrete surfaces + tokens registered against the active
// React storefront and DTB design system. Must load before REST/Admin so the
// registry is populated before any request is served.
require_once __DIR__ . '/Registrations/TokenDefinitions.php';
require_once __DIR__ . '/Registrations/SurfaceDefinitions.php';

// REST
require_once __DIR__ . '/Rest/RestHelpers.php';
require_once __DIR__ . '/Rest/RegistryController.php';
require_once __DIR__ . '/Rest/PublishedConfigController.php';
require_once __DIR__ . '/Rest/DraftController.php';
require_once __DIR__ . '/Rest/PreviewController.php';
require_once __DIR__ . '/Rest/RevisionController.php';
require_once __DIR__ . '/Rest/ImportExportController.php';

// Admin UI (only in admin context).
// The `dtb_manage_visual_designer` capability is granted centrally by
// dtb-platform/Admin/AdminCapabilities.php per that file's canonical-registry
// convention — see dtb_admin_all_capabilities() / dtb_admin_role_capability_map().
if ( is_admin() ) {
	require_once __DIR__ . '/Admin/DesignerPage.php';
}
