import type { CenterStatusTone } from "@edunudg/ui";
import type { BrandCenterRow, CenterStatus } from "@/lib/centerCentersApi";
import {
  DEFAULT_FRANCHISE_IMPORT_COUNTRY,
  FRANCHISE_SPREADSHEET_CURRICULUM_SHEET,
  FRANCHISE_SPREADSHEET_DATA_SHEET,
  formatCurriculumAssignment,
} from "@/lib/franchiseCenterImportHelpers";
import { downloadTextFile } from "@/lib/platformDataExportHelpers";
import { initialsFromName } from "@/lib/welcomeMessage";

export type CenterFilter = "active" | "suspended" | "all";

export const CENTER_FILTER_OPTIONS: { value: CenterFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

const AVATAR_TONES = ["blue", "purple", "teal", "gray"] as const;

export function centerListTitle(center: BrandCenterRow): string {
  return center.display_name ?? center.name;
}

export function centerLocationLine(center: BrandCenterRow): string {
  return [center.city, center.region].filter(Boolean).join(", ") || center.slug;
}

export function centerFranchiseId(center: BrandCenterRow, brandPrefix = "EN"): string {
  const code = center.slug.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CTR";
  const num = center.id.replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `${brandPrefix}-${code}-${num}`;
}

export function centerInitials(center: BrandCenterRow): string {
  return initialsFromName(centerListTitle(center));
}

export function centerAvatarTone(index: number): (typeof AVATAR_TONES)[number] {
  return AVATAR_TONES[index % AVATAR_TONES.length]!;
}

export function centerStatusTone(status: CenterStatus): CenterStatusTone {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  if (status === "closed") return "closed";
  return "pending";
}

export function centerCounts(centers: BrandCenterRow[]) {
  return {
    total: centers.length,
    active: centers.filter((center) => center.status === "active").length,
    suspended: centers.filter((center) => center.status === "suspended").length,
    all: centers.length,
  };
}

export function filterCenters(centers: BrandCenterRow[], filter: CenterFilter): BrandCenterRow[] {
  if (filter === "active") return centers.filter((center) => center.status === "active");
  if (filter === "suspended") return centers.filter((center) => center.status === "suspended");
  return centers;
}

export function centerStatsItems(
  stats: {
    openLeads: number;
    students: number;
    activeEnrollments: number;
  },
  backendBaseUrl?: string | null
) {
  const base = backendBaseUrl?.replace(/\/$/, "") || null;
  return [
    {
      key: "leads",
      label: "Open Leads",
      value: stats.openLeads,
      href: base ? `${base}/leads` : null,
    },
    {
      key: "students",
      label: "Students",
      value: stats.students,
      href: base ? `${base}/students` : null,
    },
    {
      key: "enrollments",
      label: "Active Enr.",
      value: stats.activeEnrollments,
      href: base ? `${base}/students` : null,
    },
  ];
}

export function programCurriculumSubtitle(ageLabel?: string | null, description?: string | null): string | undefined {
  const parts = [ageLabel?.trim(), description?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export const BRAND_CENTERS_CSV_HEADERS = [
  "center_slug",
  "name",
  "proposed_franchise_name",
  "city",
  "state",
  "country",
  "address",
  "pincode",
  "mobile_number",
  "curriculum_assignment",
  "status",
] as const;

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** UTF-8 BOM CSV of every live franchise (not the current search/filter). Soft-deleted centers are omitted. */
export function brandCentersToCsv(
  centers: BrandCenterRow[],
  assignments: Map<string, string[]> = new Map()
): string {
  const lines = [
    BRAND_CENTERS_CSV_HEADERS.join(","),
    ...centers.map((center) =>
      [
        center.slug,
        center.name,
        center.display_name,
        center.city,
        center.region,
        center.country?.trim() || DEFAULT_FRANCHISE_IMPORT_COUNTRY,
        center.address_line1,
        center.pincode,
        center.contact_phone,
        formatCurriculumAssignment(assignments.get(center.id) ?? []),
        center.status,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function brandCentersExportAoa(
  centers: BrandCenterRow[],
  assignments: Map<string, string[]> = new Map()
): string[][] {
  return [
    [...BRAND_CENTERS_CSV_HEADERS],
    ...centers.map((center) => [
      center.slug,
      center.name,
      center.display_name ?? "",
      center.city ?? "",
      center.region ?? "",
      center.country?.trim() || DEFAULT_FRANCHISE_IMPORT_COUNTRY,
      center.address_line1 ?? "",
      center.pincode ?? "",
      center.contact_phone ?? "",
      formatCurriculumAssignment(assignments.get(center.id) ?? []),
      center.status,
    ]),
  ];
}

export function brandCentersCsvFilename(brandSlug: string, now = new Date(), ext: "csv" | "xlsx" = "csv"): string {
  const slug = brandSlug.trim() || "brand";
  return `${slug}-franchises-${now.toISOString().slice(0, 10)}.${ext}`;
}

export function downloadBrandCentersCsv(
  centers: BrandCenterRow[],
  brandSlug: string,
  now = new Date(),
  assignments: Map<string, string[]> = new Map()
): void {
  downloadTextFile(
    brandCentersToCsv(centers, assignments),
    brandCentersCsvFilename(brandSlug, now, "csv"),
    "text/csv;charset=utf-8"
  );
}

export async function downloadBrandCentersExport(
  centers: BrandCenterRow[],
  brandSlug: string,
  options: { programNames?: string[]; assignments?: Map<string, string[]> } = {},
  now = new Date()
): Promise<void> {
  const XLSX = await import("xlsx");
  const programNames = options.programNames ?? [];
  const assignments = options.assignments ?? new Map<string, string[]>();
  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet(brandCentersExportAoa(centers, assignments));
  const curriculumColIndex = BRAND_CENTERS_CSV_HEADERS.indexOf("curriculum_assignment");
  const col = String.fromCharCode(65 + curriculumColIndex);
  const lastRow = Math.max(centers.length + 1, 500);
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
  XLSX.writeFile(workbook, brandCentersCsvFilename(brandSlug, now, "xlsx"));
}
