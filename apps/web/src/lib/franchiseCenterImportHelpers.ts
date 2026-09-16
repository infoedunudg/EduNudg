export const FRANCHISE_CENTER_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const FRANCHISE_CENTER_IMPORT_MAX_ROWS = 500;
export const FRANCHISE_CENTER_IMPORT_ACCEPT =
  ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type FranchiseCenterImportFileKind = "csv" | "xlsx" | "xls";

const EXCEL_UNSUPPORTED_MESSAGE = "Only .csv, .xlsx, or .xls files are supported.";

export type FranchiseCenterImportField =
  | "center_slug"
  | "name"
  | "city"
  | "display_name"
  | "region"
  | "country"
  | "address"
  | "pincode"
  | "contact_phone"
  | "owner_email"
  | "curriculum_assignment";

export type FranchiseCenterTemplateHeader =
  | "Owner Name"
  | "city"
  | "proposed_franchise_name"
  | "state"
  | "country"
  | "address"
  | "pincode"
  | "mobile_number"
  | "owner_email"
  | "curriculum_assignment";

export const DEFAULT_FRANCHISE_IMPORT_COUNTRY = "IN";

export type FranchiseCenterImportRow = Record<FranchiseCenterImportField, string>;

export type ParsedFranchiseCenterImportRow = {
  rowNumber: number;
  values: Partial<FranchiseCenterImportRow>;
  errors: string[];
};

export type FranchiseCenterImportPreview = {
  rows: ParsedFranchiseCenterImportRow[];
  validRows: FranchiseCenterImportRow[];
  fileError: string | null;
};

export type FranchiseCenterImportRpcRow = {
  center_slug: string;
  name: string;
  city: string;
  display_name?: string;
  region?: string;
  country?: string;
  address?: string;
  pincode?: string;
  contact_phone?: string;
  owner_email?: string;
};

const TEMPLATE_HEADERS: FranchiseCenterTemplateHeader[] = [
  "Owner Name",
  "city",
  "proposed_franchise_name",
  "state",
  "country",
  "address",
  "pincode",
  "mobile_number",
  "owner_email",
  "curriculum_assignment",
];

const HEADER_ALIASES: Record<string, FranchiseCenterImportField> = {
  center_slug: "center_slug",
  "center slug": "center_slug",
  slug: "center_slug",
  name: "name",
  "owner name": "name",
  owner_name: "name",
  "franchise owner": "name",
  city: "city",
  proposed_franchise_name: "display_name",
  "proposed franchise name": "display_name",
  display_name: "display_name",
  "display name": "display_name",
  region: "region",
  state: "region",
  country: "country",
  address: "address",
  "address line1": "address",
  pincode: "pincode",
  mobile_number: "contact_phone",
  "mobile number": "contact_phone",
  contact_phone: "contact_phone",
  "contact phone": "contact_phone",
  phone: "contact_phone",
  owner_email: "owner_email",
  "owner email": "owner_email",
  curriculum_assignment: "curriculum_assignment",
  "curriculum assignment": "curriculum_assignment",
};

const TEMPLATE_SAMPLE: Record<FranchiseCenterTemplateHeader, string> = {
  "Owner Name": "Amit Sharma",
  city: "Mumbai",
  proposed_franchise_name: "Abacus World Andheri",
  state: "Maharashtra",
  country: DEFAULT_FRANCHISE_IMPORT_COUNTRY,
  address: "123 Main Road",
  pincode: "400053",
  mobile_number: "+919876543210",
  owner_email: "owner@example.com",
  curriculum_assignment: "",
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const PINCODE_PATTERN = /^\d{4,12}$/;

export function normalizeImportHeader(header: string): FranchiseCenterImportField | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

/** Neutralize CSV formula-injection prefixes and strip control characters. */
export function sanitizeImportCell(value: string, maxLen: number): string {
  let text = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (/^[=+\-@\t]/.test(text)) {
    text = text.slice(1).trimStart();
  }
  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
  }
  return text;
}

