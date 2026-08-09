<?php
/**
 * BrikPanel - Product Media / Variation Gallery integration.
 *
 * Provides the BrikPanel product-editor media workspace in wp-admin and, when
 * enabled, injects extra variation gallery images into WooCommerce variation
 * data on the storefront.
 *
 * @package BrikPanel
 * @since 1.6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (get_option('brikpanel_simple_product_editor', 'yes') !== 'yes') {
    return;
}

/**
 * Load the Product Media Studio only on BrikPanel's product editor.
 *
 * The studio is a progressive enhancement over the existing editor DOM. It
 * deliberately reuses the current parent-gallery and variation-gallery event
 * handlers so WooCommerce remains the persistence authority and no parallel
 * media save path is introduced.
 */
add_action('admin_enqueue_scripts', function () {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->id !== 'admin_page_brikpanel-product-editor') {
        return;
    }

    $base_url = plugin_dir_url(__FILE__);
    $base_dir = plugin_dir_path(__FILE__);
    $css_file = $base_dir . 'brikpanel-product-media-studio.css';
    $js_file  = $base_dir . 'brikpanel-product-media-studio.js';

    if (is_readable($css_file)) {
        wp_enqueue_style(
            'brikpanel-product-media-studio',
            $base_url . 'brikpanel-product-media-studio.css',
            [],
            (string) filemtime($css_file)
        );
    }

    if (is_readable($js_file)) {
        wp_enqueue_script(
            'brikpanel-product-media-studio',
            $base_url . 'brikpanel-product-media-studio.js',
            ['jquery', 'jquery-ui-sortable', 'media-editor'],
            (string) filemtime($js_file),
            true
        );

        wp_localize_script(
            'brikpanel-product-media-studio',
            'brikpanelMediaStudio',
            [
                'variationGalleryEnabled' => get_option('brikpanel_variation_gallery_enabled', 'yes') === 'yes',
                'i18n' => [
                    'studio_label'             => __('Product media studio', 'brikpanel'),
                    'eyebrow'                  => __('Product media', 'brikpanel'),
                    'title'                    => __('Product Media Studio', 'brikpanel'),
                    'description'              => __('Order primary and gallery images, then manage each variation gallery from the same workspace.', 'brikpanel'),
                    'tabs_label'               => __('Media editor views', 'brikpanel'),
                    'product_gallery'          => __('Product gallery', 'brikpanel'),
                    'variations'               => __('Variations', 'brikpanel'),
                    'variation_galleries'      => __('Variation galleries', 'brikpanel'),
                    'product_hint'             => __('Drag images to reorder. The first image is the product primary image.', 'brikpanel'),
                    'variation_hint'           => __('Open a variation to add, remove, preview, and reorder its images.', 'brikpanel'),
                    'dialog_hint'              => __('Drag to set gallery order. The first image becomes the variation primary image.', 'brikpanel'),
                    'variation_gallery_order'  => __('Variation image order', 'brikpanel'),
                    'add_images'               => __('Add images', 'brikpanel'),
                    'manage'                   => __('Manage', 'brikpanel'),
                    'manage_variation_images'  => __('Manage variation images', 'brikpanel'),
                    'primary_image'            => __('Primary product image', 'brikpanel'),
                    'gallery_image'            => __('Gallery image', 'brikpanel'),
                    'variation'                => __('Variation', 'brikpanel'),
                    'images'                   => __('images', 'brikpanel'),
                    'one_image'                => __('1 image', 'brikpanel'),
                    'no_sku'                   => __('No SKU', 'brikpanel'),
                    'no_variations'            => __('No variations yet', 'brikpanel'),
                    'no_variations_hint'       => __('Generate product variations first, then their image galleries will appear here.', 'brikpanel'),
                ],
            ]
        );
    }
}, 30);

// The storefront projection can be disabled independently from the admin media
// editor. Keeping this gate below the admin enqueue lets simple/parent gallery
// editing remain available even when variation-gallery storefront behavior is
// intentionally switched off.
if (get_option('brikpanel_variation_gallery_enabled', 'yes') !== 'yes') {
    return;
}

/**
 * Add variation gallery image data to the variation JSON sent to the frontend.
 */
add_filter('woocommerce_available_variation', function ($data, $product, $variation) {
    $gallery_ids = get_post_meta($variation->get_id(), '_brikpanel_variation_gallery', true);

    if (empty($gallery_ids) || !is_array($gallery_ids)) {
        $data['brikpanel_gallery_images'] = [];
        return $data;
    }

    $images = [];
    foreach ($gallery_ids as $id) {
        $id = (int) $id;
        if (!$id) {
            continue;
        }

        $src    = wp_get_attachment_image_url($id, 'woocommerce_single');
        $full   = wp_get_attachment_image_url($id, 'full');
        $thumb  = wp_get_attachment_image_url($id, 'woocommerce_gallery_thumbnail');
        $srcset = wp_get_attachment_image_srcset($id, 'woocommerce_single');
        $sizes  = wp_get_attachment_image_sizes($id, 'woocommerce_single');
        $alt    = get_post_meta($id, '_wp_attachment_image_alt', true);

        if (!$src) {
            continue;
        }

        $images[] = [
            'src'           => $src,
            'full_src'      => $full ?: $src,
            'thumbnail_src' => $thumb ?: $src,
            'srcset'        => $srcset ?: '',
            'sizes'         => $sizes ?: '',
            'alt'           => $alt ?: '',
        ];
    }

    $data['brikpanel_gallery_images'] = $images;
    return $data;
}, 10, 3);

/**
 * Enqueue the frontend gallery swap script on single product pages.
 */
add_action('wp_enqueue_scripts', function () {
    if (!is_product()) {
        return;
    }

    wp_enqueue_script(
        'brikpanel_variation_gallery',
        BRIKPANEL_URL . 'front-end/products/brikpanel-variation-gallery.js',
        ['jquery'],
        BRIKPANEL_VERSION,
        true
    );
});
