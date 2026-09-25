import { describe, expect, it, vi, beforeEach } from "vitest";
import type React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";

const { authState, membershipState, tenantState, portalBrandingState, signOut } = vi.hoisted(() => ({
  authState: {
    session: { user: { id: "user-1", email: "stranger@gmail.com" } } as {
      user: { id: string; email?: string };
    } | null,
    user: { id: "user-1", email: "stranger@gmail.com" } as { id: string; email?: string } | null,
  },
  membershipState: {
    data: [] as Membership[],
    isLoading: false,
    isFetched: true,
    isError: false,
  },
  tenantState: {
    portalType: "platform" as "platform" | "brand" | "center",
    hostname: "localhost",
    brandId: null as string | null,
    centerId: null as string | null,
    brandSlug: null as string | null,
    centerSlug: null as string | null,
  },
  portalBrandingState: {
    data: undefined,
    isLoading: false,
    isFetched: true,
    isFetching: false,
  },
  signOut: vi.fn().mockImplementation(async () => {
    authState.session = null;
    authState.user = null;
  }),
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.user,
    signInWithOAuth: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithOtpPhone: vi.fn().mockResolvedValue({ error: null }),
    signInWithPasskey: vi.fn().mockResolvedValue({ error: null }),
    signOut,
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({
    data: membershipState.data,
    isLoading: membershipState.isLoading,
    isPending: membershipState.isLoading || !membershipState.isFetched,
    isFetching: membershipState.isLoading,
    isFetched: membershipState.isFetched,
    isError: membershipState.isError,
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => portalBrandingState,
}));

vi.mock("@/hooks/useResolvedPortalTenant", async (importOriginal) => {
  const { resolvePortalTenantIds } = await importOriginal<
    typeof import("@/hooks/useResolvedPortalTenant")
  >();
  return {
    useResolvedPortalTenant: () => ({
      tenant: resolvePortalTenantIds(tenantState, portalBrandingState.data),
      isResolving: false,
    }),
  };
});

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegrations: () => ({
    auth_email: true,
    auth_google: false,
    auth_facebook: false,
    auth_whatsapp_otp: false,
    passkeys: false,
    payment_gateway: false,
    platform_brand_signup: true,
    public_pricing: true,
  }),
}));

vi.mock("@/lib/homepageApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/homepageApi")>();
  return {
    ...actual,
    fetchHomepageConfig: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { status: "suspended" }, error: null }),
        }),
      }),
    }),
  }),
}));

function renderProtectedRoute(
  initialPath: string,
  extraRoutes: { path: string; element: React.ReactNode }[] = []
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/admin",
        element: (
          <RequireMembership>
            <div>Admin home</div>
          </RequireMembership>
        ),
      },
      ...extraRoutes,
    ],
    { initialEntries: [initialPath] }
  );

  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe("RequireMembership", () => {
  beforeEach(() => {
    signOut.mockClear();
    authState.session = { user: { id: "user-1", email: "stranger@gmail.com" } };
    authState.user = { id: "user-1", email: "stranger@gmail.com" };
    membershipState.data = [];
    membershipState.isLoading = false;
    membershipState.isFetched = true;
    membershipState.isError = false;
    tenantState.portalType = "platform";
    tenantState.brandId = null;
    tenantState.centerId = null;
    tenantState.brandSlug = null;
    tenantState.centerSlug = null;
  });

  it("regression_avoids_login_admin_redirect_loop_without_membership", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderProtectedRoute("/admin");

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(screen.getByRole("alert").textContent).toMatch(/stranger@gmail.com is not authorized/i);
    });

    expect(screen.queryByText("Admin home")).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Maximum update depth exceeded")
    );
    consoleSpy.mockRestore();
  });

  it("regression_waits_for_memberships_fetch_before_login_redirect", () => {
    membershipState.isFetched = false;
    membershipState.isLoading = false;

    renderProtectedRoute("/admin");

    expect(screen.getByText("Checking access…")).toBeDefined();
    expect(signOut).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin home")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("regression_suspended_center_staff_blocked", async () => {
    tenantState.portalType = "center";
    tenantState.brandId = "brand-1";
    tenantState.centerId = "center-1";
    tenantState.brandSlug = "abacus";
    tenantState.centerSlug = "koramangala";
    membershipState.data = [
      {
        id: "m1",
        scope_type: "center",
        brand_id: "brand-1",
        center_id: "center-1",
        role_key: "center_owner",
      },
    ] as Membership[];

    renderProtectedRoute("/center-app", [
      {
        path: "/center-app",
        element: (
          <RequireMembership>
            <div>Center app</div>
          </RequireMembership>
        ),
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Franchise suspended")).toBeDefined();
    });
    expect(screen.queryByText("Center app")).toBeNull();
  });

  it("regression_brand_admin_allowed_on_suspended_center_host", async () => {
    tenantState.portalType = "center";
    tenantState.brandId = "brand-1";
    tenantState.centerId = "center-1";
    membershipState.data = [
      {
        id: "m1",
        scope_type: "brand",
        brand_id: "brand-1",
        center_id: null,
        role_key: "brand_owner",
      },
    ] as Membership[];

    renderProtectedRoute("/center-app", [
      {
        path: "/center-app",
        element: (
          <RequireMembership>
            <div>Center app</div>
          </RequireMembership>
        ),
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Center app")).toBeDefined();
    });
  });

  it("regression_no_membership_redirect_keeps_center_portal_query", async () => {
    tenantState.portalType = "center";
    tenantState.brandId = "brand-1";
    tenantState.centerId = "center-1";
    tenantState.brandSlug = "smart-brain-abacus";
    tenantState.centerSlug = "chaitali-gokul-tajanpure";
    membershipState.data = [];

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        {
          path: "/app",
          element: (
            <RequireMembership>
              <div>Center app</div>
            </RequireMembership>
          ),
        },
      ],
      {
        initialEntries: [
          "/app?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure",
        ],
      }
    );

    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe(
      "?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure"
    );
  });
});
