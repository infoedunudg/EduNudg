import { describe, expect, it } from "vitest";
import { isKnownChromeDevToolsWebVitalsError } from "./ClientErrorReporter";

describe("ClientErrorReporter browser error filtering", () => {
  it("regression_ignores_chrome_devtools_report_all_changes_start_time_error", () => {
    const message = "Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')";
    const stack = `TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at n.timeout (<anonymous>:2:5652)`;

    expect(isKnownChromeDevToolsWebVitalsError(message, stack)).toBe(true);
  });

  it("does not hide an application startTime error", () => {
    const message = "Cannot read properties of undefined (reading 'startTime')";
    const stack = "at calculateSchedule (src/lib/schedule.ts:10:2)";

    expect(isKnownChromeDevToolsWebVitalsError(message, stack)).toBe(false);
  });
});
