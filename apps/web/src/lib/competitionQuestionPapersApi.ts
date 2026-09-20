import { getSupabase } from "@/lib/supabase";

export const COMPETITION_PAPERS_BUCKET = "brand-assets";
export const COMPETITION_PAPER_ACCEPT =
  ".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const COMPETITION_PAPER_MAX_BYTES = 10 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const CSV_MIME = "text/csv";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS_MIME = "application/vnd.ms-excel";

export type CompetitionPaper = {
  id: string;
  program_id: string;
  level_id: string;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  is_active: boolean;
  created_at?: string;
};

export type AttachedCompetitionPaper = {
  id: string;
  paper_id: string;
  sort_order: number;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  program_id: string;
  level_id: string;
  is_active: boolean;
};

export type StudentCompetitionPaper = {
  id: string;
  sort_order: number;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "paper";
}

export function resolveCompetitionPaperMime(file: File): string {
  const lower = file.name.toLowerCase();
  if (file.type === PDF_MIME || lower.endsWith(".pdf")) return PDF_MIME;
  if (file.type === CSV_MIME || lower.endsWith(".csv")) return CSV_MIME;
  if (file.type === XLSX_MIME || lower.endsWith(".xlsx")) return XLSX_MIME;
  if (file.type === XLS_MIME || lower.endsWith(".xls")) return XLS_MIME;
  return file.type || "application/octet-stream";
}

export function validateCompetitionPaperFile(file: File): string | null {
  const mime = resolveCompetitionPaperMime(file);
  const allowed = [PDF_MIME, CSV_MIME, XLSX_MIME, XLS_MIME];
  if (!allowed.includes(mime)) {
    return "Only PDF, Excel (.xlsx/.xls), or CSV files are supported.";
  }
  if (file.size > COMPETITION_PAPER_MAX_BYTES) {
    return "File is too large (max 10 MB).";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}

export function isPdfMime(mime: string): boolean {
  return mime === PDF_MIME || mime.toLowerCase().includes("pdf");
}

export function competitionPaperObjectPath(brandId: string, paperId: string, fileName: string): string {
  return `${brandId}/competitions/papers/${paperId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export async function uploadCompetitionPaperFile(
  brandId: string,
  paperId: string,
  file: File
): Promise<{ fileUrl: string; fileName: string; mimeType: string }> {
  const err = validateCompetitionPaperFile(file);
  if (err) throw new Error(err);
  const mimeType = resolveCompetitionPaperMime(file);
  const path = competitionPaperObjectPath(brandId, paperId, file.name);
  const { error: uploadErr } = await getSupabase().storage.from(COMPETITION_PAPERS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: mimeType,
    cacheControl: "3600",
  });
  if (uploadErr) throw uploadErr;
  const { data } = getSupabase().storage.from(COMPETITION_PAPERS_BUCKET).getPublicUrl(path);
  return { fileUrl: data.publicUrl, fileName: file.name, mimeType };
}

export async function listCompetitionQuestionPapers(
  brandId: string,
  programId?: string,
  levelId?: string
): Promise<CompetitionPaper[]> {
  const { data, error } = await getSupabase().rpc("list_competition_question_papers", {
    p_brand_id: brandId,
    p_program_id: programId ?? null,
    p_level_id: levelId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as CompetitionPaper[];
}

export async function upsertCompetitionQuestionPaper(
  brandId: string,
  input: {
    id?: string;
    programId: string;
    levelId: string;
    title: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    isActive?: boolean;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_competition_question_paper", {
    p_brand_id: brandId,
    p_program_id: input.programId,
    p_level_id: input.levelId,
    p_title: input.title,
    p_file_name: input.fileName,
    p_file_url: input.fileUrl,
    p_mime_type: input.mimeType,
    p_id: input.id ?? null,
    p_is_active: input.isActive ?? true,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteCompetitionQuestionPaper(brandId: string, id: string): Promise<void> {
  const { error } = await getSupabase().rpc("delete_competition_question_paper", {
    p_brand_id: brandId,
    p_id: id,
  });
  if (error) throw error;
}

export async function listBrandCompetitionPapers(
  brandId: string,
  competitionId: string
): Promise<AttachedCompetitionPaper[]> {
  const { data, error } = await getSupabase().rpc("list_brand_competition_papers", {
    p_brand_id: brandId,
    p_competition_id: competitionId,
  });
  if (error) throw error;
  return (data ?? []) as AttachedCompetitionPaper[];
}

export async function setBrandCompetitionPapers(
  brandId: string,
  competitionId: string,
  paperIds: string[]
): Promise<void> {
  const { error } = await getSupabase().rpc("set_brand_competition_papers", {
    p_brand_id: brandId,
    p_competition_id: competitionId,
    p_paper_ids: paperIds,
  });
  if (error) throw error;
}

export async function fetchStudentCompetitionPapers(
  competitionId: string
): Promise<StudentCompetitionPaper[]> {
  const { data, error } = await getSupabase().rpc("get_student_competition_papers", {
    p_competition_id: competitionId,
  });
  if (error) throw error;
  return (data ?? []) as StudentCompetitionPaper[];
}

/** Create a draft UUID, upload file, then insert paper row. */
export async function createCompetitionQuestionPaperFromFile(
  brandId: string,
  input: { programId: string; levelId: string; title: string; file: File; isActive?: boolean }
): Promise<string> {
  const draftId = crypto.randomUUID();
  const uploaded = await uploadCompetitionPaperFile(brandId, draftId, input.file);
  return upsertCompetitionQuestionPaper(brandId, {
    id: draftId,
    programId: input.programId,
    levelId: input.levelId,
    title: input.title.trim() || input.file.name,
    fileName: uploaded.fileName,
    fileUrl: uploaded.fileUrl,
    mimeType: uploaded.mimeType,
    isActive: input.isActive ?? true,
  });
}
