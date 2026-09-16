import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { CenterDetailPanel } from "./CenterDetailPanel";
import type { BrandCenterRow } from "@/lib/centerCentersApi";

const updateFranchiseCenter = vi.fn().mockResolvedValue(undefined);
const setFranchiseCenterStatus = vi.fn().mockResolvedValue(undefined);
const softDeleteFranchiseCenter = vi.fn().mockResolvedValue(undefined);
const fetchCenterOwnerLoginEmail = vi.fn().mockResolvedValue("owner@arti.example.com");
const upsertCenterOwnerCredentials = vi.fn().mockResolvedValue({ error: null });
const shouldSyncCenterOwnerCredentials = vi.fn();

vi.mock("@/lib/centerCentersApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/centerCentersApi")>(
    "@/lib/centerCentersApi"
  );
  return {
    ...actual,
    fetchCenterStats: vi.fn().mockResolvedValue({
      students: 0,
      staff: 0,
      openLeads: 0,
      revenueMtd: 0,
    }),
    updateFranchiseCenter: (...args: unknown[]) => updateFranchiseCenter(...args),
    setFranchiseCenterStatus: (...args: unknown[]) => setFranchiseCenterStatus(...args),
    softDeleteFranchiseCenter: (...args: unknown[]) => softDeleteFranchiseCenter(...args),
  };
});

vi.mock("@/lib/centerOwnerCredentialsApi", () => ({
  fetchCenterOwnerLoginEmail: (...args: unknown[]) => fetchCenterOwnerLoginEmail(...args),
  upsertCenterOwnerCredentials: (...args: unknown[]) => upsertCenterOwnerCredentials(...args),
  shouldSyncCenterOwnerCredentials: (...args: unknown[]) => shouldSyncCenterOwnerCredentials(...args),
}));

vi.mock("@/lib/centerCurriculumApi", () => ({
  fetchCenterAuthorizedProgramIds: vi.fn().mockResolvedValue([]),
  setCenterCourseAuthorized: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/features/center/settings/CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div data-testid="center-photo-upload">Photo</div>,
}));

const center: BrandCenterRow = {
  id: "center-arti",
  slug: "arti-drawing",
  name: "Arti Drawing",
  display_name: "Arti Drawing Pune",
  status: "active",
  city: "Pune",
  region: "MH",
  pincode: "411001",
  contact_phone: "+919999999999",
  address_line1: "1 Main St",
  short_description: "Art franchise",
  country: "IN",
  photo_url: null,
  social_links: [],
};

