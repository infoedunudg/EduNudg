import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CentersDirectoryItem,
  CentersDirectoryPanel,
  CentersKpiCard,
  CentersKpiGrid,
  CentersMobileOverview,
  CentersPageHeader,
  CentersSearchField,
} from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useTenant } from "@/bootstrap/TenantProvider";
import { reportAccessAudit } from "@/services/auth/accessAuditApi";
import { CenterDetailPanel } from "@/features/brand/centers/CenterDetailPanel";
import { FranchiseCenterImportDialog } from "@/features/platform/FranchiseCenterImportDialog";
import {
  centerAvatarTone,
  centerCounts,
  centerInitials,
  centerListTitle,
  centerLocationLine,
  centerStatusTone,
  downloadBrandCentersExport,
  filterCenters,
  type CenterFilter,
} from "@/features/brand/centers/brandCentersHelpers";
import { centerMatchesSearch, fetchBrandCenters } from "@/lib/centerCentersApi";
import { fetchBrandPrograms, fetchCenterProgramNamesByCenterIds } from "@/lib/centerProgramApi";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import "./brandCenters.css";

const KPI_ICONS = {
  total: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 21h18M6 21V7l6-4 6 4v14M10 10h4M10 14h4" />
    </svg>
  ),
  active: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  suspended: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

export function CentersView() {
  const tenant = useTenant();
  const { brandId, brandSlug, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { isMobile } = useOpsBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<CenterFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandCenters(brandId!),
  });

  const all = centers.data ?? [];

  useEffect(() => {
    const slug = searchParams.get("center")?.trim();
    if (!slug || all.length === 0) return;
    const match = all.find((center) => center.slug === slug);
    if (match) {
      setSelectedId(match.id);
      if (isMobile) setMobileDetailOpen(true);
    }
  }, [searchParams, all, isMobile]);

  const counts = useMemo(() => centerCounts(all), [all]);

  const filtered = useMemo(() => {
    return filterCenters(all, filter).filter((center) => centerMatchesSearch(center, search));
  }, [all, filter, search]);

  const selected = all.find((center) => center.id === selectedId) ?? null;

  const selectCenter = (id: string) => {
    setSelectedId(id);
    const center = all.find((item) => item.id === id);
    if (center) {
      setSearchParams({ center: center.slug }, { replace: true });
      if (isMobile) setMobileDetailOpen(true);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setMobileDetailOpen(false);
    setSearchParams({}, { replace: true });
  };

  const refreshCenters = () => {
    void qc.invalidateQueries({ queryKey: ["centers", brandId] });
  };

  const handleDeleted = () => {
    closeDetail();
    refreshCenters();
  };

  if (missingBrand || !brandId || !brandSlug) {
    return <p className="ed-empty">Brand context not found. Check domain mapping for this hostname.</p>;
  }

  const directory = (
    <CentersDirectoryPanel
      title="Directory"
      action={
        <Link to="/app/franchise-applications" className="ed-centers-directory__add-link">
          Add New
        </Link>
      }
    >
      {filtered.length === 0 ? (
        <p className="ed-text-sm ed-muted ed-brand-centers__empty">No centers in this view.</p>
      ) : (
        filtered.map((center, index) => (
          <CentersDirectoryItem
            key={center.id}
            initials={centerInitials(center)}
            imageUrl={center.photo_url}
            tone={centerAvatarTone(index)}
            title={centerListTitle(center)}
            meta={centerLocationLine(center)}
            status={centerStatusTone(center.status)}
            selected={center.id === selectedId}
            onSelect={() => selectCenter(center.id)}
          />
        ))
      )}
    </CentersDirectoryPanel>
  );

  const detailPanel = selected ? (
    <CenterDetailPanel
      center={selected}
      brandId={brandId}
      brandSlug={brandSlug}
      isMobile={isMobile}
      onStatusChanged={refreshCenters}
      onDeleted={handleDeleted}
    />
  ) : (
    <div className="ed-brand-centers__placeholder">
      <p className="ed-text-sm ed-muted">
        Select a franchise to view and edit details, assign curriculum, or suspend access.
      </p>
    </div>
  );

  return (
    <div className={`ed-brand-centers${isMobile ? " ed-brand-centers--mobile" : ""}`}>
      <CentersPageHeader
        title="Franchise Management"
        subtitle="Manage franchise profile, curriculum, and lifecycle from one workspace."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={all.length === 0}
              onClick={() => {
                void (async () => {
                  void reportAccessAudit({
                    action: "export",
                    resourceType: "franchise_csv",
                    tenant,
                    path: "/app/centers",
                    metadata: { rowCount: all.length },
                  });
                  const [programRows, assignments] = await Promise.all([
                    fetchBrandPrograms(brandId),
                    fetchCenterProgramNamesByCenterIds(all.map((center) => center.id)),
                  ]);
                  await downloadBrandCentersExport(all, brandSlug, {
                    programNames: programRows.map((program) => program.name),
                    assignments,
                  });
                })();
              }}
            >
              Export Franchise
            </Button>
            <Button type="button" variant="primary" onClick={() => setImportOpen(true)}>
              Import Franchise
            </Button>
          </>
        }
      />

      {isMobile ? (
        <CentersMobileOverview
          items={[
            { key: "all", label: "All", value: counts.total, tone: "default" },
            { key: "active", label: "Active", value: counts.active, tone: "active" },
            { key: "suspended", label: "Suspended", value: counts.suspended, tone: "suspended" },
          ]}
        />
      ) : (
        <CentersKpiGrid>
          <CentersKpiCard
            label="Total Centers"
            value={counts.total}
            icon={KPI_ICONS.total}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <CentersKpiCard
            label="Active"
            value={counts.active}
            icon={KPI_ICONS.active}
            tone="active"
            active={filter === "active"}
            onClick={() => setFilter("active")}
          />
          <CentersKpiCard
            label="Suspended"
            value={counts.suspended}
            icon={KPI_ICONS.suspended}
            tone="suspended"
            active={filter === "suspended"}
            onClick={() => setFilter("suspended")}
          />
        </CentersKpiGrid>
      )}

      <CentersSearchField value={search} onChange={setSearch} placeholder="Search centers…" />

      {isMobile ? (
        <>
          {directory}
          {!mobileDetailOpen ? (
            <p className="ed-text-sm ed-muted ed-brand-centers__hint">Tap a center to open details.</p>
          ) : null}
        </>
      ) : (
        <div className="ed-brand-centers__layout">
          {directory}
          <div className="ed-brand-centers__main">{detailPanel}</div>
        </div>
      )}

      {isMobile && mobileDetailOpen && selected ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Center details">
          <div className="ed-ops-mobile-detail__bar">
            <button type="button" className="ed-ops-mobile-detail__back" onClick={closeDetail}>
              ← Back
            </button>
          </div>
          {detailPanel}
        </div>
      ) : null}

      <FranchiseCenterImportDialog
        brandId={brandId}
        brandSlug={brandSlug}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refreshCenters}
      />
    </div>
  );
}
