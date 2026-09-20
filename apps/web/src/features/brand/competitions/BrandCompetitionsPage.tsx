import { useState } from "react";
import { CatalogPageHeader, CatalogToolbar, FilterTabs } from "@edunudg/ui";
import { canAny } from "@edunudg/permissions";
import { BrandCompetitionQuestionBankSection } from "@/features/brand/competitions/BrandCompetitionQuestionBankSection";
import { BrandCompetitionPapersSection } from "@/features/brand/competitions/BrandCompetitionPapersSection";
import { BrandCompetitionsSection } from "@/features/brand/competitions/BrandCompetitionsSection";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMembership } from "@/hooks/useMembership";
import "@/features/brand/merchandise/brandMerchandiseCatalog.css";
import "./brandCompetitions.css";

const TABS = [
  { id: "events", label: "Events" },
  { id: "bank", label: "Question bank" },
  { id: "papers", label: "Question papers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BrandCompetitionsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const { data: memberships } = useMembership();
  const canEdit = canAny(
    memberships?.map((m) => m.role_key),
    "competitions",
    "create"
  );
  const [activeTab, setActiveTab] = useState<TabId>("events");

  if (missingBrand || !brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return (
    <div className="ed-brand-merch-page">
      <div className="ed-brand-merch-page__desktop-head">
        <CatalogPageHeader title="Competitions" />
      </div>
      <header className="ed-brand-merch-page__mobile-head">
        <p className="ed-brand-merch-page__eyebrow">Management</p>
        <h1 className="ed-brand-merch-page__mobile-title">
          {TABS.find((tab) => tab.id === activeTab)?.label ?? "Competitions"}
        </h1>
      </header>

      <CatalogToolbar
        tabs={
          <FilterTabs
            options={TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabId)}
            variant="segmented"
            aria-label="Competition sections"
          />
        }
      />

      {activeTab === "events" ? <BrandCompetitionsSection brandId={brandId} canEdit={canEdit} /> : null}
      {activeTab === "bank" ? <BrandCompetitionQuestionBankSection brandId={brandId} canEdit={canEdit} /> : null}
      {activeTab === "papers" ? (
        <BrandCompetitionPapersSection
          brandId={brandId}
          canEdit={canEdit}
          onGoToEvents={() => setActiveTab("events")}
        />
      ) : null}
    </div>
  );
}