function renderPanel() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <CenterDetailPanel
          center={center}
          brandId="brand-vihaan"
          brandSlug="vihaan-abacas-pune"
          isMobile={false}
          onStatusChanged={() => undefined}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("CenterDetailPanel franchise login credentials", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });
    updateFranchiseCenter.mockClear();
    setFranchiseCenterStatus.mockClear();
    softDeleteFranchiseCenter.mockClear();
    fetchCenterOwnerLoginEmail.mockClear();
    upsertCenterOwnerCredentials.mockClear();
    shouldSyncCenterOwnerCredentials.mockReset();
    shouldSyncCenterOwnerCredentials.mockReturnValue(false);
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        hostname: "localhost",
        port: "9000",
        origin: "http://localhost:9000",
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  it("regression_franchise_identity_loads_login_email_from_database", async () => {
    renderPanel();
    expect(await screen.findByLabelText("Login email")).toHaveProperty(
      "value",
      "owner@arti.example.com"
    );
    expect(screen.getByText(/Franchise Identity/i)).toBeDefined();
    expect(screen.getByText(/at least 6 characters/i)).toBeDefined();
    expect(screen.getByRole("link", {
        name: /arti-drawing\.vihaan-abacas-pune\.localhost:9000\/login/,
      })
    ).toHaveProperty("href", "http://arti-drawing.vihaan-abacas-pune.localhost:9000/login");
  });

  it("regression_brand_centers_detail_omits_social_media_section", async () => {
    renderPanel();
    await screen.findByLabelText("Login email");
    expect(screen.queryByText("Social Media")).toBeNull();
    expect(screen.queryByRole("button", { name: /\+ Add Link/i })).toBeNull();
    expect(screen.queryByLabelText("Platform")).toBeNull();
  });

  it("regression_franchise_identity_login_hint_uses_vercel_same_origin_url", async () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "https:",
        hostname: "edunudg-hub.vercel.app",
        port: "",
        origin: "https://edunudg-hub.vercel.app",
      },
      writable: true,
    });
    renderPanel();
    await screen.findByLabelText("Login email");
    const loginLink = screen.getByRole("link", {
      name: /edunudg-hub\.vercel\.app\/login\?portal=center&brand=vihaan-abacas-pune&center=arti-drawing/,
    });
    expect(loginLink).toHaveProperty(
      "href",
      "https://edunudg-hub.vercel.app/login?portal=center&brand=vihaan-abacas-pune&center=arti-drawing"
    );
  });

  it("regression_profile_only_save_does_not_invoke_center_owner_credentials", async () => {
    shouldSyncCenterOwnerCredentials.mockReturnValue(false);
    const withSocial: BrandCenterRow = {
      ...center,
      social_links: [{ platform: "Instagram", url: "https://instagram.com/center" }],
    };
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterDetailPanel
            center={withSocial}
            brandId="brand-vihaan"
            brandSlug="vihaan-abacas-pune"
            isMobile={false}
            onStatusChanged={() => undefined}
          />
        </ThemeProvider>
      </QueryClientProvider>
    );
    await screen.findByLabelText("Login email");

    fireEvent.change(screen.getByLabelText("Franchise Owner"), {
      target: { value: "Arti Drawing Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateFranchiseCenter).toHaveBeenCalled());
    expect(upsertCenterOwnerCredentials).not.toHaveBeenCalled();
    expect(updateFranchiseCenter).toHaveBeenCalledWith(
      "center-arti",
      expect.objectContaining({
        name: "Arti Drawing Updated",
        socialLinks: [{ platform: "Instagram", url: "https://instagram.com/center" }],
      })
    );
  });

  it("regression_credential_save_invokes_center_owner_credentials", async () => {
    shouldSyncCenterOwnerCredentials.mockReturnValue(true);
    renderPanel();
    await screen.findByLabelText("Login email");

    fireEvent.change(screen.getByLabelText("Login email"), {
      target: { value: "new-owner@arti.example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "new-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(upsertCenterOwnerCredentials).toHaveBeenCalled());
    expect(upsertCenterOwnerCredentials).toHaveBeenCalledWith({
      centerId: "center-arti",
      brandId: "brand-vihaan",
      email: "new-owner@arti.example.com",
      password: "new-secret",
      fullName: "Arti Drawing",
    });
  });

  it("regression_short_password_save_scrolls_error_into_view", async () => {
    shouldSyncCenterOwnerCredentials.mockReturnValue(true);
    const scrollIntoView = vi.fn();
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      renderPanel();
      await screen.findByLabelText("Login email");

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(await screen.findByRole("alert")).toBeDefined();
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      expect(updateFranchiseCenter).not.toHaveBeenCalled();
      expect(upsertCenterOwnerCredentials).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it("regression_brand_centers_view_frontend_and_backend_links", async () => {
    renderPanel();
    expect(await screen.findByRole("link", { name: "View Frontend ↗" })).toHaveProperty(
      "href",
      "http://arti-drawing.vihaan-abacas-pune.localhost:9000/"
    );
    expect(screen.getByRole("link", { name: "View Backend ↗" })).toHaveProperty(
      "href",
      "http://arti-drawing.vihaan-abacas-pune.localhost:9000/app"
    );
  });

  it("regression_brand_centers_confirm_delete_calls_soft_delete_rpc", async () => {
    const onDeleted = vi.fn();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterDetailPanel
            center={center}
            brandId="brand-vihaan"
            brandSlug="vihaan-abacas-pune"
            isMobile={false}
            onStatusChanged={() => undefined}
            onDeleted={onDeleted}
          />
        </ThemeProvider>
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Delete franchise" }));
    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Delete franchise" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() =>
      expect(softDeleteFranchiseCenter).toHaveBeenCalledWith("center-arti", "")
    );
    expect(onDeleted).toHaveBeenCalled();
  });
});
