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
import { humanizeLabel } from '../../utils/string.js';
import SchematicHeader from './SchematicHeader';
import SchematicPageTabs from './SchematicPageTabs';
import SchematicVariantPills, { sortVariants } from './SchematicVariantPills';
import DiagramViewer from './DiagramViewer';
import SchematicPartDialog from './SchematicPartDialog';

export default function SchematicViewerPage({
  schematicId,
  initialPage,
  onBack,
  onPageChange,
  catalogItems,
  onSelectVariant,
}) {
  const { status, detail, error } = useSchematicDetail(schematicId);
  const [activePartRef, setActivePartRef] = useState(null);

  // Case B only: sibling schematic records sharing this record's family_id,
  // each with its own populated variant_label. Case A (one shared record,
  // empty variant_label) intentionally yields an empty list here — there is
  // nothing to switch between within dtb-schematics data alone.
  const variants = useMemo(() => {
    const familyId = detail?.family_id;
    if (!familyId || !Array.isArray(catalogItems)) return [];
    const siblings = catalogItems.filter(
      (item) => item.family_id === familyId && item.variant_label,
    );
    return siblings.length > 1 ? sortVariants(siblings) : [];
  }, [detail, catalogItems]);

  const pages = useMemo(() => detail?.pages || [], [detail]);
  const activePage = useMemo(() => {
    if (pages.length === 0) return null;
    if (initialPage) {
      const byNumber = pages.find((p) => p.page_number === Number(initialPage));
      if (byNumber) return byNumber;
    }
    return pages[0];
  }, [pages, initialPage]);

  const activePart = activePartRef
    ? (detail?.parts || []).find((p) => p.part_ref === activePartRef) || null
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
        title={detail.title}
        brandName={humanizeLabel(detail.brand?.name, detail.brand?.id)}
        categoryName={humanizeLabel(detail.category?.name, detail.category?.id)}
        onBack={() => onBack(detail.brand?.id, detail.category?.id)}
      />

      <SchematicVariantPills
        variants={variants}
        activeSchematicId={schematicId}
        onSelectVariant={onSelectVariant}
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
            onSelectPart={setActivePartRef}
          />
        </>
      )}

      {activePart && (
        <SchematicPartDialog part={activePart} onClose={() => setActivePartRef(null)} />
      )}
    </div>
  );
}
