import { useEffect, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useTenant } from "@/bootstrap/TenantProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { reportClientError } from "@/services/auth/clientErrorApi";

function reportFatal(message: string, stack: string | null | undefined, route: string, tenant: ReturnType<typeof useTenant>) {
  void reportClientError({
    message,
    stack,
    route,
    tenant,
  });
}

/**
 * Chrome DevTools injects a web-vitals observer into VM/<anonymous> scripts.
 * Chrome/web-vitals issue #792 can throw this during SPA soft navigation; it is
 * not an application crash and must not pollute EduNudg error telemetry.
 */
export function isKnownChromeDevToolsWebVitalsError(
  message: string,
  stack: string | null | undefined
): boolean {
  return (
    message.includes("Cannot read properties of undefined (reading 'startTime')") &&
    Boolean(stack?.includes("reportAllChanges"))
  );
}

export function ClientErrorReporter({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const { pathname } = useLocation();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || "window.onerror";
      const stack = event.error instanceof Error ? event.error.stack : null;
      if (isKnownChromeDevToolsWebVitalsError(message, stack)) {
        event.preventDefault();
        return;
      }
      reportFatal(message, stack, pathname, tenant);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "unhandledrejection");
      const stack = reason instanceof Error ? reason.stack : null;
      if (isKnownChromeDevToolsWebVitalsError(message, stack)) {
        event.preventDefault();
        return;
      }
      reportFatal(message, stack, pathname, tenant);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname, tenant.portalType, tenant.brandId, tenant.centerId, tenant.hostname]);

  const onCatch = (error: Error, info: ErrorInfo) => {
    reportFatal(error.message, `${error.stack ?? ""}\n${info.componentStack ?? ""}`, pathname, tenant);
  };

  return <AppErrorBoundary onCatch={onCatch}>{children}</AppErrorBoundary>;
}
