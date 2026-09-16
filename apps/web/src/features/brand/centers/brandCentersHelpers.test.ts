import { describe, expect, it } from "vitest";
import type { BrandCenterRow } from "@/lib/centerCentersApi";
import {
  brandCentersCsvFilename,
  brandCentersToCsv,
  centerCounts,
  centerFranchiseId,
  centerListTitle,
  centerLocationLine,
  centerStatsItems,
  centerStatusTone,
  filterCenters,
  programCurriculumSubtitle,
} from "./brandCentersHelpers";

const sample: BrandCenterRow = {
  id: "center-042",
  slug: "koramangala",
  name: "Koramangala 4th Block",
  display_name: "Abacus Koramangala",
  status: "active",
  city: "Bengaluru",
  region: "KA",
  pincode: "560034",
  contact_phone: "+91 9876543210",
  address_line1: null,
  short_description: null,
  country: "IN",
  photo_url: null,
  social_links: [],
};

describe("brandCentersHelpers", () => {
  it("formats list title and location", () => {
    expect(centerListTitle(sample)).toBe("Abacus Koramangala");
    expect(centerLocationLine(sample)).toBe("Bengaluru, KA");
  });

  it("builds franchise id from slug", () => {
    expect(centerFranchiseId(sample)).toBe("EN-KOR-042");
  });

  it("counts and filters centers", () => {
    const centers: BrandCenterRow[] = [
      sample,
      { ...sample, id: "c2", status: "suspended" },
    ];
    expect(centerCounts(centers)).toEqual({ total: 2, active: 1, suspended: 1, all: 2 });
    expect(filterCenters(centers, "suspended")).toHaveLength(1);
  });

  it("maps status tone and stats items", () => {
    expect(centerStatusTone("active")).toBe("active");
    expect(centerStatsItems({ openLeads: 128, students: 540, activeEnrollments: 412 })).toEqual([
      { key: "leads", label: "Open Leads", value: 128, href: null },
      { key: "students", label: "Students", value: 540, href: null },
      { key: "enrollments", label: "Active Enr.", value: 412, href: null },
    ]);
    expect(
      centerStatsItems(
        { openLeads: 1, students: 2, activeEnrollments: 3 },
        "http://koramangala.abacusworld.localhost:9000/app"
      )
    ).toEqual([
      {
        key: "leads",
        label: "Open Leads",
        value: 1,
        href: "http://koramangala.abacusworld.localhost:9000/app/leads",
      },
      {
        key: "students",
        label: "Students",
        value: 2,
        href: "http://koramangala.abacusworld.localhost:9000/app/students",
      },
      {
        key: "enrollments",
        label: "Active Enr.",
        value: 3,
        href: "http://koramangala.abacusworld.localhost:9000/app/students",
      },
    ]);
  });

  it("formats program curriculum subtitle", () => {
    expect(programCurriculumSubtitle("Ages 6-12", "Mental arithmetic program")).toBe(
      "Ages 6-12 · Mental arithmetic program"
    );
  });

  it("regression_brand_centers_csv_includes_every_live_franchise", () => {
    const csv = brandCentersToCsv([
      sample,
      {
        ...sample,
        id: "c2",
        slug: "jayanagar",
        name: "Jayanagar, South",
        country: null,
        status: "suspended",
        contact_phone: "+91 90000 11111",
      },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("center_slug,name,proposed_franchise_name");
    expect(csv).toContain(",state,");
    expect(csv).toContain("curriculum_assignment");
    expect(csv).toContain("mobile_number");
    expect(csv).not.toContain("display_name");
    expect(csv).not.toContain("contact_phone");
    expect(csv).not.toContain("short_description");
    expect(csv).not.toContain(",region,");
    expect(csv).toContain("koramangala,Koramangala 4th Block,Abacus Koramangala");
    expect(csv).toContain(",IN,");
    expect(csv).toContain('"Jayanagar, South"');
    expect(csv).toContain("jayanagar");
    expect(csv).toContain(",suspended");
    expect(
      brandCentersToCsv([sample], new Map([[sample.id, ["Abacus Core"]]]))
    ).toContain("Abacus Core");
  });

  it("regression_brand_centers_csv_filename_uses_brand_slug", () => {
    expect(brandCentersCsvFilename("smart-brain-abacus", new Date("2026-08-17T06:00:00Z"))).toBe(
      "smart-brain-abacus-franchises-2026-08-17.csv"
    );
  });
});
