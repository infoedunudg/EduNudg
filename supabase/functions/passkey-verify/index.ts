// EduNudg passkey sign-in and registration (WebAuthn via @simplewebauthn/server).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@13.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RP_NAME = Deno.env.get("PASSKEY_RP_NAME") ?? "EduNudg";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type PasskeyAction =
  | "login-options"
  | "login-verify"
  | "register-options"
  | "register-verify"
  | "list"
  | "delete";

interface RequestBody {
  action?: PasskeyAction;
  origin?: string;
  assertion?: unknown;
  attestation?: unknown;
  deviceName?: string;
  credentialId?: string;
}

interface PasskeyRow {
  user_id: string;
  credential_id: string;
  public_key: string;
  sign_count: number;
  transports: string[] | null;
  device_name: string | null;
  created_at: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return true;
    if (host.endsWith(".edunudg.com")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

function resolveRpId(origin: string): string {
  const host = new URL(origin).hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") {
    return "localhost";
  }
  if (host.endsWith(".edunudg.com")) return "edunudg.com";
  // Vercel preview / production project host — bind RP ID to that host (WebAuthn requirement).
  return host;
}

function byteaToUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value !== "string") {
    throw new Error("Invalid passkey public key");
  }
  if (value.startsWith("\\x")) {
    const hex = value.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToByteaHex(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `\\x${hex}`;
}

async function purgeExpiredChallenges(admin: ReturnType<typeof createClient>): Promise<void> {
  await admin
    .from("passkey_auth_challenges")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

async function storeChallenge(
  admin: ReturnType<typeof createClient>,
  challenge: string,
  kind: "authentication" | "registration",
  userId: string | null
): Promise<void> {
  await purgeExpiredChallenges(admin);
  const { error } = await admin.from("passkey_auth_challenges").insert({
    challenge,
    kind,
    user_id: userId,
    expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
  });
  if (error) throw error;
}

async function consumeChallenge(
  admin: ReturnType<typeof createClient>,
  challenge: string,
  kind: "authentication" | "registration",
  userId: string | null
): Promise<boolean> {
  let query = admin
    .from("passkey_auth_challenges")
    .select("id")
    .eq("challenge", challenge)
    .eq("kind", kind)
    .gt("expires_at", new Date().toISOString());

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data?.id) return false;

  await admin.from("passkey_auth_challenges").delete().eq("id", data.id);
  return true;
}

async function getCaller(
  supabaseUrl: string,
  anonKey: string,
  authHeader: string | null
): Promise<{ id: string; email: string } | null> {
  if (!authHeader) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user?.id || !user.email) return null;
  return { id: user.id, email: user.email };
}

async function issueSessionToken(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw error;
  return data.properties?.hashed_token ?? null;
}

