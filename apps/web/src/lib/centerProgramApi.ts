import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type CenterProgramAuth = {
  centerId: string;
  programId: string;
  programName: string;
  authorizedAt: string;
};

export type BrandProgramWithLevels = {
  id: string;
  name: string;
  levels: { id: string; name: string; sortOrder: number }[];
};

export async function fetchBrandPrograms(brandId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getSupabase()
    .from("programs")
    .select("id, name")
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .order("name");
  return supabaseList(data, error);
}

export async function fetchBrandProgramsWithLevels(brandId: string): Promise<BrandProgramWithLevels[]> {
  const { data, error } = await getSupabase()
    .from("programs")
    .select("id, name, levels(id, name, sort_order)")
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .order("name");
  const rows = supabaseList(data, error) as {
    id: string;
    name: string;
    levels:
      | { id: string; name: string; sort_order: number }[]
      | { id: string; name: string; sort_order: number }
      | null;
  }[];
  return rows.map((row) => {
    const levels = Array.isArray(row.levels) ? row.levels : row.levels ? [row.levels] : [];
    return {
      id: row.id,
      name: row.name,
      levels: levels
        .map((level) => ({ id: level.id, name: level.name, sortOrder: level.sort_order }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    };
  });
}

export async function fetchCenterProgramNamesByCenterIds(
  centerIds: string[]
): Promise<Map<string, string[]>> {
  const assigned = new Map<string, string[]>();
  if (centerIds.length === 0) return assigned;

  const { data, error } = await getSupabase()
    .from("center_program_enablement")
    .select("center_id, programs(name)")
    .in("center_id", centerIds);
  const rows = supabaseList(data, error) as {
    center_id: string;
    programs: { name: string } | { name: string }[] | null;
  }[];

  for (const row of rows) {
    const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
    const name = program?.name?.trim();
    if (!name) continue;
    const current = assigned.get(row.center_id) ?? [];
    if (!current.includes(name)) current.push(name);
    assigned.set(row.center_id, current);
  }

  return assigned;
}

export async function fetchCenterAuthorizedPrograms(centerId: string): Promise<CenterProgramAuth[]> {
  const { data, error } = await getSupabase()
    .from("center_program_enablement")
    .select("center_id, program_id, authorized_at, programs(name)")
    .eq("center_id", centerId);
  const rows = supabaseList(data, error) as {
    center_id: string;
    program_id: string;
    authorized_at: string;
    programs: { name: string } | { name: string }[] | null;
  }[];
  return rows.map((r) => {
    const program = Array.isArray(r.programs) ? r.programs[0] : r.programs;
    return {
      centerId: r.center_id,
      programId: r.program_id,
      programName: program?.name ?? "Program",
      authorizedAt: r.authorized_at,
    };
  });
}

export async function syncCenterProgramEnablement(centerId: string, programIds: string[]): Promise<void> {
  const { error } = await getSupabase().rpc("sync_center_program_enablement", {
    p_center_id: centerId,
    p_program_ids: programIds,
  });
  if (error) throw error;
}
