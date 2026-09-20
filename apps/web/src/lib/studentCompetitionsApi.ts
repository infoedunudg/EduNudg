import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError } from "@/lib/studentLearnErrors";
import { StudentLearnRpcError, type StudentCompetitionCard } from "@/lib/studentLearnApi";

export type CompetitionFilter = "upcoming" | "registered" | "past";

export type RegisteredCompetition = {
  registration_id: string;
  competition_id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  status: string;
  fee_type: string;
  fee_amount: number | null;
  question_count?: number;
  quiz_status?: string;
  can_take?: boolean;
  score?: number | null;
  max_score?: number | null;
  paper_count?: number;
  has_papers?: boolean;
  can_view_papers?: boolean;
};

export type PastCompetitionResult = {
  competition_id: string;
  name: string;
  event_date: string | null;
  result_rank: string | null;
  rank_position: number | null;
  score: number | null;
};

export async function fetchStudentCompetitions(
  brandId: string,
  filter: CompetitionFilter
): Promise<StudentCompetitionCard[] | RegisteredCompetition[] | PastCompetitionResult[]> {
  const { data, error } = await getSupabase().rpc("get_student_competitions", {
    p_brand_id: brandId,
    p_filter: filter,
  });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
  return (data ?? []) as StudentCompetitionCard[] | RegisteredCompetition[] | PastCompetitionResult[];
}

export async function registerForCompetition(competitionId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("register_student_for_competition", {
    p_competition_id: competitionId,
  });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
  return data as string;
}

export async function withdrawCompetitionRegistration(registrationId: string): Promise<void> {
  const { error } = await getSupabase().rpc("withdraw_competition_registration", {
    p_registration_id: registrationId,
  });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
}
