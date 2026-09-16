import { describe, expect, it, vi } from "vitest";
import {
  buildImportRow,
  applyFranchiseImportRpcErrors,
  formatFranchiseImportFailureSummary,
  humanizeFranchiseImportServerMessage,
  parseCsvText,
  parseFranchiseCenterImportCsv,
  parseFranchiseCenterImportExcel,
  sanitizeImportCell,
  slugifyImportSlug,
  toRpcRow,
  validateFranchiseCenterImportFile,
  validateImportFile,
  validateImportRow,
} from "./franchiseCenterImportHelpers";

describe("franchiseCenterImportHelpers", () => {
  it("parses quoted CSV cells", () => {
    expect(parseCsvText('name,city\n"Mumbai, West","Mumbai"')).toEqual([
      ["name", "city"],
      ["Mumbai, West", "Mumbai"],
    ]);
  });

  it("sanitizes formula-injection prefixes", () => {
    expect(sanitizeImportCell("=cmd|'/c calc'!A0", 200)).toBe("cmd|'/c calc'!A0");
    expect(sanitizeImportCell("+1234", 200)).toBe("1234");
  });

  it("regression_sql_injection_in_name_is_plain_text_not_sql", () => {
    const row = buildImportRow({
      name: "'; DROP TABLE franchise_centers;--",
      city: "Mumbai",
    });
    expect(row.name).toContain("DROP TABLE");
    expect(validateImportRow(row, new Set())).toEqual([]);
    expect(toRpcRow(row).name).toContain("DROP TABLE");
  });

  it("regression_script_tag_in_name_is_stored_as_text", () => {
    const row = buildImportRow({
      name: "Safe Center",
      city: "Mumbai",
      display_name: "<script>alert(1)</script>",
    });
    expect(row.display_name).toBe("<script>alert(1)</script>");
    expect(validateImportRow(row, new Set())).toEqual([]);
  });

  it("regression_franchise_csv_maps_owner_display_state_and_curriculum", () => {
    const csv = `name,city,proposed_franchise_name,state,curriculum_assignment
Shital Basante,Pune,Shital Learning,Maharashtra,Abacus Core`;
    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows[0]?.name).toBe("Shital Basante");
    expect(preview.validRows[0]?.display_name).toBe("Shital Learning");
    expect(preview.validRows[0]?.region).toBe("Maharashtra");
    expect(preview.validRows[0]?.curriculum_assignment).toBe("Abacus Core");
    expect(toRpcRow(preview.validRows[0]!)).toMatchObject({
      name: "Shital Basante",
      display_name: "Shital Learning",
      region: "Maharashtra",
    });
    expect(toRpcRow(preview.validRows[0]!)).not.toHaveProperty("curriculum_assignment");
  });

  it("regression_franchise_import_template_uses_owner_name_header", () => {
    const csv = `Owner Name,city
Amit Sharma,Mumbai`;
    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows[0]?.name).toBe("Amit Sharma");
    expect(preview.validRows[0]?.center_slug).toBe("amit-sharma");
  });

  it("derives slug from name and ignores center_slug column", () => {
    const csv = `center_slug,name,city
ignored-slug,Andheri West,Mumbai`;

    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows[0]?.center_slug).toBe("andheri-west");
  });

  it("uniques duplicate names in the same file", () => {
    const csv = `name,city
Koramangala,Bengaluru
Koramangala,Bengaluru`;

    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.validRows).toHaveLength(2);
    expect(preview.validRows[0]?.center_slug).toBe("koramangala");
    expect(preview.validRows[1]?.center_slug).toBe("koramangala-2");
  });

  it("rejects files over row limit", () => {
    const header = "name,city\n";
    const rows = Array.from({ length: 501 }, (_, i) => `Name ${i},City`).join("\n");
    const preview = parseFranchiseCenterImportCsv(header + rows);
    expect(preview.fileError).toMatch(/Too many rows/);
  });

  it("validateImportFile rejects non-csv extension", () => {
    const file = new File(["a"], "centers.txt", { type: "text/plain" });
    expect(validateImportFile(file)).toMatch(/Only \.csv files are supported/);
    expect(validateImportFile(file)).not.toMatch(/xlsx/);
  });

  it("regression_franchise_import_accepts_xlsx", async () => {
    const xlsxFile = new File(["a"], "centers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const xlsFile = new File(["a"], "centers.xls", { type: "application/vnd.ms-excel" });
    const csvFile = new File(["a"], "centers.csv", { type: "text/csv" });
    expect(validateFranchiseCenterImportFile(xlsxFile)).toBeNull();
    expect(validateFranchiseCenterImportFile(xlsFile)).toBeNull();
    expect(validateFranchiseCenterImportFile(csvFile)).toBeNull();
    expect(validateFranchiseCenterImportFile(new File(["a"], "centers.txt", { type: "text/plain" }))).toMatch(
      /Only \.csv, \.xlsx, or \.xls/
    );

    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Name", "City", "Pincode"],
      ["Andheri West", "Mumbai", 400053],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Centers");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const payload = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
    const excelFile = new File([payload as BlobPart], "centers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const preview = await parseFranchiseCenterImportExcel(excelFile);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]?.center_slug).toBe("andheri-west");
    expect(preview.validRows[0]?.city).toBe("Mumbai");
    expect(preview.validRows[0]?.pincode).toBe("400053");
  });

  it("slugifyImportSlug normalizes values", () => {
    expect(slugifyImportSlug("Mumbai Andheri")).toBe("mumbai-andheri");
  });

  it("parseFranchiseCenterImportCsv accepts export-style headers without slug", () => {
    const csv = `Name,City,Owner Email
Andheri West,Mumbai,owner@example.com`;

    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]?.center_slug).toBe("andheri-west");
    expect(preview.validRows[0]?.owner_email).toBe("owner@example.com");
  });

  it("regression_franchise_import_maps_server_errors_to_spreadsheet_rows", () => {
    const csv = `name,city
Andheri West,Mumbai
Bandra West,Mumbai`;
    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.rows.map((row) => row.rowNumber)).toEqual([2, 3]);

    const raw =
      'duplicate key value violates unique constraint "domain_mappings_hostname_key"';
    expect(humanizeFranchiseImportServerMessage(raw)).toMatch(/center website URL/i);

    const applied = applyFranchiseImportRpcErrors(preview, [
      { row: 1, message: raw },
      { row: 2, message: "Invalid pincode" },
    ]);
    expect(applied.failures[0]?.rowNumber).toBe(2);
    expect(applied.failures[0]?.message).toMatch(/center website URL/i);
    expect(applied.failures[1]).toEqual({ rowNumber: 3, message: "Invalid pincode" });
    expect(applied.preview.validRows).toHaveLength(0);
    expect(applied.preview.rows[0]?.errors.join(" ")).toMatch(/center website URL/i);
    expect(applied.preview.rows[1]?.errors).toContain("Invalid pincode");
    expect(formatFranchiseImportFailureSummary(applied.failures)).toMatch(/2 rows failed/);
  });
});

