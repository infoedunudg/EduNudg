import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { exactAccessibleName } from "@/test/exactAccessibleName";
import { FranchiseCenterImportDialog } from "./FranchiseCenterImportDialog";

const importFranchiseCentersMock = vi.fn();
const syncCenterProgramEnablementMock = vi.fn();
const upsertCenterOwnerCredentialsMock = vi.fn();
const fetchCenterOwnerLoginEmailMock = vi.fn();

vi.mock("@/lib/franchiseCenterImportApi", () => ({
  fetchFranchiseImportBrandName: vi.fn().mockResolvedValue("Smart Brain Abacus"),
  importFranchiseCenters: (...args: unknown[]) => importFranchiseCentersMock(...args),
}));

vi.mock("@/lib/centerOwnerCredentialsApi", () => ({
  fetchCenterOwnerLoginEmail: (...args: unknown[]) => fetchCenterOwnerLoginEmailMock(...args),
  upsertCenterOwnerCredentials: (...args: unknown[]) => upsertCenterOwnerCredentialsMock(...args),
}));

vi.mock("@/lib/centerProgramApi", () => ({
  fetchBrandPrograms: vi.fn().mockResolvedValue([{ id: "p1", name: "Abacus Core" }]),
  syncCenterProgramEnablement: (...args: unknown[]) => syncCenterProgramEnablementMock(...args),
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

function renderDialog(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("FranchiseCenterImportDialog", () => {
  beforeEach(() => {
    polyfillDialog();
    importFranchiseCentersMock.mockReset();
    syncCenterProgramEnablementMock.mockReset();
    syncCenterProgramEnablementMock.mockResolvedValue(undefined);
    upsertCenterOwnerCredentialsMock.mockReset();
    upsertCenterOwnerCredentialsMock.mockResolvedValue({ error: null });
    fetchCenterOwnerLoginEmailMock.mockReset();
    fetchCenterOwnerLoginEmailMock.mockResolvedValue(null);
    importFranchiseCentersMock.mockResolvedValue({
      result: { created: [{ row: 1, center_id: "c1", slug: "andheri-west" }], errors: [] },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows template actions when open", () => {
    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "Import franchise centers" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Download template" })).toBeDefined();
    expect(screen.getByText("Upload Franchise Data")).toBeDefined();
    expect(screen.getByText("Download the format")).toBeDefined();
    expect(screen.getByText("Add your data")).toBeDefined();
    expect(screen.getByText("Upload franchise data")).toBeDefined();
    expect(screen.getByText(/Owner Name/)).toBeDefined();
    expect(screen.getByText(/proposed_franchise_name/)).toBeDefined();
    expect(screen.getByText(/mobile_number/)).toBeDefined();
    expect(screen.getByText(/Reimporting the same Franchise Owner name/)).toBeDefined();
    expect(screen.queryByText(/short_description/)).toBeNull();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toMatch(/\.xlsx/);
    expect(input.accept).toMatch(/\.xls/);
  });

  it("regression_imported_franchises_receive_brand_default_password", async () => {
    const onImported = vi.fn();
    const onClose = vi.fn();
    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={onClose}
        onImported={onImported}
      />
    );

    const csv = `name,city,owner_email
Andheri West,Mumbai,owner@example.com`;

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([csv], "centers.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("1 ready")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Import 1 center" }));

    await waitFor(() => {
      expect(importFranchiseCentersMock).toHaveBeenCalledWith("b1", [
        expect.objectContaining({ center_slug: "andheri-west", name: "Andheri West", city: "Mumbai" }),
      ]);
      expect(onImported).toHaveBeenCalled();
      expect(screen.getByText(/Imported 1 franchise center/)).toBeDefined();
      expect(upsertCenterOwnerCredentialsMock).toHaveBeenCalledWith({
        centerId: "c1",
        brandId: "b1",
        email: "owner@example.com",
        password: "smartbrainabacus@123",
        fullName: "Andheri West",
      });
      expect(screen.getByText("smartbrainabacus@123")).toBeDefined();
    });

    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Close") }));
    expect(onClose).toHaveBeenCalled();
  });

  it("regression_import_reports_franchises_without_owner_email", async () => {
    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    const csv = `name,city
Andheri West,Mumbai`;
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([csv], "centers.csv", { type: "text/csv" })] } });

    const importButton = await screen.findByRole("button", { name: "Import 1 center" });
    await waitFor(() => expect(importButton).toHaveProperty("disabled", false));
    fireEvent.click(importButton);

    expect(await screen.findByText(/1 skipped because owner_email was blank/)).toBeDefined();
    expect(upsertCenterOwnerCredentialsMock).not.toHaveBeenCalled();
  });

  it("regression_rejects_malicious_csv_extension", async () => {
    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["center_slug,name,city"], "payload.exe.csv.bak", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/Only \.csv, \.xlsx, or \.xls/);
    });
    expect(importFranchiseCentersMock).not.toHaveBeenCalled();
  });

  it("regression_franchise_import_shows_server_row_errors", async () => {
    importFranchiseCentersMock.mockResolvedValue({
      result: {
        created: [],
        errors: [
          {
            row: 1,
            message: 'duplicate key value violates unique constraint "domain_mappings_hostname_key"',
          },
        ],
      },
      error: null,
    });

    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    const csv = `name,city
Andheri West,Mumbai`;
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([csv], "centers.csv", { type: "text/csv" })] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Import 1 center" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Import 1 center" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/1 row failed on the server/i);
    expect(alert.textContent).toMatch(/Spreadsheet row 2/i);
    expect(alert.textContent).toMatch(/center website URL/i);
    expect(screen.getByRole("button", { name: "Import 0 centers" })).toHaveProperty("disabled", true);
  });

  it("regression_franchise_import_accepts_xlsx", async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      ["name", "city"],
      ["Andheri West", "Mumbai"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Centers");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);

    renderDialog(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([buffer as BlobPart], "centers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("1 ready")).toBeDefined();
    });
    expect(screen.getByText("Andheri West")).toBeDefined();
    expect(screen.getByRole("button", { name: "Import 1 center" })).toBeDefined();
  });
});
