import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CentersPage } from "./CentersPage";

const { mockCenters, downloadTextFile, downloadBrandCentersExport } = vi.hoisted(() => ({
  downloadTextFile: vi.fn(),
  downloadBrandCentersExport: vi.fn().mockResolvedValue(undefined),
  mockCenters: [
    {
      id: "c1",
      slug: "koramangala",
      name: "Koramangala Center",
      display_name: "Abacus Koramangala",
      status: "active" as const,
      city: "Bengaluru",
      region: "KA",
      pincode: "560034",
      contact_phone: "+91 98765 43210",
      address_line1: null,
      short_description: null,
      country: "IN",
      photo_url: null,
      social_links: [],
    },
    {
      id: "c2",
      slug: "jayanagar",
      name: "Jayanagar",
      display_name: null,
      status: "suspended" as const,
      city: "Bengaluru",
      region: "KA",
      pincode: null,
      contact_phone: "+91 90000 11111",
      address_line1: null,
      short_description: null,
      country: "IN",
      photo_url: null,
      social_links: [],
    },
  ],
}));

vi.mock("@/features/brand/centers/brandCentersHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/brand/centers/brandCentersHelpers")>();
  return {
    ...actual,
    downloadBrandCentersExport,
  };
});

vi.mock("@/lib/centerProgramApi", () => ({
  fetchBrandPrograms: vi.fn().mockResolvedValue([{ id: "p1", name: "Abacus Core" }]),
  fetchCenterProgramNamesByCenterIds: vi.fn().mockResolvedValue(new Map()),
  fetchCenterAuthorizedPrograms: vi.fn().mockResolvedValue([]),
  syncCenterProgramEnablement: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({
    brandId: "brand-1",
    brandSlug: "abacusworld",
    isLoading: false,
    missingBrand: false,
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    brandId: "brand-1",
    centerId: null,
    brandSlug: "abacusworld",
    hostname: "abacusworld.localhost",
  }),
}));

vi.mock("@/services/auth/accessAuditApi", () => ({
  reportAccessAudit: vi.fn(async () => undefined),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/centerCentersApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/centerCentersApi")>();
  return {
    ...actual,
    fetchBrandCenters: vi.fn().mockResolvedValue(mockCenters),
    fetchCenterStats: vi.fn().mockResolvedValue({
      openLeads: 2,
      staleLeads: 0,
      students: 5,
      activeEnrollments: 5,
    }),
    updateFranchiseCenter: vi.fn().mockResolvedValue(undefined),
    setFranchiseCenterStatus: vi.fn().mockResolvedValue(undefined),
    softDeleteFranchiseCenter: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () =>
              Promise.resolve({
                data: table === "programs" ? [{ id: "p1", name: "Abacus", age_label: "L1-L8", description: "Core" }] : [],
                error: null,
              }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/centerCurriculumApi", () => ({
  fetchCenterAuthorizedProgramIds: vi.fn().mockResolvedValue([]),
  setCenterCourseAuthorized: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/center/settings/CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div>Photo upload</div>,
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

function renderPage(initialEntries = ["/app/centers"]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={qc}>
        <CentersPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("CentersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    polyfillDialog();
  });

  it("regression_centers_management_layout", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Franchise Management" })).toBeDefined();
    expect(screen.getByText("Total Centers")).toBeDefined();
    expect(screen.getByText("Directory")).toBeDefined();
    expect(screen.getByRole("link", { name: "Add New" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export Franchise" })).toBeDefined();
  });

  it("regression_brand_centers_shows_franchise_csv_import", async () => {
    renderPage();
    const importButton = await screen.findByRole("button", { name: "Import Franchise" });
    expect(importButton).toBeDefined();
    expect(importButton.className).toContain("ed-btn--primary");
    expect(importButton.className).not.toContain("ed-btn--secondary");
    fireEvent.click(importButton);
    expect(screen.getByRole("heading", { name: "Import franchise centers" })).toBeDefined();
  });

  it("regression_brand_centers_view_frontend_and_backend", async () => {
    renderPage(["/app/centers?center=koramangala"]);
    expect(await screen.findByRole("link", { name: "View Frontend ↗" })).toBeDefined();
    expect(screen.getByRole("link", { name: "View Backend ↗" })).toBeDefined();
  });

  it("regression_brand_centers_can_soft_delete_franchise", async () => {
    renderPage(["/app/centers?center=koramangala"]);
    expect(await screen.findByRole("button", { name: "Delete franchise" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Disable franchise" })).toBeDefined();
  });

  it("regression_master_detail_selects_center", async () => {
    renderPage(["/app/centers?center=koramangala"]);
    expect(await screen.findByText("Franchise Identity")).toBeDefined();
    expect(screen.getByLabelText("Franchise Owner")).toBeDefined();
    expect(screen.getByLabelText("Display Name")).toBeDefined();
    expect(screen.getByLabelText("State")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
  });

  it("regression_search_by_phone", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    });
    fireEvent.click(screen.getByRole("button", { name: /Total Centers/i }));
    fireEvent.change(screen.getByPlaceholderText("Search centers…"), {
      target: { value: "90000" },
    });
    await waitFor(() => {
      expect(screen.getByText("Jayanagar")).toBeDefined();
      expect(screen.queryByText("Abacus Koramangala")).toBeNull();
    });
  });

  it("regression_brand_centers_exports_full_franchise_csv", async () => {
    renderPage();
    expect(await screen.findByText("Abacus Koramangala")).toBeDefined();
    const exportBtn = screen.getByRole("button", { name: "Export Franchise" });
    expect(exportBtn.className).toContain("ed-btn--secondary");
    expect((exportBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(exportBtn);
    await waitFor(() => {
      expect(downloadBrandCentersExport).toHaveBeenCalled();
    });
    expect(downloadBrandCentersExport.mock.calls[0]?.[1]).toBe("abacusworld");
  });
});
