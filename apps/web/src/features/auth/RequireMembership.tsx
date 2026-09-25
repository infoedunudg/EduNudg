import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMembership } from "@/hooks/useMembership";
import { useResolvedPortalTenant } from "@/hooks/useResolvedPortalTenant";
import { hasPortalMembership } from "@/lib/portalMembership";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { CenterSuspendedPage } from "./CenterSuspendedPage";
import { loginPathWithPortal } from "./postLoginPath";

function hasBrandOversightRole(
  memberships: ReturnType<typeof useMembership>["data"],
  brandId: string | null | undefined
): boolean {
  if (!brandId || !memberships?.length) return false;
  return memberships.some(
    (m) =>
      m.scope_type === "platform" ||
      (m.scope_type === "brand" &&
        m.brand_id === brandId &&
        (m.role_key === "brand_owner" || m.role_key === "brand_admin"))
  );
}

export function RequireMembership({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const location = useLocation();
  const { tenant: portalTenant, isResolving: portalTenantResolving } = useResolvedPortalTenant();
  const { data: memberships, isLoading, isFetched, isError } = useMembership();

  const centerStatus = useQuery({
    queryKey: ["center-operational-status", portalTenant.centerId],
    enabled: portalTenant.portalType === "center" && !!portalTenant.centerId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select("status")
        .eq("id", portalTenant.centerId!)
        .maybeSingle();
      const row = supabaseMaybe(data, error) as { status: string } | null;
      return row?.status ?? null;
    },
  });

  if (tenant.portalType === "learn" || tenant.portalType === "parents") {
    return <>{children}</>;
  }

  if (isLoading || !isFetched || isError || portalTenantResolving || centerStatus.isLoading) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Checking access…</p>
        </div>
      </ThemeProvider>
    );
  }

  if (!hasPortalMembership(memberships, portalTenant)) {
    return (
      <Navigate
        to={loginPathWithPortal(location.search)}
        replace
        state={{ reason: "no_membership" }}
      />
    );
  }

  if (
    portalTenant.portalType === "center" &&
    centerStatus.data &&
    centerStatus.data !== "active" &&
    !hasBrandOversightRole(memberships, portalTenant.brandId)
  ) {
    return <CenterSuspendedPage />;
  }

  return <>{children}</>;
}
