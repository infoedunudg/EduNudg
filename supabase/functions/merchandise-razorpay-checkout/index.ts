// Auth contract: apps/web/src/lib/merchandiseEdgeSecurity.ts (merchandiseCheckoutAuthStatus)
// Center (or brand/platform) staff: start Razorpay checkout for a merchandise order.
// Requires caller JWT; never accepts anonymous order_id lookups.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  const authHeader = req.headers.get("Authorization");
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  if (!authHeader) {
    return jsonResponse({ error: "Authorization required" }, 401);
  }

  let orderId = "";
  try {
    const body = (await req.json()) as { order_id?: string };
    orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!orderId) {
    return jsonResponse({ error: "order_id required" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();
  if (callerError || !caller) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // Prefer RLS-scoped read so callers only see orders they can access.
  const { data: order, error: orderErr } = await userClient
    .from("merchandise_orders")
    .select("id, brand_id, center_id, total_cents, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) {
    return jsonResponse({ error: orderErr.message }, 500);
  }
  if (!order) {
    return jsonResponse({ error: "Order not found" }, 404);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc("is_platform_admin");
  if (adminError) {
    return jsonResponse({ error: adminError.message }, 500);
  }

  const { data: hasCenter, error: centerError } = await userClient.rpc("has_center_access", {
    p_center_id: order.center_id,
  });
  if (centerError) {
    return jsonResponse({ error: centerError.message }, 500);
  }

  const { data: hasBrand, error: brandError } = await userClient.rpc("has_brand_access", {
    p_brand_id: order.brand_id,
  });
  if (brandError) {
    return jsonResponse({ error: brandError.message }, 500);
  }

  if (!isAdmin && !hasCenter && !hasBrand) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  if (!razorpayKeyId || !razorpayKeySecret) {
    return jsonResponse(
      { status: "stub", message: "Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" },
      200,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const amount = order.total_cents;
  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: orderId }),
  });

  if (!razorpayRes.ok) {
    const errText = await razorpayRes.text();
    return jsonResponse({ error: errText }, 502);
  }

  const razorpayOrder = (await razorpayRes.json()) as { id?: string };
  if (!razorpayOrder.id) {
    return jsonResponse({ error: "Invalid Razorpay response" }, 502);
  }

  const { error: updateError } = await adminClient
    .from("merchandise_orders")
    .update({ razorpay_order_id: razorpayOrder.id, payment_status: "pending" })
    .eq("id", orderId);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({
    order_id: orderId,
    razorpay_order_id: razorpayOrder.id,
    razorpay_key_id: razorpayKeyId,
    amount_cents: amount,
    currency: "INR",
  });
});