describe("downloadFranchiseCenterImportTemplate", () => {
  it("regression_creates_downloadable_xlsx_template_with_curriculum_sheet", async () => {
    const { buildFranchiseCenterImportAoa, franchiseCenterImportTemplateCsv } = await import(
      "./franchiseCenterImportHelpers"
    );
    expect(franchiseCenterImportTemplateCsv()).toContain("Owner Name,city,proposed_franchise_name");
    expect(franchiseCenterImportTemplateCsv()).toContain("Amit Sharma");
    expect(franchiseCenterImportTemplateCsv()).not.toContain("Mumbai Andheri Center");
    expect(franchiseCenterImportTemplateCsv()).toContain(",state,");
    expect(franchiseCenterImportTemplateCsv()).toContain("curriculum_assignment");
    expect(franchiseCenterImportTemplateCsv()).not.toContain("display_name");
    const aoa = buildFranchiseCenterImportAoa(["Abacus Core"]);
    expect(aoa[0][0]).toBe("Owner Name");
    expect(aoa[1]?.[0]).toBe("Amit Sharma");
    expect(aoa[0]).toContain("curriculum_assignment");
    expect(aoa[0]).toContain("state");
    expect(aoa[1]?.[aoa[0].indexOf("curriculum_assignment")]).toBe("Abacus Core");
  });
});
