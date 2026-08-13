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
import SchematicHeader from './SchematicHeader';
import SchematicPageTabs from './SchematicPageTabs';
import DiagramViewer from './DiagramViewer';
import SchematicPartDialog from './SchematicPartDialog';

export default function SchematicViewerPage({ schematicId, initialPage, onBack, onPageChange }) {
  const { status, detail, error } = useSchematicDetail(schematicId);
  const [activePartRef, setActivePartRef] = useState(null);

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
        brandName={detail.brand?.name}
        categoryName={detail.category?.name}
        onBack={() => onBack(detail.brand?.id, detail.category?.id)}
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
