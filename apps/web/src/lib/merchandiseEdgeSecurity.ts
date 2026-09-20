/**
 * Auth contracts for merchandise Edge Functions.
 * Keep `supabase/functions/merchandise-*` behavior aligned with these helpers.
 */

export type MerchandiseReminderAuthResult = "ok" | 401 | 503;

/** Fail closed: missing CRON_SECRET → 503; wrong header → 401. */
export function merchandiseReminderAuthStatus(
  cronSecretEnv: string | undefined | null,
  headerValue: string | null | undefined
): MerchandiseReminderAuthResult {
  const cronSecret = cronSecretEnv?.trim() ?? "";
  if (!cronSecret) return 503;
  if (headerValue !== cronSecret) return 401;
  return "ok";
}

export type MerchandiseCheckoutAuthResult = "ok" | 401 | 403;

/** Caller must be signed in and have center, brand, or platform access to the order. */
export function merchandiseCheckoutAuthStatus(args: {
  hasAuthHeader: boolean;
  hasUser: boolean;
  isAdmin: boolean;
  hasCenterAccess: boolean;
  hasBrandAccess: boolean;
}): MerchandiseCheckoutAuthResult {
  if (!args.hasAuthHeader || !args.hasUser) return 401;
  if (!args.isAdmin && !args.hasCenterAccess && !args.hasBrandAccess) return 403;
  return "ok";
}
