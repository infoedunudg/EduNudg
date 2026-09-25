import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { TenantContext } from "@edunudg/tenant";
import { isPlatformHost, resolveTenantFromHost } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";
import { resolveTenantScope } from "@/lib/resolveTenantScope";
import {
  clearPortalOverride,
  parsePortalOverrideFromSearch,
  readStickyPortalOverride,
  syntheticLookupHostname,
  writePortalOverride,
  type PortalOverride,
} from "@/lib/portalOverride";

const TenantCtx = createContext<TenantContext | null>(null);

function lookupHostnameForResolution(override: PortalOverride | null): string {
  const host = window.location.hostname;
  if (!override) return host;
  // Same-origin / platform hosts: resolve against synthetic *.localhost mappings in DB.
  if (isPlatformHost(host)) {
    return syntheticLookupHostname(override);
  }
  return host;
}

/** Prefer React Router search so in-tab portal switches re-resolve without a full reload. */
function activePortalOverride(pathname: string, search: string): PortalOverride | null {
  const hostname = window.location.hostname;
  if (pathname.startsWith("/admin") && isPlatformHost(hostname)) {
    clearPortalOverride();
    return null;
  }

  const fromUrl = parsePortalOverrideFromSearch(search);
  if (fromUrl) {
    writePortalOverride(fromUrl);
    return fromUrl;
  }

  // Sticky override when the URL has no portal params (e.g. auth bounce before loginPathWithPortal).
  return readStickyPortalOverride();
}

function portalResolutionKey(pathname: string, search: string): string {
  const override = activePortalOverride(pathname, search);
  return [
    pathname,
    search,
    override?.portalType ?? "",
    override?.brandSlug ?? "",
    override?.centerSlug ?? "",
  ].join("\0");
}

function initialTenant(): TenantContext {
  return resolveTenantFromHost(
    lookupHostnameForResolution(
      activePortalOverride(window.location.pathname, window.location.search)
    )
  );
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [tenant, setTenant] = useState<TenantContext>(initialTenant);
  const [ready, setReady] = useState(false);
  const resolutionKey = portalResolutionKey(location.pathname, location.search);

  useEffect(() => {
    let cancelled = false;
    const override = activePortalOverride(location.pathname, location.search);
    const effectiveLookup = lookupHostnameForResolution(override);
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 2000);

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      clearTimeout(timeout);
      if (!cancelled) {
        setTenant(resolveTenantFromHost(effectiveLookup));
        setReady(true);
      }
      return;
    }

    void (async () => {
      try {
        const resolved = await resolveTenantScope(supabase, effectiveLookup);
        if (!cancelled) setTenant(resolved);
      } catch {
        if (!cancelled) setTenant(resolveTenantFromHost(effectiveLookup));
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [resolutionKey, location.pathname, location.search]);

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        Loading EduNudg…
      </div>
    );
  }

  return <TenantCtx.Provider value={tenant}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