async function logPasskeyEvent(
  admin: ReturnType<typeof createClient>,
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await admin.from("auth_audit_logs").insert({
    user_id: userId,
    event_type: eventType,
    provider: "passkey",
    metadata,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action ?? "login-options";
  const origin = body.origin?.trim() ?? "";
  if (!origin || !isAllowedOrigin(origin)) {
    return jsonResponse({ error: "Valid origin is required" }, 400);
  }

  const rpID = resolveRpId(origin);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authHeader = req.headers.get("Authorization");

  try {
    if (action === "login-options") {
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        timeout: 60_000,
      });
      await storeChallenge(admin, options.challenge, "authentication", null);
      return jsonResponse({ configured: true, options });
    }

    if (action === "login-verify") {
      if (!body.assertion || typeof body.assertion !== "object") {
        return jsonResponse({ error: "assertion is required" }, 400);
      }

      const assertion = body.assertion as { id: string; response: { clientDataJSON: string } };
      const clientData = JSON.parse(atob(assertion.response.clientDataJSON));
      const challengeValid = await consumeChallenge(admin, clientData.challenge, "authentication", null);
      if (!challengeValid) {
        return jsonResponse({ error: "Passkey challenge expired. Try again." }, 400);
      }

      const { data: credRow, error: credError } = await admin
        .from("passkey_credentials")
        .select("user_id, credential_id, public_key, sign_count, transports")
        .eq("credential_id", assertion.id)
        .maybeSingle();
      if (credError) throw credError;
      if (!credRow) {
        return jsonResponse({ error: "No passkey found for this device." }, 400);
      }

      const row = credRow as PasskeyRow;
      const verification = await verifyAuthenticationResponse({
        response: body.assertion as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
        expectedChallenge: clientData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
        credential: {
          id: row.credential_id,
          publicKey: byteaToUint8Array(row.public_key),
          counter: Number(row.sign_count),
          transports: row.transports ?? undefined,
        },
      });

      if (!verification.verified) {
        return jsonResponse({ error: "Passkey verification failed." }, 400);
      }

      await admin
        .from("passkey_credentials")
        .update({ sign_count: verification.authenticationInfo.newCounter, updated_at: new Date().toISOString() })
        .eq("credential_id", row.credential_id);

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("email")
        .eq("id", row.user_id)
        .maybeSingle();
      if (profileError) throw profileError;
      const email = (profile as { email?: string } | null)?.email;
      if (!email) {
        return jsonResponse({ error: "Passkey user profile is missing an email." }, 400);
      }

      const tokenHash = await issueSessionToken(admin, email);
      if (!tokenHash) {
        return jsonResponse({ error: "Failed to create session." }, 500);
      }

      await logPasskeyEvent(admin, row.user_id, "passkey_login", { credential_id: row.credential_id });
      return jsonResponse({ configured: true, tokenHash });
    }

    const caller = await getCaller(supabaseUrl, anonKey, authHeader);
    if (!caller) {
      return jsonResponse({ error: "Sign in required." }, 401);
    }

    if (action === "register-options") {
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID,
        userName: caller.email,
        userDisplayName: caller.email,
        userID: new TextEncoder().encode(caller.id),
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
        timeout: 60_000,
      });
      await storeChallenge(admin, options.challenge, "registration", caller.id);
      return jsonResponse({ configured: true, options });
    }

    if (action === "register-verify") {
      if (!body.attestation || typeof body.attestation !== "object") {
        return jsonResponse({ error: "attestation is required" }, 400);
      }

      const attestation = body.attestation as { response: { clientDataJSON: string } };
      const clientData = JSON.parse(atob(attestation.response.clientDataJSON));
      const challengeValid = await consumeChallenge(admin, clientData.challenge, "registration", caller.id);
      if (!challengeValid) {
        return jsonResponse({ error: "Passkey challenge expired. Try again." }, 400);
      }

      const verification = await verifyRegistrationResponse({
        response: body.attestation as Parameters<typeof verifyRegistrationResponse>[0]["response"],
        expectedChallenge: clientData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return jsonResponse({ error: "Passkey registration failed." }, 400);
      }

      const { credential, credentialDeviceType } = verification.registrationInfo;
      const deviceName =
        body.deviceName?.trim() ||
        (credentialDeviceType === "multiDevice" ? "Synced passkey" : "This device");

      const { error: insertError } = await admin.from("passkey_credentials").insert({
        user_id: caller.id,
        credential_id: credential.id,
        public_key: uint8ArrayToByteaHex(credential.publicKey),
        sign_count: credential.counter,
        transports: credential.transports ?? null,
        device_name: deviceName,
        created_by: caller.id,
        updated_by: caller.id,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          return jsonResponse({ error: "This passkey is already registered." }, 400);
        }
        throw insertError;
      }

      await admin.from("auth_identities").upsert(
        {
          user_id: caller.id,
          provider: "passkey",
          provider_user_id: credential.id,
          last_used_at: new Date().toISOString(),
          created_by: caller.id,
          updated_by: caller.id,
        },
        { onConflict: "provider,provider_user_id" }
      );

      await logPasskeyEvent(admin, caller.id, "passkey_registered", {
        credential_id: credential.id,
        device_name: deviceName,
      });

      return jsonResponse({ configured: true, credentialId: credential.id, deviceName });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("passkey_credentials")
        .select("credential_id, device_name, created_at, transports")
        .eq("user_id", caller.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ configured: true, credentials: data ?? [] });
    }

    if (action === "delete") {
      const credentialId = body.credentialId?.trim();
      if (!credentialId) {
        return jsonResponse({ error: "credentialId is required" }, 400);
      }
      const { error } = await admin
        .from("passkey_credentials")
        .delete()
        .eq("user_id", caller.id)
        .eq("credential_id", credentialId);
      if (error) throw error;
      await logPasskeyEvent(admin, caller.id, "passkey_deleted", { credential_id: credentialId });
      return jsonResponse({ configured: true, ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Passkey request failed";
    return jsonResponse({ error: message }, 400);
  }
});
