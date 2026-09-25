import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { FeatureFlagRoute } from "@/features/auth/FeatureFlagRoute";
import { RequireMembership } from "@/features/auth/RequireMembership";
import { AuthHandoffPage } from "@/features/auth/AuthHandoffPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { loginPathWithPortal } from "@/features/auth/postLoginPath";
import { PlatformLayout } from "@/features/platform/PlatformLayout";
import { CommandCenter } from "@/features/platform/CommandCenter";
import { BrandsPage } from "@/features/platform/BrandsPage";
import { BrandDetailPage } from "@/features/platform/BrandDetailPage";
import { SubscriptionsPage } from "@/features/platform/SubscriptionsPage";
import { RevenuePage } from "@/features/platform/RevenuePage";
import { AuditLogsPage } from "@/features/platform/AuditLogsPage";
import { StaffAuditPage } from "@/features/shared/StaffAuditPage";
import { RequirePermission } from "@/features/auth/RequirePermission";
import { SettingsPage } from "@/features/platform/SettingsPage";
import { BrandLandingPage } from "@/features/brand/BrandLandingPage";
import { BrandAboutPage } from "@/features/brand/BrandAboutPage";
import { PublicCoursePage } from "@/features/marketing/course-detail/PublicCoursePage";
import { BrandLegalPage } from "@/features/brand/BrandLegalPage";
import { BrandLayout } from "@/features/brand/BrandLayout";
import { BrandPublicLayout } from "@/features/brand/BrandPublicLayout";
import { BrandDashboard } from "@/features/brand/BrandDashboard";
import { CurriculumPage } from "@/features/brand/CurriculumPage";
import { CentersPage } from "@/features/brand/CentersPage";
import { BrandStudentsPage } from "@/features/brand/BrandStudentsPage";
import { BrandAnalyticsPage } from "@/features/brand/BrandAnalyticsPage";
import { BrandCenterDetailPage } from "@/features/brand/BrandCenterDetailPage";
import { BrandSettingsPage } from "@/features/brand/BrandSettingsPage";
import { StudentLeadsPage } from "@/features/brand/studentLeads/StudentLeadsPage";
import { FranchiseApplicationsPage } from "@/features/brand/franchiseApplications/FranchiseApplicationsPage";
import { BrandBillingPage } from "@/features/brand/billing/BrandBillingPage";
import { BrandCampaignsPage } from "@/features/brand/campaigns/BrandCampaignsPage";
import { BrandSuccessStoriesPage } from "@/features/brand/successStories/BrandSuccessStoriesPage";
import { BrandMerchandisePage } from "@/features/brand/merchandise/BrandMerchandisePage";
import { BrandCompetitionsPage } from "@/features/brand/competitions/BrandCompetitionsPage";
import { BrandCenterSiteEditorPage, BrandMarketingEditorPage } from "@/features/brand/marketing/BrandMarketingEditorPage";
import { CenterLandingPage } from "@/features/center/CenterLandingPage";
import { CenterPublicLayout } from "@/features/center/CenterPublicLayout";
import { CenterLayout } from "@/features/center/CenterLayout";
import { CenterDashboard } from "@/features/center/CenterDashboard";
import { CenterLeadsPage } from "@/features/center/leads/CenterLeadsPage";
import { CenterMerchandiseOrdersPage } from "@/features/center/merchandise/CenterMerchandiseOrdersPage";
import { CenterCampaignsPage } from "@/features/center/campaigns/CenterCampaignsPage";
import { CenterAssessmentsRedirect } from "@/features/center/assessments/CenterAssessmentsRedirect";
import { CenterCurriculumPage } from "@/features/center/CenterCurriculumPage";
import { CenterReportsPage } from "@/features/center/reports/CenterReportsPage";
import { CenterSettingsPage } from "@/features/center/settings/CenterSettingsPage";
import { StudentsPage } from "@/features/center/StudentsPage";
import { BatchesPage } from "@/features/center/BatchesPage";
import { FeesPage } from "@/features/center/FeesPage";
import { InventoryPage } from "@/features/center/InventoryPage";
import { MarketingHomePage } from "@/features/marketing/MarketingHomePage";
import { MarketingPublicLayout } from "@/features/marketing/MarketingPublicLayout";
import { MarketingLegalPage } from "@/features/marketing/MarketingLegalPage";
import { HomepageEditorPage } from "@/features/platform/HomepageEditorPage";
import { StudentLearnLayout } from "@/features/learn/StudentLearnLayout";
import { StudentHomePage } from "@/features/learn/StudentHomePage";
import { StudentProgressPage } from "@/features/learn/StudentProgressPage";
import { StudentCompetitionsPage } from "@/features/learn/StudentCompetitionsPage";
import { StudentActivityPage } from "@/features/learn/StudentActivityPage";
import { StudentProfilePage } from "@/features/learn/StudentProfilePage";
import { ParentPortalPage } from "@/features/learn/ParentPortalPage";
import { LearnPublicLoginLayout } from "@/features/learn/LearnPublicLoginLayout";
import { ThemeProvider } from "@edunudg/ui";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Loading…</p>
        </div>
      </ThemeProvider>
    );
  }
  if (!session) return <Navigate to={loginPathWithPortal(location.search)} replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const tenant = useTenant();

  if (tenant.portalType === "learn") {
    return (
      <Routes>
        <Route path="/auth/handoff" element={<AuthHandoffPage />} />
        <Route element={<LearnPublicLoginLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route
          path="/"
          element={
            <RequireAuth>
              <StudentLearnLayout />
            </RequireAuth>
          }
        >
          <Route index element={<StudentHomePage />} />
          <Route path="progress" element={<StudentProgressPage />} />
          <Route
            path="competitions"
            element={
              <FeatureFlagRoute flag="competitions" fallback="/">
                <StudentCompetitionsPage />
              </FeatureFlagRoute>
            }
          />
          <Route path="activity" element={<StudentActivityPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (tenant.portalType === "parents") {
    return (
      <Routes>
        <Route path="/auth/handoff" element={<AuthHandoffPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<ParentPortalPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/auth/handoff" element={<AuthHandoffPage />} />

      {tenant.portalType === "platform" ? (
        <Route element={<MarketingPublicLayout />}>
          <Route path="/" element={<MarketingHomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/legal/:kind" element={<MarketingLegalPage />} />
        </Route>
      ) : tenant.portalType !== "brand" ? (
        <Route path="/login" element={<LoginPage />} />
      ) : null}

      {tenant.portalType === "platform" && (
        <>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireMembership>
                  <PlatformLayout />
                </RequireMembership>
              </RequireAuth>
            }
          >
            <Route index element={<CommandCenter />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="brands/:brandSlug" element={<BrandDetailPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="homepage" element={<HomepageEditorPage />} />
          </Route>
        </>
      )}

      {tenant.portalType === "brand" && (
        <>
          <Route element={<BrandPublicLayout />}>
            <Route path="/" element={<BrandLandingPage />} />
            <Route path="/about" element={<BrandAboutPage />} />
            <Route path="/courses/:slug" element={<PublicCoursePage />} />
            <Route path="/legal/:kind" element={<BrandLegalPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireMembership>
                  <BrandLayout />
                </RequireMembership>
              </RequireAuth>
            }
          >
            <Route index element={<BrandDashboard />} />
            <Route path="curriculum" element={<CurriculumPage />} />
            <Route
              path="leads"
              element={
                <FeatureFlagRoute flag="student_leads">
                  <StudentLeadsPage />
                </FeatureFlagRoute>
              }
            />
            <Route
              path="franchise-applications"
              element={
                <FeatureFlagRoute flag="franchise_applications">
                  <FranchiseApplicationsPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="centers" element={<CentersPage />} />
            <Route path="centers/:centerSlug" element={<BrandCenterDetailPage />} />
            <Route path="students" element={<BrandStudentsPage />} />
            <Route path="royalties" element={<Navigate to="/app" replace />} />
            <Route path="analytics" element={<BrandAnalyticsPage />} />
            <Route
              path="billing"
              element={
                <FeatureFlagRoute flag="brand_billing">
                  <BrandBillingPage />
                </FeatureFlagRoute>
              }
            />
            <Route
              path="campaigns"
              element={
                <FeatureFlagRoute flag="campaigns">
                  <BrandCampaignsPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="success-stories" element={<BrandSuccessStoriesPage />} />
            <Route
              path="merchandise"
              element={
                <FeatureFlagRoute flag="merchandise">
                  <BrandMerchandisePage />
                </FeatureFlagRoute>
              }
            />
            <Route path="kits" element={<Navigate to="/app/merchandise" replace />} />
            <Route
              path="competitions"
              element={
                <FeatureFlagRoute flag="competitions">
                  <BrandCompetitionsPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="homepage" element={<BrandMarketingEditorPage />} />
            <Route path="center-site" element={<BrandCenterSiteEditorPage />} />
            <Route
              path="audit"
              element={
                <RequirePermission resource="audit_logs" action="read">
                  <StaffAuditPage />
                </RequirePermission>
              }
            />
            <Route path="settings" element={<BrandSettingsPage />} />
          </Route>
        </>
      )}

      {tenant.portalType === "center" && (
        <>
          <Route element={<CenterPublicLayout />}>
            <Route path="/" element={<CenterLandingPage />} />
            <Route path="/courses/:slug" element={<PublicCoursePage />} />
            <Route path="/legal/:kind" element={<BrandLegalPage />} />
          </Route>
          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireMembership>
                  <CenterLayout />
                </RequireMembership>
              </RequireAuth>
            }
          >
            <Route index element={<CenterDashboard />} />
            <Route path="leads" element={<CenterLeadsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route
              path="audit"
              element={
                <RequirePermission resource="audit_logs" action="read">
                  <StaffAuditPage />
                </RequirePermission>
              }
            />
            <Route path="settings" element={<CenterSettingsPage />} />
            <Route
              path="merchandise"
              element={
                <FeatureFlagRoute flag="merchandise">
                  <CenterMerchandiseOrdersPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="kits" element={<Navigate to="/app/merchandise" replace />} />
            <Route
              path="campaigns"
              element={
                <FeatureFlagRoute flag="campaigns">
                  <CenterCampaignsPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="assessments" element={<CenterAssessmentsRedirect />} />
            <Route path="reports" element={<CenterReportsPage />} />
            <Route
              path="batches"
              element={
                <FeatureFlagRoute flag="batches">
                  <BatchesPage />
                </FeatureFlagRoute>
              }
            />
            <Route path="curriculum" element={<CenterCurriculumPage />} />
            <Route path="fees" element={<FeesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
          <Route path="/admissions" element={<Navigate to="/app/leads" replace />} />
          <Route path="/app/admissions" element={<Navigate to="/app/leads" replace />} />
          <Route path="/students" element={<Navigate to="/app/students" replace />} />
          <Route path="/batches" element={<Navigate to="/app/batches" replace />} />
          <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
          <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
          <Route path="/assessments" element={<Navigate to="/app/students?tab=assessments" replace />} />
          <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
        </>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
