import { describe, expect, it } from "vitest";
import { FEATURE_FLAG_DEFAULTS, resolveFeatureFlags } from "@/hooks/useFeatureFlag";

describe("resolveFeatureFlags (FF-01..03)", () => {
  it("FF-03 uses stored value when present", () => {
    expect(resolveFeatureFlags({ campaigns: true }, "campaigns")).toBe(true);
  });

  it("FF-01 / FF-02 regression_falls_back_to_defaults", () => {
    expect(resolveFeatureFlags({}, "student_leads")).toBe(FEATURE_FLAG_DEFAULTS.student_leads);
    expect(resolveFeatureFlags(undefined, "merchandise")).toBe(false);
    expect(resolveFeatureFlags({ kits: true }, "merchandise")).toBe(true);
  });

  it("regression_empty_features_object_not_undefined", () => {
    expect(resolveFeatureFlags(undefined, "student_leads")).toBe(true);
    expect(resolveFeatureFlags({}, "campaigns")).toBe(false);
  });

  it("regression_batches_defaults_off_until_enabled", () => {
    expect(resolveFeatureFlags({}, "batches")).toBe(false);
    expect(resolveFeatureFlags(undefined, "batches")).toBe(false);
    expect(resolveFeatureFlags({ batches: true }, "batches")).toBe(true);
  });

  it("regression_competitions_defaults_off_until_enabled", () => {
    expect(resolveFeatureFlags({}, "competitions")).toBe(false);
    expect(resolveFeatureFlags(undefined, "competitions")).toBe(false);
    expect(resolveFeatureFlags({ competitions: true }, "competitions")).toBe(true);
  });

  it("regression_learn_nav_shows_events_when_competitions_flag_on", async () => {
    const { studentNavSections } = await import("@/lib/portalNav");
    const withFlag = studentNavSections("/", { competitions: true });
    const labels = withFlag.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Events");

    const withoutFlag = studentNavSections("/", { competitions: false });
    const labelsOff = withoutFlag.flatMap((s) => s.items.map((i) => i.label));
    expect(labelsOff).not.toContain("Events");
  });
});
