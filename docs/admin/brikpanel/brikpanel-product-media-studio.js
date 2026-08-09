/*
 * BrikPanel Product Media Studio
 *
 * Progressive enhancement for the existing BrikPanel product editor.
 * Keeps the current WooCommerce/BrikPanel persistence contract intact while
 * presenting parent and variation image galleries as one focused workspace.
 */
(function ($) {
    'use strict';

    var CFG = window.brikpanelMediaStudio || {};
    var SELECTORS = {
        editor: '.brikpanel-product-editor-page',
        imagesCard: '#bpe-gallery',
        gallery: '#bpe-gallery',
        dropzone: '#bpe-dropzone',
        addImages: '#bpe-add-images',
        variationBody: '#bpe-var-table-body'
    };

    var studio = {
        $root: null,
        $productPanel: null,
        $variationPanel: null,
        $variationList: null,
        activeTab: 'product',
        productObserver: null,
        variationObserver: null,
        refreshTimer: null
    };

    function t(key, fallback) {
        return CFG.i18n && CFG.i18n[key] ? CFG.i18n[key] : fallback;
    }

    function esc(value) {
        return $('<div>').text(value == null ? '' : String(value)).html();
    }

    function imageCount($scope) {
        return $scope.find('.brikpanel-pe-gallery-item').not('.is-uploading').length;
    }

    function getVariationRows() {
        return $(SELECTORS.variationBody).find('tr.var-main-row');
    }

    function buildStudio() {
        var $gallery = $(SELECTORS.gallery);
        var $dropzone = $(SELECTORS.dropzone);
        if (!$gallery.length || !$dropzone.length || $gallery.closest('.brikpanel-media-studio').length) {
            return false;
        }

        var $card = $gallery.closest('.brikpanel-pe-card');
        if (!$card.length) return false;

        $card.addClass('brikpanel-media-card');
        $card.children('label').first().addClass('brikpanel-media-card__legacy-label');

        studio.$root = $('<section class="brikpanel-media-studio" aria-label="' + esc(t('studio_label', 'Product media studio')) + '"></section>');
        var $header = $('<div class="brikpanel-media-studio__header"></div>');
        var $heading = $('<div class="brikpanel-media-studio__heading"></div>');
        $heading.append('<span class="brikpanel-media-studio__eyebrow">' + esc(t('eyebrow', 'PRODUCT MEDIA')) + '</span>');
        $heading.append('<h2>' + esc(t('title', 'Product Media Studio')) + '</h2>');
        $heading.append('<p>' + esc(t('description', 'Order primary and gallery images, then manage each variation gallery from the same workspace.')) + '</p>');
        $header.append($heading);

        var $summary = $('<div class="brikpanel-media-studio__summary" aria-live="polite"></div>');
        $summary.append('<strong data-media-total>0</strong><span>' + esc(t('images', 'images')) + '</span>');
        $header.append($summary);
        studio.$root.append($header);

        var $tabs = $('<div class="brikpanel-media-studio__tabs" role="tablist" aria-label="' + esc(t('tabs_label', 'Media editor views')) + '"></div>');
        $tabs.append('<button type="button" class="brikpanel-media-studio__tab is-active" role="tab" aria-selected="true" data-media-tab="product">' + esc(t('product_gallery', 'Product gallery')) + '<span class="brikpanel-media-studio__tab-count" data-product-count>0</span></button>');
        $tabs.append('<button type="button" class="brikpanel-media-studio__tab" role="tab" aria-selected="false" data-media-tab="variations">' + esc(t('variations', 'Variations')) + '<span class="brikpanel-media-studio__tab-count" data-variation-count>0</span></button>');
        studio.$root.append($tabs);

        studio.$productPanel = $('<div class="brikpanel-media-studio__panel is-active" role="tabpanel" data-media-panel="product"></div>');
        studio.$variationPanel = $('<div class="brikpanel-media-studio__panel" role="tabpanel" data-media-panel="variations" hidden></div>');

        var $productToolbar = $('<div class="brikpanel-media-studio__toolbar"></div>');
        $productToolbar.append('<div><strong>' + esc(t('product_gallery', 'Product gallery')) + '</strong><span>' + esc(t('product_hint', 'Drag images to reorder. The first image is the product primary image.')) + '</span></div>');
        var $add = $('<button type="button" class="brikpanel-media-studio__add">' + esc(t('add_images', 'Add images')) + '</button>');
        $add.on('click', function () { $(SELECTORS.addImages).trigger('click'); });
        $productToolbar.append($add);
        studio.$productPanel.append($productToolbar);

        var $productCanvas = $('<div class="brikpanel-media-studio__canvas"></div>');
        $dropzone.addClass('brikpanel-media-studio__dropzone');
        $gallery.addClass('brikpanel-media-studio__gallery');
        $productCanvas.append($dropzone, $gallery);
        studio.$productPanel.append($productCanvas);

        var $variationToolbar = $('<div class="brikpanel-media-studio__toolbar"></div>');
        $variationToolbar.append('<div><strong>' + esc(t('variation_galleries', 'Variation galleries')) + '</strong><span>' + esc(t('variation_hint', 'Open a variation to add, remove, preview, and reorder its images.')) + '</span></div>');
        studio.$variationPanel.append($variationToolbar);
        studio.$variationList = $('<div class="brikpanel-media-studio__variations"></div>');
        studio.$variationPanel.append(studio.$variationList);

        studio.$root.append(studio.$productPanel, studio.$variationPanel);
        $card.append(studio.$root);

        $tabs.on('click', '[data-media-tab]', function () {
            setTab($(this).data('media-tab'));
        });

        decorateProductGallery();
        renderVariationMedia();
        installObservers();
        return true;
    }

    function setTab(tab) {
        if (tab !== 'product' && tab !== 'variations') return;
        studio.activeTab = tab;
        studio.$root.find('[data-media-tab]').each(function () {
            var active = $(this).data('media-tab') === tab;
            $(this).toggleClass('is-active', active).attr('aria-selected', active ? 'true' : 'false');
        });
        studio.$root.find('[data-media-panel]').each(function () {
            var active = $(this).data('media-panel') === tab;
            $(this).toggleClass('is-active', active).prop('hidden', !active);
        });
    }

    function decorateProductGallery() {
        if (!studio.$root) return;
        var $gallery = $(SELECTORS.gallery);
        var count = imageCount($gallery);
        studio.$root.find('[data-product-count]').text(count);
        studio.$root.find('[data-media-total]').text(count);

        $gallery.find('.brikpanel-pe-gallery-item').not('.is-uploading').each(function (index) {
            var $item = $(this);
            $item.attr('data-media-position', index + 1);
            $item.find('.brikpanel-media-position').remove();
            $item.append('<span class="brikpanel-media-position" aria-hidden="true">' + (index + 1) + '</span>');
            $item.toggleClass('is-primary', index === 0);
            if (index === 0) {
                $item.attr('aria-label', t('primary_image', 'Primary product image'));
            } else {
                $item.attr('aria-label', t('gallery_image', 'Gallery image') + ' ' + (index + 1));
            }
        });

        studio.$root.toggleClass('has-product-images', count > 0);
    }

    function variationMeta($row) {
        var name = $.trim($row.find('.var-name-text').text()) || t('variation', 'Variation');
        var sku = $.trim($row.find('.var-sku').val() || '');
        var $imageButton = $row.find('.var-image-btn').first();
        var count = 0;
        var countText = $.trim($row.find('.var-image-count').first().text());
        if (countText) count = parseInt(countText, 10) || 0;
        if (!count && $imageButton.hasClass('has-images')) count = 1;
        var src = $imageButton.find('img').attr('src') || '';
        var idx = parseInt($row.data('idx'), 10);
        return { idx: idx, name: name, sku: sku, count: count, src: src, $row: $row, $button: $imageButton };
    }

    function renderVariationMedia() {
        if (!studio.$variationList) return;
        var $rows = getVariationRows();
        var total = $rows.length;
        studio.$root.find('[data-variation-count]').text(total);
        studio.$root.find('[data-media-tab="variations"]').prop('disabled', total === 0);

        if (!total) {
            studio.$variationList.html('<div class="brikpanel-media-studio__empty"><strong>' + esc(t('no_variations', 'No variations yet')) + '</strong><span>' + esc(t('no_variations_hint', 'Generate product variations first, then their image galleries will appear here.')) + '</span></div>');
            if (studio.activeTab === 'variations') setTab('product');
            return;
        }

        var fragment = document.createDocumentFragment();
        $rows.each(function () {
            var meta = variationMeta($(this));
            var card = document.createElement('article');
            card.className = 'brikpanel-media-variation';
            card.setAttribute('data-variation-index', meta.idx);

            var thumb = document.createElement('button');
            thumb.type = 'button';
            thumb.className = 'brikpanel-media-variation__thumb' + (meta.src ? ' has-image' : '');
            thumb.setAttribute('aria-label', t('manage_variation_images', 'Manage variation images') + ': ' + meta.name);
            if (meta.src) {
                var img = document.createElement('img');
                img.src = meta.src;
                img.alt = '';
                thumb.appendChild(img);
            } else {
                thumb.innerHTML = '<span class="dashicons dashicons-format-image" aria-hidden="true"></span>';
            }

            var body = document.createElement('div');
            body.className = 'brikpanel-media-variation__body';
            body.innerHTML = '<strong>' + esc(meta.name) + '</strong>' +
                (meta.sku ? '<span class="brikpanel-media-variation__sku">SKU ' + esc(meta.sku) + '</span>' : '<span class="brikpanel-media-variation__sku">' + esc(t('no_sku', 'No SKU')) + '</span>') +
                '<span class="brikpanel-media-variation__count">' + esc(meta.count === 1 ? t('one_image', '1 image') : meta.count + ' ' + t('images', 'images')) + '</span>';

            var action = document.createElement('button');
            action.type = 'button';
            action.className = 'brikpanel-media-variation__manage';
            action.textContent = meta.count ? t('manage', 'Manage') : t('add_images', 'Add images');

            var open = function () {
                var $current = getVariationRows().filter('[data-idx="' + meta.idx + '"]').find('.var-image-btn').first();
                if ($current.length) $current.trigger('click');
            };
            $(thumb).on('click', open);
            $(action).on('click', open);

            card.appendChild(thumb);
            card.appendChild(body);
            card.appendChild(action);
            fragment.appendChild(card);
        });

        studio.$variationList.empty().append(fragment);
    }

    function scheduleRefresh() {
        window.clearTimeout(studio.refreshTimer);
        studio.refreshTimer = window.setTimeout(function () {
            decorateProductGallery();
            renderVariationMedia();
        }, 40);
    }

    function installObservers() {
        if (window.MutationObserver) {
            var gallery = document.querySelector(SELECTORS.gallery);
            if (gallery) {
                studio.productObserver = new MutationObserver(scheduleRefresh);
                studio.productObserver.observe(gallery, { childList: true });
            }
            var variationBody = document.querySelector(SELECTORS.variationBody);
            if (variationBody) {
                studio.variationObserver = new MutationObserver(scheduleRefresh);
                studio.variationObserver.observe(variationBody, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src', 'value'] });
            }
        }

        $(document).on('change input', '#bpe-var-table-body .var-sku', scheduleRefresh);
        $(document).on('sortupdate', '#bpe-gallery', scheduleRefresh);
    }

    function enhanceVariationDialog() {
        var observer;
        if (!window.MutationObserver) return;
        observer = new MutationObserver(function () {
            var $dlg = $('.brikpanel-pe-vargal-dlg').last();
            if (!$dlg.length || $dlg.hasClass('brikpanel-media-vargal')) return;
            $dlg.addClass('brikpanel-media-vargal');
            $dlg.find('.brikpanel-pe-linkdlg-title').after('<p class="brikpanel-media-vargal__help">' + esc(t('dialog_hint', 'Drag to set gallery order. The first image becomes the variation primary image.')) + '</p>');
            $dlg.find('.brikpanel-pe-vargal-grid').attr('aria-label', t('variation_gallery_order', 'Variation image order'));
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        if (!$('body').hasClass('brikpanel-product-editor-page')) return;
        if (!buildStudio()) return;
        enhanceVariationDialog();
    }

    $(init);
})(jQuery);
