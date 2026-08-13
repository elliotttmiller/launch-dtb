<?php
/**
 * DTB Schematics bootstrap.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Data.
dtb_module_require( 'dtb-schematics/Data/SkuSchematicMap.php' );

// Domain.
dtb_module_require( 'dtb-schematics/Domain/Schematic.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicAsset.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicBrand.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPart.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicLifecycleStatus.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPageDefinition.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPreviewPolicy.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPartRelationship.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicRecordEntity.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPublicationRules.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicAssetDisposition.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicHotspotDataset.php' );

// Infrastructure.
dtb_module_require( 'dtb-schematics/Infrastructure/WordPressMediaStore.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicPostType.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicRecordRepository.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicAttachmentRepository.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicSourceManifestReader.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicReconciliationStateStore.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicHotspotDatasetReader.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicHotspotDatasetRepository.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicActivitySchemaInstaller.php' );

// Validation and services.
dtb_module_require( 'dtb-schematics/Validation/SchematicBrandValidator.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicFallbackResolver.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicPartResolver.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicAttachmentProcessor.php' );

// Application.
dtb_module_require( 'dtb-schematics/Application/RegisterSchematicUploads.php' );
dtb_module_require( 'dtb-schematics/Application/ResolveSchematicParts.php' );
dtb_module_require( 'dtb-schematics/Application/ManageSchematicRecord.php' );
dtb_module_require( 'dtb-schematics/Application/GenerateSchematicResponse.php' );
dtb_module_require( 'dtb-schematics/Application/ReconcileSchematicSource.php' );
dtb_module_require( 'dtb-schematics/Application/ReconcileSchematicSourceCli.php' );
dtb_module_require( 'dtb-schematics/Application/ResolveSchematicPartOccurrences.php' );
dtb_module_require( 'dtb-schematics/Application/MigrateSchematicHotspotDatasets.php' );
dtb_module_require( 'dtb-schematics/Application/MigrateSchematicHotspotDatasetsCli.php' );
dtb_module_require( 'dtb-schematics/Application/RecordSchematicActivity.php' );

// REST.
dtb_module_require( 'dtb-schematics/Rest/SchematicPublicApiController.php' );

// Admin.
dtb_module_require( 'dtb-schematics/Admin/SchematicAdminMenu.php' );

// Admin — Schematics Pipeline Suite (Phase 6). SuiteShell.php defines the
// `dtb_schematics_render_page()` callback registered by
// dtb-platform/Admin/ToolLibraryMenu.php for the `dtb-schematics` page slug.
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/SuiteMetrics.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/SuiteShell.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/SuiteActions.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/OverviewScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/InventoryScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/DetailScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/AssetsScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/HotspotDataScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/ProductRelationshipsScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/ReconciliationScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/PublicationScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/ActivityScreen.php' );
dtb_module_require( 'dtb-schematics/Admin/PipelineSuite/ConfigurationScreen.php' );
