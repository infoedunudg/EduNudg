import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { StudentMobileChrome } from "@/features/learn/components/StudentMobileChrome";
import { useStudentBreakpoint } from "@/features/learn/hooks/useStudentBreakpoint";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { studentNavSections, signOutNavItem } from "@/lib/portalNav";
import { useBrandFeatureFlags } from "@/hooks/useFeatureFlag";
import { resolveShellProductName } from "@/lib/portalBranding";
import { displayUserFromAuth } from "@/lib/portalUser";
import { fetchStudentLearnHome, StudentLearnRpcError } from "@/lib/studentLearnApi";
import { useSignedStorageUrl } from "@/hooks/useSignedStorageUrl";
import "@/features/learn/studentPortal.css";

export function StudentLearnLayout() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const tenant = useTenant();
  const { isMobile } = useStudentBreakpoint();
  const featureFlags = useBrandFeatureFlags();
  const { data: branding } = usePortalBranding();
  const studentProfile = useQuery({
    queryKey: ["student-learn-home", tenant.brandId],
    enabled: !!tenant.brandId,
    queryFn: () => fetchStudentLearnHome(tenant.brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
    staleTime: 60_000,
  });

  const home = studentProfile.data;
  const student = home?.student;
  const avatarUrl = useSignedStorageUrl(student?.profile.photo_url);
  const brandingRow = branding ?? {
    brandId: null,
    brandSlug: null,
    brandName: null,
    brandLogoUrl: null,
    centerId: null,
    centerSlug: null,
    centerName: null,
    loginHeadline: null,
    loginSubtext: null,
  };
  const shell = resolveShellProductName(
    tenant.portalType,
    {
      ...brandingRow,
      brandName: brandingRow.brandName ?? home?.brand.name ?? null,
      brandLogoUrl: brandingRow.brandLogoUrl ?? home?.brand.logo_url ?? null,
    },
    tenant.brandSlug,
    tenant.centerSlug,
    { franchiseName: home?.center.display_name }
  );
  const authProfile = displayUserFromAuth(user);
  const studentCode = student?.student_code;

  return (
    <AppShell
      productName={shell.productName}
      logoUrl={shell.logoUrl ?? home?.brand.logo_url ?? null}
      portalLabel={`Learn · ${shell.productName}`}
      portalTagline={shell.portalTagline}
      user={{
        name: student?.full_name ?? authProfile.name,
        email: authProfile.email,
        subtitle: studentCode ? `Student ID: #${studentCode.replace(/^#/, "")}` : authProfile.email,
        avatarUrl,
      }}
      navSections={studentNavSections(pathname, featureFlags)}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
      showWelcome={false}
      shellVariant="student"
      surface="backend"
      mobileNavMode="bottom"
      mobileChrome={isMobile ? <StudentMobileChrome /> : undefined}
    >
      <div className={`ed-student-portal${isMobile ? " ed-student-portal--mobile" : ""}`}>
        <Outlet />
      </div>
    </AppShell>
  );
}
