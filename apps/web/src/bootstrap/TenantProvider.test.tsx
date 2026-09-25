import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router-dom";
import { resolveTenantFromHost } from "@edunudg/tenant";
import { TenantProvider, useTenant } from "./TenantProvider";
import { clearPortalOverride } from "@/lib/portalOverride";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({}),
}));

vi.mock("@/lib/resolveTenantScope", () => ({
  resolveTenantScope: async (_client: unknown, hostname: string) => resolveTenantFromHost(hostname),
}));

function TenantProbe() {
  const tenant = useTenant();
  return (
    <div>
      <span data-testid="portal-type">{tenant.portalType}</span>
      <span data-testid="brand-slug">{tenant.brandSlug ?? ""}</span>
      <span data-testid="center-slug">{tenant.centerSlug ?? ""}</span>
    </div>
  );
}

function GoToCenterLogin() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate("/login?portal=center&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure")
      }
    >
      Open center login
    </button>
  );
}

describe("TenantProvider portal re-resolution", () => {
  beforeEach(() => {
    clearPortalOverride();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        hostname: "edu-nudg.vercel.app",
        pathname: "/login",
        search: "",
      },
    });
  });

  afterEach(() => {
    clearPortalOverride();
  });

  it("regression_platform_to_center_query_updates_tenant_without_full_reload", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/login",
          element: (
            <TenantProvider>
              <TenantProbe />
              <GoToCenterLogin />
            </TenantProvider>
          ),
        },
      ],
      { initialEntries: ["/login"] }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId("portal-type").textContent).toBe("platform");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Open center login" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("portal-type").textContent).toBe("center");
    });
    expect(screen.getByTestId("brand-slug").textContent).toBe("smart-brain-abacus");
    expect(screen.getByTestId("center-slug").textContent).toBe("chaitali-gokul-tajanpure");
  });

  it("regression_learn_portal_query_resolves_after_platform_session", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <TenantProvider>
              <TenantProbe />
            </TenantProvider>
          ),
        },
      ],
      {
        initialEntries: [
          "/login?portal=learn&brand=smart-brain-abacus&center=chaitali-gokul-tajanpure",
        ],
      }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId("portal-type").textContent).toBe("learn");
    });
    expect(screen.getByTestId("brand-slug").textContent).toBe("smart-brain-abacus");
  });
});
