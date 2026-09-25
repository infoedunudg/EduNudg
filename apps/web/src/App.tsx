import type { ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { AuthProvider } from "@/bootstrap/AuthProvider";
import { TenantProvider, useTenant } from "@/bootstrap/TenantProvider";
import { PortalDocumentHead } from "@/components/PortalDocumentHead";
import { OAuthReturnRedirect } from "@/features/auth/OAuthReturnRedirect";
import { shouldUseAdminThemeProvider } from "@/lib/appThemeShell";
import { AppRoutes } from "@/routes/AppRoutes";
import { ClientErrorReporter } from "@/components/ClientErrorReporter";

function AppThemeShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const tenant = useTenant();
  if (!shouldUseAdminThemeProvider(tenant, pathname)) return <>{children}</>;
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <PortalDocumentHead />
          <OAuthReturnRedirect />
          <AppThemeShell>
            <ClientErrorReporter>
              <AppRoutes />
            </ClientErrorReporter>
          </AppThemeShell>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
