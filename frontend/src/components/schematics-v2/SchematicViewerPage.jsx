/**
 * frontend/src/components/schematics-v2/SchematicViewerPage.jsx
 *
 * Full schematic viewer: fetches detail via useSchematicDetail, derives
 * brand/category/pages/title entirely from the API response (no local
 * mapping table), and composes header/tabs/diagram/part-dialog.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSchematicDetail } from '../../hooks/useSchematicDetail';
import { humanizeLabel, normalizePartRef } from '../../utils/string.js';
import SchematicHeader from './SchematicHeader';
import SchematicPageTabs from './SchematicPageTabs';
import SchematicVariantPills, { sortVariants } from './SchematicVariantPills';
import DiagramViewer from './DiagramViewer';

export default function SchematicViewerPage({
  schematicId,
  initialPage,
  initialVariant,
  onBack,
  onPageChange,
  catalogItems,
  onSelectVariant,
}) {
  const { status, detail, error } = useSchematicDetail(schematicId);
  const [activePartRef, setActivePartRef] = useState(null);

  function handleSelectPart(partRef) {
    setActivePartRef(partRef);
  }

  function handleCloseActivePart() {
    setActivePartRef(null);
  }

  const variantNavigation = useMemo(() => {
    const shared = Array.isArray(detail?.variant_options)
      ? detail.variant_options
        .filter((item) => item?.key && item?.label)
        .map((item) => ({
          id: item.key,
          variant_label: item.label,
          sku: item.sku || '',
        }))
      : [];

    if (shared.length > 1) {
      return {
        mode: 'shared',
        items: sortVariants(shared),
        activeId: shared.some((item) => item.id === initialVariant)
          ? initialVariant
          : shared[0].id,
      };
    }

    const familyId = detail?.family_id;
    if (!familyId || !Array.isArray(catalogItems)) {
      return { mode: 'schematic', items: [], activeId: schematicId };
    }
    const siblings = catalogItems.filter(
      (item) => item.family_id === familyId && item.variant_label,
    );
    return {
      mode: 'schematic',
      items: siblings.length > 1 ? sortVariants(siblings) : [],
      activeId: schematicId,
    };
  }, [detail, catalogItems, initialVariant, schematicId]);

  const pages = useMemo(() => detail?.pages || [], [detail]);
  const activePage = useMemo(() => {
    if (pages.length === 0) return null;
    if (initialPage) {
      const byNumber = pages.find((p) => p.page_number === Number(initialPage));
      if (byNumber) return byNumber;
    }
    return pages[0];
  }, [pages, initialPage]);

  // Hotspot occurrences carry the raw legacy label as `part_ref` (e.g.
  // `AH 7-2.5"`) while resolved parts carry an already-slugged `part_ref`
  // (e.g. `ah7-25`) — compare normalized forms or every click resolves to
  // no part and the dialog silently never opens.
  const activePart = activePartRef
    ? (detail?.parts || []).find(
      (p) => normalizePartRef(p.part_ref) === normalizePartRef(activePartRef),
    ) || null
    : null;

  function handleSelectPage(pageId) {
    const page = pages.find((p) => p.page_id === pageId);
    if (page) onPageChange(page.page_number);
  }

  if (status === 'loading') {
    return (
      <div className="dtb-schematic-viewer" aria-busy="true">
        <p className="dtb-schematics-status">Loading schematic…</p>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="dtb-schematic-viewer">
        <SchematicHeader title="Schematic not found" onBack={onBack} />
        <p className="dtb-schematics-status" role="status">
          This schematic isn't published, or the link is out of date.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="dtb-schematic-viewer">
        <SchematicHeader title="Schematic" onBack={onBack} />
        <p className="dtb-schematics-status dtb-schematics-status--error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" /> {error || 'This schematic could not be loaded.'}
        </p>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="dtb-schematic-viewer">
      <SchematicHeader
        title={humanizeLabel(detail.title, detail.id)}
        brandName={humanizeLabel(detail.brand?.name, detail.brand?.id)}
        categoryName={humanizeLabel(detail.category?.name, detail.category?.id)}
        onBack={() => onBack(detail.brand?.id, detail.category?.id)}
      />

      <SchematicVariantPills
        variants={variantNavigation.items}
        activeVariantId={variantNavigation.activeId}
        onSelectVariant={(id) => onSelectVariant({ type: variantNavigation.mode, id })}
      />

      {pages.length === 0 ? (
        <p className="dtb-schematics-status" role="status">This schematic doesn't have any pages yet.</p>
      ) : (
        <>
          <SchematicPageTabs
            pages={pages}
            activePageId={activePage?.page_id}
            onSelectPage={handleSelectPage}
          />
          <DiagramViewer
            page={activePage}
            parts={detail.parts}
            onSelectPart={handleSelectPart}
            activePart={activePart}
            onCloseActivePart={handleCloseActivePart}
          />
        </>
      )}
    </div>
  );
}
