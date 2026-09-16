---
name: edunudg-auth-provider
description: Implement or change auth — Google, Facebook, WhatsApp OTP, passkeys, email.
---

# Auth Provider

## Providers

- Google / Facebook: Supabase `signInWithOAuth`
- WhatsApp: Edge Function `whatsapp-otp` + phone OTP
- Passkey: `@simplewebauthn/browser` + Edge Function `passkey-verify`
- Email: Supabase email/password for staff

## Tables

- `auth_identities`, `passkey_credentials`, `auth_audit_logs`

## Rules

- Log events to `auth_audit_logs` via `reportAuthAudit` / RPC `log_auth_audit_event` (`login_success` session-deduped, `logout`, `login_failure`, `access_denied`). Never block login if audit fails.
- After sign-in, `fetchActiveMemberships` calls `accept_own_invited_memberships` then loads `status = active`. `/login` must wait for `isFetched` (not only `isLoading`) before access-denied sign-out — otherwise a new franchise owner logs in and is signed out immediately.
- Sensitive staff actions (CSV export, Copy Profile URL, owner credentials, portal handoff) use `reportAccessAudit` / `log_access_audit_event`. Fatal SPA errors use `reportClientError` / `log_client_error_event` (do not ingest every `console.error`).
- Franchise CSV/Excel import rows with `owner_email` provision through `center-owner-credentials` using lowercase one-word brand name + `@123`; completion displays the initial password. Never create Auth users or expose service-role credentials in the browser.
- Deploy `auth-audit` so platform ops get IP + country; SPA falls back to RPC without IP.
- Brand owner/admin and center owner/manager read tenant Auth+Access via `list_tenant_staff_audit`. Errors stay platform-only.
- Rate-limit OTP via `auth_rate_limits`
- Never expose service role in client

See `docs/architecture/auth-providers.md`.
