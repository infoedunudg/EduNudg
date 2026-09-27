import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { AbacusClassicEditorForm } from "@/features/marketing/AbacusClassicEditorForm";
import {
  HomepageEditorPanel,
  HomepageEditorPanels,
  HomepageEditorShell,
} from "@/features/marketing/HomepageEditorShell";
import { useUnsavedMarketingNavigation } from "@/features/marketing/UnsavedMarketingChangesDialog";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import {
  fetchBrandMarketingEditor,
  landingConfigToPartial,
  saveBrandMarketingLanding,
  siteLogoUrlFromConfig,
  syncBrandLogoFromSiteLogo,
} from "@/lib/brandLandingEditorApi";
import { invalidateBrandLogoCaches } from "@/lib/brandLogoCache";
import { getSupabase } from "@/lib/supabase";
import { formatLastSavedLabel } from "@/lib/formatRelativeTime";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import {
  focusMarketingEditorSection,
  missingRequiredMarketingPhotos,
  requiredMarketingPhotosMessage,
} from "@/lib/marketingRequiredPhotos";
import { usesAlternateThemeEditor } from "@/lib/marketingThemeLayout";
import type { HomepageConfig } from "@/types/homepage";

function configsEqual(a: HomepageConfig, b: HomepageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function legalPagesEqual(a: BrandLegalPages, b: BrandLegalPages): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function socialConnectEqual(a: BrandSocialConnect, b: BrandSocialConnect): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type MarketingEditorVariant = "brand" | "center";

function BrandMarketingLandingEditor({ variant }: { variant: MarketingEditorVariant }) {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const [brandConfig, setBrandConfig] = useState<HomepageConfig | null>(null);
  const [centerConfig, setCenterConfig] = useState<HomepageConfig | null>(null);
  const [brandBaseline, setBrandBaseline] = useState<HomepageConfig | null>(null);
  const [centerBaseline, setCenterBaseline] = useState<HomepageConfig | null>(null);
  const [legalPages, setLegalPages] = useState<BrandLegalPages>({});
  const [legalPagesBaseline, setLegalPagesBaseline] = useState<BrandLegalPages>({});
  const [socialConnect, setSocialConnect] = useState<BrandSocialConnect>({});
  const [socialConnectBaseline, setSocialConnectBaseline] = useState<BrandSocialConnect>({});
  const [existingSettings, setExistingSettings] = useState<Record<string, unknown>>({});
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [brandSaved, setBrandSaved] = useState(false);
  const [centerSaved, setCenterSaved] = useState(false);
  const [brandUpdatedAt, setBrandUpdatedAt] = useState<string | null>(null);
  const [centerUpdatedAt, setCenterUpdatedAt] = useState<string | null>(null);
  const [marketingTheme, setMarketingTheme] = useState<import("@/types/homepage").MarketingTheme>("novu");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const editor = useQuery({
    queryKey: ["brand-marketing-editor", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandMarketingEditor(brandId!),
  });

  useEffect(() => {
    if (!editor.data) return;
    setBrandConfig(editor.data.landingConfig);
    setCenterConfig(editor.data.centerLandingConfig);
    setBrandBaseline(editor.data.landingConfig);
    setCenterBaseline(editor.data.centerLandingConfig);
    setLegalPages(editor.data.legalPages);
    setLegalPagesBaseline(editor.data.legalPages);
    setSocialConnect(editor.data.socialConnect);
    setSocialConnectBaseline(editor.data.socialConnect);
    setExistingSettings(editor.data.existingSettings);
    setSettingsId(editor.data.settingsId);
    setMarketingTheme(editor.data.marketingTheme);
  }, [editor.data]);

  const brandDirty = useMemo(() => {
    const configDirty = brandConfig && brandBaseline && !configsEqual(brandConfig, brandBaseline);
    const legalDirty = !legalPagesEqual(legalPages, legalPagesBaseline);
    const socialDirty = !socialConnectEqual(socialConnect, socialConnectBaseline);
    return Boolean(configDirty || legalDirty || socialDirty);
  }, [brandConfig, brandBaseline, legalPages, legalPagesBaseline, socialConnect, socialConnectBaseline]);

  const centerDirty = useMemo(
    () => centerConfig && centerBaseline && !configsEqual(centerConfig, centerBaseline),
    [centerConfig, centerBaseline]
  );

  const saveBrand = useMutation({
    mutationFn: async (override?: HomepageConfig) => {
      const payload = override ?? brandConfig;
      if (!brandId || !payload) throw new Error("Brand required");
      const merged = {
        ...existingSettings,
        landing: landingConfigToPartial(payload, { marketingTheme }),
        legal_pages: legalPages,
        social_connect: socialConnect,
      };

      if (settingsId) {
        const { error } = await getSupabase()
          .from("brand_settings")
          .update({ settings: merged })
          .eq("id", settingsId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await getSupabase()
          .from("brand_settings")
          .insert({ brand_id: brandId, settings: merged });
        if (error) throw new Error(error.message);
      }
      await syncBrandLogoFromSiteLogo(brandId, siteLogoUrlFromConfig(payload));
    },
    onSuccess: (_data, override) => {
      const payload = override ?? brandConfig;
      if (payload) {
        setBrandBaseline(payload);
        setExistingSettings((prev) => ({
          ...prev,
          landing: landingConfigToPartial(payload, { marketingTheme }),
          legal_pages: legalPages,
          social_connect: socialConnect,
        }));
      }
      setLegalPagesBaseline(legalPages);
      setSocialConnectBaseline(socialConnect);
      setBrandUpdatedAt(new Date().toISOString());
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      invalidateBrandLogoCaches(qc, brandId);
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    },
  });

  const saveCenter = useMutation({
    mutationFn: async (override?: HomepageConfig) => {
      const payload = override ?? centerConfig;
      if (!brandId || !payload) throw new Error("Brand required");
      await saveBrandMarketingLanding(
        brandId,
        settingsId,
        existingSettings,
        "center_landing",
        payload,
        { marketingTheme }
      );
    },
    onSuccess: (_data, override) => {
      const payload = override ?? centerConfig;
      if (payload) {
        setCenterBaseline(payload);
        setExistingSettings((prev) => ({
          ...prev,
          center_landing: landingConfigToPartial(payload, { marketingTheme }),
        }));
      }
      setCenterUpdatedAt(new Date().toISOString());
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setCenterSaved(true);
      setTimeout(() => setCenterSaved(false), 3000);
    },
  });

  const lastSavedLabel = useMemo(() => {
    const stamp = variant === "center" ? centerUpdatedAt : brandUpdatedAt;
    return stamp ? formatLastSavedLabel(stamp) : null;
  }, [variant, brandUpdatedAt, centerUpdatedAt]);

  const portalMode = variant === "center" ? "center" : "brand";
  const activeConfig = variant === "center" ? centerConfig : brandConfig;
  const activeDirty = variant === "center" ? !!centerDirty : brandDirty;
  const activeSavePending = variant === "center" ? saveCenter.isPending : saveBrand.isPending;

  const validateRequiredPhotos = (payload: HomepageConfig): boolean => {
    const missing = missingRequiredMarketingPhotos({
      config: payload,
      marketingTheme,
      portalMode,
    });
    const message = requiredMarketingPhotosMessage(missing);
    setPhotoError(message);
    if (message) {
      focusMarketingEditorSection(missing[0]!.sectionId);
      return false;
    }
    return true;
  };

  const persistActive = async (payload?: HomepageConfig): Promise<boolean> => {
    const next = payload ?? activeConfig;
    if (!next) return false;
    if (!validateRequiredPhotos(next)) return false;
    try {
      if (variant === "center") {
        await saveCenter.mutateAsync(next);
      } else {
        await saveBrand.mutateAsync(next);
      }
      return true;
    } catch {
      return false;
    }
  };

  const discardActive = () => {
    setPhotoError(null);
    if (variant === "center" && centerBaseline) {
      setCenterConfig(centerBaseline);
      return;
    }
    if (brandBaseline) {
      setBrandConfig(brandBaseline);
      setLegalPages(legalPagesBaseline);
      setSocialConnect(socialConnectBaseline);
    }
  };

  const { dialog: unsavedDialog } = useUnsavedMarketingNavigation({
    isDirty: activeDirty,
    savePending: activeSavePending,
    marketingTheme,
    onSave: () => persistActive(),
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const brandReady = Boolean(brandConfig && brandBaseline);
  const centerReady = Boolean(centerConfig && centerBaseline);
  const ready = variant === "center" ? centerReady : brandReady;

  if (editor.isLoading || !ready) {
    return <p className="ed-empty">Loading marketing pages…</p>;
  }

  const brandEditorProps = {
    legalPages,
    onLegalPagesChange: setLegalPages,
    socialConnect,
    onSocialConnectChange: setSocialConnect,
    brandId,
  };

  if (variant === "center" && centerConfig && centerBaseline) {
    return (
      <>
      {unsavedDialog}
      <HomepageEditorShell
        title="Center Site Configuration"
        subtitle="Template for every center hostname. Center name and city are filled in per location."
        lastSavedLabel={lastSavedLabel}
      >
        <HomepageEditorPanels defaultOpenId="center">
          <HomepageEditorPanel
            panelId="center"
            title="Center sites (parent enrollment template)"
            icon="apartment"
            iconTone="secondary"
            onSave={() => void persistActive(centerConfig)}
            onDiscard={discardActive}
            isDirty={!!centerDirty}
            savePending={saveCenter.isPending}
            saved={centerSaved}
            saveError={photoError}
            description="Public enrollment pages on each franchise hostname inherit this template."
          >
            {usesAlternateThemeEditor(marketingTheme) ? (
              <AbacusClassicEditorForm
                config={centerConfig}
                marketingTheme={marketingTheme}
                portalMode="center"
                onChange={setCenterConfig}
                uploadScope={{ kind: "brand", brandId: brandId! }}
                onPersist={(next) => {
                  setCenterConfig(next);
                  saveCenter.mutate(next);
                }}
              />
            ) : (
              <HomepageEditorForm
                config={centerConfig}
                marketingTheme={marketingTheme}
                portalMode="center"
                onChange={setCenterConfig}
                uploadScope={{ kind: "brand", brandId: brandId! }}
                onPersist={(next) => {
                  setCenterConfig(next);
                  saveCenter.mutate(next);
                }}
              />
            )}
          </HomepageEditorPanel>
        </HomepageEditorPanels>
      </HomepageEditorShell>
      </>
    );
  }

  if (!brandConfig || !brandBaseline) {
    return <p className="ed-empty">Loading marketing pages…</p>;
  }

  return (
    <>
    {unsavedDialog}
    <HomepageEditorShell
      title="Homepage Configuration"
      subtitle="Manage your public brand recruitment site."
      lastSavedLabel={lastSavedLabel}
    >
      <HomepageEditorPanels defaultOpenId="brand">
        <HomepageEditorPanel
          panelId="brand"
          title="Brand site (franchise recruitment)"
          icon="storefront"
          iconTone="primary"
          onSave={() => void persistActive(brandConfig)}
          onDiscard={discardActive}
          isDirty={brandDirty}
          savePending={saveBrand.isPending}
          saved={brandSaved}
          saveError={photoError}
          description={
            <>
              Public homepage on your brand hostname. Testimonial quotes come from published{" "}
              <Link to="/app/success-stories">success stories</Link>.
            </>
          }
        >
          {usesAlternateThemeEditor(marketingTheme) ? (
            <AbacusClassicEditorForm
              config={brandConfig}
              marketingTheme={marketingTheme}
              portalMode="brand"
              onChange={setBrandConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setBrandConfig(next);
                saveBrand.mutate(next);
              }}
              testimonialsExternalHint={
                <p className="ed-text-sm ed-muted">
                  Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
                </p>
              }
              {...brandEditorProps}
            />
          ) : (
            <HomepageEditorForm
              config={brandConfig}
              marketingTheme={marketingTheme}
              portalMode="brand"
              onChange={setBrandConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setBrandConfig(next);
                saveBrand.mutate(next);
              }}
              testimonialsManagedExternally
              testimonialsExternalHint={
                <p className="ed-text-sm ed-muted">
                  Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
                </p>
              }
              {...brandEditorProps}
            />
          )}
        </HomepageEditorPanel>
      </HomepageEditorPanels>
    </HomepageEditorShell>
    </>
  );
}

export function BrandMarketingEditorPage() {
  return <BrandMarketingLandingEditor variant="brand" />;
}

export function BrandCenterSiteEditorPage() {
  return <BrandMarketingLandingEditor variant="center" />;
}
