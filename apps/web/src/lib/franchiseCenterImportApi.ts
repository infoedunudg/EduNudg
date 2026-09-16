import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import type { FranchiseCenterImportRpcRow } from "@/lib/franchiseCenterImportHelpers";

export type FranchiseCenterImportResult = {
  created: Array<{ row: number; center_id: string; slug: string }>;
  errors: Array<{ row: number; message: string }>;
};

export async function fetchFranchiseImportBrandName(brandId: string): Promise<string> {
  const { data, error } = await getSupabase()
    .from("brands")
    .select("name")
    .eq("id", brandId)
    .is("deleted_at", null)
    .maybeSingle();
  const row = supabaseMaybe(data, error) as { name: string } | null;
  if (!row?.name?.trim()) throw new Error("Brand name not found");
  return row.name.trim();
}

export async function importFranchiseCenters(
  brandId: string,
  rows: FranchiseCenterImportRpcRow[]
): Promise<{ result: FranchiseCenterImportResult | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("import_franchise_centers", {
    p_brand_id: brandId,
    p_rows: rows,
  });

  if (error) return { result: null, error: error.message };

  const payload = data as FranchiseCenterImportResult | null;
  return {
    result: {
      created: payload?.created ?? [],
      errors: payload?.errors ?? [],
    },
    error: null,
  };
}
