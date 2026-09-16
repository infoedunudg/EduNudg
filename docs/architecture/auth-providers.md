# Auth Providers

## Google / Facebook

Supabase `signInWithOAuth({ provider: 'google' | 'facebook' })`. Link row in `auth_identities`.

## WhatsApp OTP

1. User enters `phone_e164`
2. Edge Function `whatsapp-otp` sends OTP (Twilio Verify WhatsApp / Gupshup)
3. User verifies → Supabase session
4. Rate limit via `auth_rate_limits`

## Passkeys (WebAuthn)

1. **Register** (while signed in): Settings → **Passkeys** → **Add passkey on this device** — works on desktop (Touch ID / Windows Hello) and mobile (Face ID / fingerprint) over HTTPS.
2. Store credential in `passkey_credentials` via Edge Function `passkey-verify` (`register-options` / `register-verify`).
3. **Login**: `/login` **Log in with passkey** → `passkeyService` → `passkey-verify` (`login-options` / `login-verify`) → `verifyOtp` session.
4. Deploy after schema push:

```bash
pnpm dlx supabase@2.104.0 db push
pnpm dlx supabase@2.104.0 functions deploy passkey-verify
```

RP ID: `localhost` for `*.localhost` dev hosts; production hostname (e.g. `edunudg-hub.vercel.app`) for Vercel. Add production origin to Supabase Auth redirect URLs.

## Email

Staff fallback: `signInWithPassword` / magic link invites.

Franchise CSV/Excel import provisions `owner_email` through the authenticated `center-owner-credentials` Edge Function. Its initial password is the lowercase brand name collapsed to one alphanumeric word plus `@123` (for example, `Smart Brain Abacus` → `smartbrainabacus@123`). The import completion dialog displays this value. This is a predictable, brand-shared initial credential; operators must share it out-of-band and replace it per franchise after first login. Rows without an owner email are imported without a backend Auth account.

Post-login redirect honors `?next=` on `/login` (used after platform-admin handoff).

OAuth staff sign-in (`signInWithOAuth`) redirects to `{origin}/login` so membership checks run before `/admin` or `/app`. Legacy returns to `/` with `#access_token` are forwarded to `/login` by `OAuthReturnRedirect`.

Staff membership fetch calls `accept_own_invited_memberships` then loads `active` rows. `/login` must wait until that query is fetched — empty memberships before fetch used to look like access-denied and sign the user out immediately (new franchise owners from inquiry/CSV start as `invited`).

## Platform admin cross-portal handoff

Platform admins open brand/center/learn/parents hosts without a separate password:

1. Edge Function `platform-portal-handoff` returns `{origin}/auth/handoff?token_hash=…&next=…`
2. `AuthHandoffPage` calls `verifyOtp` on the **target host** (session is per-origin)
3. Platform `memberships` row grants access on brand/center staff routes

Does not use Supabase `action_link` redirects to subdomains. Details: [platform-admin-portal-handoff.md](../ops/platform-admin-portal-handoff.md).

All events → `auth_audit_logs` via RPC `log_auth_audit_event` (`login_success` once per session, `logout`, `login_failure`, `access_denied`). Platform `/admin/audit` **Auth** stream; brand/center `/app/audit` uses `list_tenant_staff_audit` (no raw IP, failed-login emails redacted). Sensitive staff actions → `access_audit_logs` via `log_access_audit_event`. Fatal SPA errors → `client_error_reports` (platform **Errors** stream only). Optional Edge Function `auth-audit` stamps IP (platform ops), `ip_hash`, and `ip_country`. Until that function is deployed, `/admin/audit` shows **Not captured** for IP (RPC fallback has no client address). **Copy JSON** copies the selected row; it replaced a no-op Full Audit Trail button.

```bash
pnpm dlx supabase@2.104.0 functions deploy auth-audit
```

OAuth redirect URLs (local dev): set in **Supabase Dashboard → Authentication → URL configuration** — Site URL `http://localhost:9000` (not `3000`), redirects `http://localhost:9000/**`.
