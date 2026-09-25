// Platform admin: magic-link handoff to brand/center/learn/parents portals (cross-host session)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  redirectTo?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return true;
    if (host.endsWith(".edunudg.com")) return true;
    if (host.endsWith(".vercel.app")) return true;
    // Custom franchise/brand domains are allowlisted via domain_mappings (checked async below).
    return false;
  } catch {
    return false;
  }
}

async function isAllowedRedirectAsync(
  url: string,
  admin: ReturnType<typeof createClient>
): Promise<boolean> {
  if (isAllowedRedirect(url)) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const { data, error } = await admin
      .from("domain_mappings")
      .select("hostname")
      .eq("hostname", host)
      .maybeSingle();
    if (error) return false;
    return Boolean(data?.hostname);
  } catch {
    return false;
  }
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
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  if (!authHeader) {
    return jsonResponse({ error: "Authorization required" }, 401);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const redirectTo = body.redirectTo?.trim();
  if (!redirectTo) {
    return jsonResponse({ error: "Valid redirectTo URL is required" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();
  if (callerError || !caller?.email) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc("is_platform_admin");
  if (adminError) {
    return jsonResponse({ error: adminError.message }, 500);
  }
  if (!isAdmin) {
    return jsonResponse({ error: "Platform admin required" }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!(await isAllowedRedirectAsync(redirectTo, adminClient))) {
    return jsonResponse({ error: "Valid redirectTo URL is required" }, 400);
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: caller.email,
  });

  if (linkError) {
    return jsonResponse({ error: linkError.message }, 400);
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    return jsonResponse({ error: "Failed to generate portal handoff token" }, 500);
  }

  let handoffUrl: string;
  try {
    const parsed = new URL(redirectTo);
    const next = parsed.searchParams.get("next") ?? "/";
    const target = new URL("/auth/handoff", parsed.origin);
    target.searchParams.set("token_hash", tokenHash);
    target.searchParams.set("next", next);
    // Preserve same-origin portal overrides (Vercel *.vercel.app without custom domains).
    for (const key of ["portal", "brand", "center"] as const) {
      const value = parsed.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    }
    handoffUrl = target.toString();
  } catch {
    return jsonResponse({ error: "Invalid redirectTo URL" }, 400);
  }

  return jsonResponse({ url: handoffUrl });
});
