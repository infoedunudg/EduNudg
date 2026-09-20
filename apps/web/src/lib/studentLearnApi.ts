import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError, type StudentLearnErrorCode } from "@/lib/studentLearnErrors";

export type StudentLearnHome = {
  student: {
    id: string;
    full_name: string;
    student_code: string | null;
    date_of_birth: string | null;
    profile: {
      school_name: string | null;
      city: string | null;
      pincode: string | null;
      address_line1: string | null;
      state: string | null;
      phone: string | null;
      photo_url: string | null;
    };
  };
  brand: { id: string; name: string; logo_url: string | null };
  enrollment: {
    enrollment_id: string;
    status: string;
    enrolled_at: string;
    center_id: string;
    batch_name: string | null;
    program_id: string | null;
    program_name: string | null;
  };
  center: {
    id: string;
    display_name: string;
    short_description: string | null;
    city: string | null;
    contact_phone: string | null;
    public_url: string;
  };
  curriculum_ladder: {
    current_level_id: string | null;
    completion_pct: number;
    levels: {
      level_id: string;
      name: string;
      sort_order: number;
      status: string;
      completed_at: string | null;
      abacus_level_code: string | null;
    }[];
  };
  stats: {
    levels_completed: number;
    levels_total: number;
    assessments_count: number;
    avg_score_pct: number | null;
    competitions_registered: number;
    competitions_completed: number;
  };
  upcoming_competitions: StudentCompetitionCard[];
  my_registrations: {
    registration_id: string;
    competition_id: string;
    name: string;
    event_date: string | null;
    status: string;
    fee_type: string;
  }[];
  recent_results: {
    competition_name: string;
    event_date: string | null;
    result_rank: string | null;
    rank_position: number | null;
    score: number | null;
  }[];
  recent_assessments: {
    id: string;
    assessment_type: string;
    score: number | null;
    max_score: number | null;
    assessed_at: string;
    level_name: string | null;
  }[];
  recent_activity: {
    type: string;
    title: string;
    subtitle: string;
    occurred_at: string;
    href: string;
  }[];
  quick_actions: { label: string; href: string }[];
};

export type StudentCompetitionCard = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  fee_type: "free" | "paid";
  fee_amount: number | null;
  fee_currency: string | null;
  registration_status: string;
  my_registration_status: string;
  can_enroll: boolean;
  enroll_blocked_reason: string | null;
  question_count?: number;
  quiz_status?: string;
  can_take?: boolean;
  paper_count?: number;
  has_papers?: boolean;
  can_view_papers?: boolean;
};

export type StudentProfilePayload = {
  student: StudentLearnHome["student"];
  enrollment: StudentLearnHome["enrollment"];
  center: StudentLearnHome["center"];
  brand: StudentLearnHome["brand"];
  enrollment_history: {
    enrollment_id: string;
    status: string;
    enrolled_at: string;
    center_name: string;
  }[];
};

export class StudentLearnRpcError extends Error {
  code: StudentLearnErrorCode;

  constructor(code: StudentLearnErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "StudentLearnRpcError";
  }
}

function throwIfLearnError(error: { message?: string } | null): void {
  if (!error) return;
  const code = parseStudentLearnError(error);
  if (code) throw new StudentLearnRpcError(code, error.message);
  throw error;
}

export async function fetchStudentLearnHome(brandId: string): Promise<StudentLearnHome> {
  const { data, error } = await getSupabase().rpc("get_student_learn_home", { p_brand_id: brandId });
  throwIfLearnError(error);
  return data as StudentLearnHome;
}

export async function fetchStudentProfile(brandId: string): Promise<StudentProfilePayload> {
  const { data, error } = await getSupabase().rpc("get_student_profile", { p_brand_id: brandId });
  throwIfLearnError(error);
  return data as StudentProfilePayload;
}

export type UpdateStudentSelfProfileInput = {
  fullName: string;
  dateOfBirth: string;
  pincode: string;
  phone: string;
  photoUrl: string;
  schoolName?: string | null;
  city?: string | null;
  addressLine1?: string | null;
  state?: string | null;
};

export async function updateStudentSelfProfile(
  brandId: string,
  input: UpdateStudentSelfProfileInput
): Promise<StudentProfilePayload["student"]> {
  const { data, error } = await getSupabase().rpc("update_student_self_profile", {
    p_brand_id: brandId,
    p_full_name: input.fullName.trim(),
    p_date_of_birth: input.dateOfBirth,
    p_phone: input.phone.trim(),
    p_pincode: input.pincode.trim(),
    p_photo_url: input.photoUrl.trim(),
    p_school_name: input.schoolName?.trim() || null,
    p_city: input.city?.trim() || null,
    p_address_line1: input.addressLine1?.trim() || null,
    p_state: input.state?.trim() || null,
  });
  throwIfLearnError(error);
  return data as StudentProfilePayload["student"];
}