export function parseCurriculumAssignmentCell(value: string): string[] {
  return sanitizeImportCell(value, 500)
    .split(/[;|,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatCurriculumAssignment(names: string[]): string {
  return names.filter(Boolean).join("; ");
}

export function resolveCurriculumProgramIds(
  names: string[],
  catalog: { id: string; name: string }[]
): { ids: string[]; unknown: string[] } {
  const byName = new Map(catalog.map((program) => [program.name.trim().toLowerCase(), program.id]));
  const ids: string[] = [];
  const unknown: string[] = [];
  for (const name of names) {
    const id = byName.get(name.toLowerCase());
    if (!id) {
      unknown.push(name);
      continue;
    }
    if (!ids.includes(id)) ids.push(id);
  }
  return { ids, unknown };
}

export function applyFranchiseCurriculumCatalog(
  preview: FranchiseCenterImportPreview,
  catalog: { id: string; name: string }[]
): FranchiseCenterImportPreview {
  if (preview.fileError || catalog.length === 0) return preview;

  const rows = preview.rows.map((row) => {
    const names = parseCurriculumAssignmentCell(row.values.curriculum_assignment ?? "");
    if (names.length === 0) return row;
    const { unknown } = resolveCurriculumProgramIds(names, catalog);
    if (unknown.length === 0) return row;
    const extra = `Unknown curriculum_assignment: ${unknown.join(", ")}. Use a course name from Curriculum.`;
    return { ...row, errors: [...row.errors, extra] };
  });

  const validRows = rows.filter((row) => row.errors.length === 0).map((row) => {
    const built = preview.validRows.find((valid) => valid.center_slug === row.values.center_slug);
    return built ?? (row.values as FranchiseCenterImportRow);
  });

  return { ...preview, rows, validRows };
}

export function slugifyImportSlug(value: string): string {
  return sanitizeImportCell(value, 48)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build a URL slug from franchise name (city fallback), uniqued against reserved values. */
export function deriveFranchiseCenterSlug(name: string, city: string, reserved: Set<string> = new Set()): string {
  const base = slugifyImportSlug(name) || slugifyImportSlug(city);
  if (!base || !SLUG_PATTERN.test(base)) return "";

  if (!reserved.has(base)) return base;

  for (let n = 2; n <= 999; n += 1) {
    const suffix = `-${n}`;
    const trimmed = base.slice(0, Math.max(1, 48 - suffix.length)).replace(/-+$/g, "");
    const candidate = `${trimmed}${suffix}`;
    if (SLUG_PATTERN.test(candidate) && !reserved.has(candidate)) return candidate;
  }

  return "";
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  cells.push(current);
  return cells;
}

export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "\n") {
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
    } else if (ch === ",") {
      row.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  if (inQuotes) {
    throw new Error("CSV file has an unclosed quote.");
  }

  return rows;
}

export function franchiseCenterImportFileKind(fileName: string): FranchiseCenterImportFileKind | null {
  const name = fileName.trim().toLowerCase();
  if (name.endsWith(".xlsx")) return "xlsx";
  if (name.endsWith(".xls")) return "xls";
  if (name.endsWith(".csv")) return "csv";
  return null;
}

export function validateImportFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv")) {
    return "Only .csv files are supported.";
  }
  if (file.size > FRANCHISE_CENTER_IMPORT_MAX_BYTES) {
    return "File is too large (max 2 MB).";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}

/** Franchise import accepts CSV and Excel; student/lead import still uses `validateImportFile` (CSV only). */
export function validateFranchiseCenterImportFile(file: File): string | null {
  if (!franchiseCenterImportFileKind(file.name)) {
    return EXCEL_UNSUPPORTED_MESSAGE;
  }
  if (file.size > FRANCHISE_CENTER_IMPORT_MAX_BYTES) {
    return "File is too large (max 2 MB).";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}

export function validateImportRow(
  values: Partial<FranchiseCenterImportRow>,
  seenSlugs: Set<string>
): string[] {
  const errors: string[] = [];
  const name = sanitizeImportCell(values.name ?? "", 200);
  const city = sanitizeImportCell(values.city ?? "", 100);
  const slug = values.center_slug || deriveFranchiseCenterSlug(name, city, seenSlugs);
  const ownerEmail = sanitizeImportCell(values.owner_email ?? "", 320).toLowerCase();
  const pincode = sanitizeImportCell(values.pincode ?? "", 12);

  if (!name) errors.push("name is required.");
  if (!city) errors.push("city is required.");

  if (name && city && (!slug || !SLUG_PATTERN.test(slug))) {
    errors.push("Could not create a URL from the franchise name. Use letters or numbers in the name.");
  }

  if (ownerEmail && !EMAIL_PATTERN.test(ownerEmail)) {
    errors.push("owner_email is not a valid email address.");
  }

  if (pincode && !PINCODE_PATTERN.test(pincode)) {
    errors.push("pincode must be 4–12 digits.");
  }

  return errors;
}

export function buildImportRow(
  values: Partial<FranchiseCenterImportRow>,
  reservedSlugs: Set<string> = new Set()
): FranchiseCenterImportRow {
  const name = sanitizeImportCell(values.name ?? "", 200);
  const city = sanitizeImportCell(values.city ?? "", 100);
  return {
    center_slug: deriveFranchiseCenterSlug(name, city, reservedSlugs),
    name,
    city,
    display_name: sanitizeImportCell(values.display_name ?? "", 200),
    region: sanitizeImportCell(values.region ?? "", 100),
    country: (sanitizeImportCell(values.country ?? "", 2) || DEFAULT_FRANCHISE_IMPORT_COUNTRY).toUpperCase(),
    address: sanitizeImportCell(values.address ?? "", 500),
    pincode: sanitizeImportCell(values.pincode ?? "", 12),
    contact_phone: sanitizeImportCell(values.contact_phone ?? "", 32),
    owner_email: sanitizeImportCell(values.owner_email ?? "", 320).toLowerCase(),
    curriculum_assignment: sanitizeImportCell(values.curriculum_assignment ?? "", 500),
  };
}

export function toRpcRow(row: FranchiseCenterImportRow): FranchiseCenterImportRpcRow {
  const payload: FranchiseCenterImportRpcRow = {
    center_slug: row.center_slug,
    name: row.name,
    city: row.city,
  };
  if (row.display_name) payload.display_name = row.display_name;
  if (row.region) payload.region = row.region;
  payload.country = row.country || DEFAULT_FRANCHISE_IMPORT_COUNTRY;
  if (row.address) payload.address = row.address;
  if (row.pincode) payload.pincode = row.pincode;
  if (row.contact_phone) payload.contact_phone = row.contact_phone;
  if (row.owner_email) payload.owner_email = row.owner_email;
  return payload;
}

export type FranchiseImportRpcError = { row: number; message: string };

export type FranchiseImportRowFailure = { rowNumber: number; message: string };

/** Map opaque Postgres errors to spreadsheet-facing copy. */
export function humanizeFranchiseImportServerMessage(raw: string): string {
  const text = raw.trim();
  const lower = text.toLowerCase();
  if (lower.includes("duplicate key") || lower.includes("unique constraint") || lower.includes("already exists")) {
    if (lower.includes("domain_mappings") || lower.includes("hostname")) {
      return "A center website URL for this name already exists. Change the Franchise Owner name, or delete the existing franchise first.";
    }
    if (lower.includes("slug") || lower.includes("franchise_centers")) {
      return "A franchise with this name already exists for the brand. Use a different Franchise Owner name.";
    }
    return "This row duplicates an existing franchise. Change the Franchise Owner name or remove the existing center.";
  }
  if (lower.includes("brand franchise center limit")) {
    return "Brand franchise center limit reached. Remove unused franchises or raise the plan limit.";
  }
  return text || "This row could not be imported.";
}

/**
 * RPC `row` is 1-based among rows sent to the server (client-valid rows), not the spreadsheet line.
 * Attach those messages to the matching CSV/Excel row numbers and drop failed rows from a retry payload.
 */
export function applyFranchiseImportRpcErrors(
  preview: FranchiseCenterImportPreview,
  rpcErrors: FranchiseImportRpcError[]
): { preview: FranchiseCenterImportPreview; failures: FranchiseImportRowFailure[] } {
  const ready = preview.rows.filter((row) => row.errors.length === 0);
  const failures: FranchiseImportRowFailure[] = rpcErrors.map((err) => {
    const parsed = ready[err.row - 1];
    return {
      rowNumber: parsed?.rowNumber ?? err.row,
      message: humanizeFranchiseImportServerMessage(err.message),
    };
  });
  const extraByCsvRow = new Map<number, string[]>();
  for (const failure of failures) {
    const next = extraByCsvRow.get(failure.rowNumber) ?? [];
    next.push(failure.message);
    extraByCsvRow.set(failure.rowNumber, next);
  }
  const rows = preview.rows.map((row) => {
    const extra = extraByCsvRow.get(row.rowNumber);
    if (!extra?.length) return row;
    return { ...row, errors: [...row.errors, ...extra] };
  });
  const failedCsvRows = new Set(failures.map((item) => item.rowNumber));
  const validRows = preview.validRows.filter((_, index) => {
    const parsed = ready[index];
    return parsed ? !failedCsvRows.has(parsed.rowNumber) : false;
  });
  return { preview: { ...preview, rows, validRows }, failures };
}

export function formatFranchiseImportFailureSummary(failures: FranchiseImportRowFailure[]): string {
  if (failures.length === 0) return "Import failed.";
  const noun = failures.length === 1 ? "row" : "rows";
  return `${failures.length} ${noun} failed on the server. Fix the highlighted spreadsheet rows and upload again.`;
}

/** Shared initial franchise password requested by brand operations. */
export function buildFranchiseDefaultPassword(brandName: string, brandSlug = ""): string {
  const normalizedName = brandName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const normalizedSlug = brandSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${normalizedName || normalizedSlug || "franchise"}@123`;
}

function sheetCellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

function normalizeImportMatrix(matrix: unknown[][]): string[][] {
  return matrix
    .map((row) => row.map((cell) => sheetCellToString(cell)))
    .filter((row) => row.some((cell) => cell.trim() !== ""));
}

export function parseFranchiseCenterImportMatrix(
  matrix: string[][],
  sourceLabel = "CSV"
): FranchiseCenterImportPreview {
  if (matrix.length < 2) {
    return {
      rows: [],
      validRows: [],
      fileError: `${sourceLabel} must include a header row and at least one data row.`,
    };
  }

  const mappedFields = matrix[0].map((cell) => normalizeImportHeader(cell));
  const recognized = mappedFields.filter(Boolean).length;

  if (recognized === 0) {
    return {
      rows: [],
      validRows: [],
      fileError: `Unrecognized ${sourceLabel} headers. Download the template and use the provided column names.`,
    };
  }

  if (!mappedFields.includes("name") || !mappedFields.includes("city")) {
    return {
      rows: [],
      validRows: [],
      fileError: `${sourceLabel} must include name and city columns.`,
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > FRANCHISE_CENTER_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      validRows: [],
      fileError: `Too many rows (max ${FRANCHISE_CENTER_IMPORT_MAX_ROWS}).`,
    };
  }

  const seenSlugs = new Set<string>();
  const parsedRows: ParsedFranchiseCenterImportRow[] = [];
  const validRows: FranchiseCenterImportRow[] = [];

  dataRows.forEach((cells, index) => {
    const values: Partial<FranchiseCenterImportRow> = {};
    mappedFields.forEach((field, colIndex) => {
      if (!field) return;
      values[field] = sanitizeImportCell(cells[colIndex] ?? "", 500);
    });

    const built = buildImportRow(values, seenSlugs);
    const errors = validateImportRow(built, seenSlugs);
    if (errors.length === 0) {
      seenSlugs.add(built.center_slug);
      validRows.push(built);
    }

    parsedRows.push({
      rowNumber: index + 2,
      values: built,
      errors,
    });
  });

  return { rows: parsedRows, validRows, fileError: null };
}

export function parseFranchiseCenterImportCsv(text: string): FranchiseCenterImportPreview {
  let matrix: string[][];
  try {
    matrix = parseCsvText(text);
  } catch (err) {
    return { rows: [], validRows: [], fileError: err instanceof Error ? err.message : "Invalid CSV file." };
  }

  return parseFranchiseCenterImportMatrix(matrix, "CSV");
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  if (typeof FileReader === "undefined") {
    throw new Error("File reading is not supported in this environment.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as ArrayBuffer) ?? new ArrayBuffer(0));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFranchiseCenterImportExcel(file: File): Promise<FranchiseCenterImportPreview> {
  let matrix: string[][];
  try {
    const XLSX = await import("xlsx");
    const bytes = new Uint8Array(await readFileAsArrayBuffer(file));
    const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], validRows: [], fileError: "Excel file has no worksheets." };
    }
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    matrix = normalizeImportMatrix(raw);
  } catch {
    return { rows: [], validRows: [], fileError: "Could not read Excel file." };
  }

  return parseFranchiseCenterImportMatrix(matrix, "Excel");
}

export function franchiseCenterImportTemplateCsv(): string {
  const header = TEMPLATE_HEADERS.join(",");
  const sample = TEMPLATE_HEADERS.map((field) => {
    const value = TEMPLATE_SAMPLE[field];
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",");
  return `\uFEFF${header}\n${sample}\n`;
}

export const FRANCHISE_SPREADSHEET_DATA_SHEET = "Franchises";
export const FRANCHISE_SPREADSHEET_CURRICULUM_SHEET = "Curriculum";

export function franchiseImportCurriculumColumnLetter(): string {
  const index = TEMPLATE_HEADERS.indexOf("curriculum_assignment");
  const code = index + 65;
  return String.fromCharCode(code);
}

export function buildFranchiseCenterImportAoa(programNames: string[] = []): string[][] {
  const sample = TEMPLATE_HEADERS.map((field) =>
    field === "curriculum_assignment" ? programNames[0] ?? "" : TEMPLATE_SAMPLE[field]
  );
  return [TEMPLATE_HEADERS, sample];
}

export async function downloadFranchiseCenterImportTemplate(
  brandSlug: string,
  programNames: string[] = []
): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet(buildFranchiseCenterImportAoa(programNames));
  const lastRow = Math.max(500, 2);
  const col = franchiseImportCurriculumColumnLetter();
  if (programNames.length > 0) {
    (dataSheet as Record<string, unknown>)["!dataValidations"] = [
      {
        sqref: `${col}2:${col}${lastRow}`,
        type: "list",
        allowBlank: true,
        formula1: `${FRANCHISE_SPREADSHEET_CURRICULUM_SHEET}!$A$1:$A$${programNames.length}`,
      },
    ];
  }
  XLSX.utils.book_append_sheet(workbook, dataSheet, FRANCHISE_SPREADSHEET_DATA_SHEET);
  const curriculumSheet = XLSX.utils.aoa_to_sheet(
    programNames.length > 0 ? programNames.map((name) => [name]) : [["No published curriculum yet"]]
  );
  XLSX.utils.book_append_sheet(workbook, curriculumSheet, FRANCHISE_SPREADSHEET_CURRICULUM_SHEET);
  XLSX.writeFile(workbook, `franchise-centers-import-${brandSlug}.xlsx`);
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  if (typeof FileReader === "undefined") {
    throw new Error("File reading is not supported in this environment.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

export async function readImportCsvFile(file: File): Promise<{ text: string | null; error: string | null }> {
  const fileError = validateImportFile(file);
  if (fileError) return { text: null, error: fileError };

  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { text: null, error: "Could not read file." };
  }

  if (text.includes("\0")) {
    return { text: null, error: "File appears to be binary, not a CSV text file." };
  }

  return { text, error: null };
}

export async function readFranchiseCenterImportFile(
  file: File
): Promise<{ preview: FranchiseCenterImportPreview | null; error: string | null }> {
  const fileError = validateFranchiseCenterImportFile(file);
  if (fileError) return { preview: null, error: fileError };

  const kind = franchiseCenterImportFileKind(file.name);
  if (kind === "xlsx" || kind === "xls") {
    const preview = await parseFranchiseCenterImportExcel(file);
    if (preview.fileError) return { preview: null, error: preview.fileError };
    return { preview, error: null };
  }

  const { text, error } = await readImportCsvFile(file);
  if (error || !text) return { preview: null, error: error ?? "Could not read file." };

  const preview = parseFranchiseCenterImportCsv(text);
  if (preview.fileError) return { preview: null, error: preview.fileError };
  return { preview, error: null };
}

/** @internal exported for tests */
export { parseCsvLine, SLUG_PATTERN, EMAIL_PATTERN };
