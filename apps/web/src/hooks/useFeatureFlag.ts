import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePlatformIntegrations } from "@/hooks/usePlatformIntegration";
import { getSupabase } from "@/lib/supabase";

export const FEATURE_FLAG_DEFAULTS: Record<string, boolean> = {
  student_leads: true,
  franchise_applications: true,
  brand_billing: true,
  merchandise: false,
  kits: false,
  campaigns: false,
  batches: false,
  competitions: false,
  platform_brand_signup: true,
};

export function resolveFeatureFlags(
  stored: Record<string, boolean> | undefined,
  key: string
): boolean {
  if (key === "merchandise" || key === "kits") {
    if (stored && "merchandise" in stored) return Boolean(stored.merchandise);
    if (stored && "kits" in stored) return Boolean(stored.kits);
    return FEATURE_FLAG_DEFAULTS.merchandise ?? false;
  }
  if (stored && key in stored) return Boolean(stored[key]);
  return FEATURE_FLAG_DEFAULTS[key] ?? false;
}

/** Loads brand-scoped feature flags (brand, center, or learn host). */
export function useBrandFeatureFlags(): Record<string, boolean> {
  const query = useBrandFeaturesQuery();
  const stored = query.data;
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(FEATURE_FLAG_DEFAULTS)) {
    result[key] = resolveFeatureFlags(stored, key);
  }
  return result;
}

function useBrandFeaturesQuery() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  return useQuery({
    queryKey: ["brand-features", brandId],
    enabled:
      (tenant.portalType === "brand" || tenant.portalType === "center" || tenant.portalType === "learn") &&
      !!brandId,
    queryFn: async () => {
      // Students (and other non-brand-staff roles) cannot SELECT brand_settings under RLS.
      // Use SECURITY DEFINER RPC so Learn portal can show flag-gated nav (e.g. Events).
      const { data, error } = await getSupabase().rpc("get_brand_feature_flags", {
        p_brand_id: brandId!,
      });
      if (error) throw error;
      return (data as Record<string, boolean> | null) ?? {};
    },
    staleTime: 60_000,
  });
}

export function useBrandFeatureFlagsReady(): boolean {
  const tenant = useTenant();
  const query = useBrandFeaturesQuery();
  const needsFetch =
    (tenant.portalType === "brand" || tenant.portalType === "center" || tenant.portalType === "learn") &&
    !!tenant.brandId;
  if (!needsFetch) return true;
  return query.isFetched || query.isError;
}

export function useFeatureFlag(key: string): boolean {
  const tenant = useTenant();
  const flags = useBrandFeatureFlags();
  const platformIntegrations = usePlatformIntegrations();

  if (key === "platform_brand_signup") {
    return platformIntegrations.platform_brand_signup;
  }

  if (tenant.portalType === "platform") {
    return FEATURE_FLAG_DEFAULTS[key] ?? true;
  }

  if (tenant.portalType === "brand" || tenant.portalType === "center" || tenant.portalType === "learn") {
    if (key === "kits") return flags.merchandise ?? flags.kits ?? false;
    if (key === "merchandise") return flags.merchandise ?? flags.kits ?? false;
    return flags[key] ?? FEATURE_FLAG_DEFAULTS[key] ?? false;
  }

  return FEATURE_FLAG_DEFAULTS[key] ?? true;
}
