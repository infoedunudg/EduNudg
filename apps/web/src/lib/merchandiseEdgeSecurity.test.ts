import { describe, expect, it } from "vitest";
import {
  merchandiseCheckoutAuthStatus,
  merchandiseReminderAuthStatus,
} from "./merchandiseEdgeSecurity";

describe("merchandiseEdgeSecurity", () => {
  it("regression_merchandise_reminders_require_cron_secret", () => {
    expect(merchandiseReminderAuthStatus(undefined, "anything")).toBe(503);
    expect(merchandiseReminderAuthStatus("", "anything")).toBe(503);
    expect(merchandiseReminderAuthStatus("  ", "  ")).toBe(503);
    expect(merchandiseReminderAuthStatus("secret", null)).toBe(401);
    expect(merchandiseReminderAuthStatus("secret", "wrong")).toBe(401);
    expect(merchandiseReminderAuthStatus("secret", "secret")).toBe("ok");
  });

  it("regression_merchandise_razorpay_checkout_requires_membership", () => {
    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: false,
        hasUser: false,
        isAdmin: false,
        hasCenterAccess: false,
        hasBrandAccess: false,
      })
    ).toBe(401);

    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: true,
        hasUser: false,
        isAdmin: false,
        hasCenterAccess: false,
        hasBrandAccess: false,
      })
    ).toBe(401);

    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: true,
        hasUser: true,
        isAdmin: false,
        hasCenterAccess: false,
        hasBrandAccess: false,
      })
    ).toBe(403);

    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: true,
        hasUser: true,
        isAdmin: false,
        hasCenterAccess: true,
        hasBrandAccess: false,
      })
    ).toBe("ok");

    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: true,
        hasUser: true,
        isAdmin: false,
        hasCenterAccess: false,
        hasBrandAccess: true,
      })
    ).toBe("ok");

    expect(
      merchandiseCheckoutAuthStatus({
        hasAuthHeader: true,
        hasUser: true,
        isAdmin: true,
        hasCenterAccess: false,
        hasBrandAccess: false,
      })
    ).toBe("ok");
  });
});
