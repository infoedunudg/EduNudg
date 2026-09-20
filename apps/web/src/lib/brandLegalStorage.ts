import { getSupabase } from "@/lib/supabase";
import type { BrandLegalPageDocument, BrandLegalPageKind } from "@/lib/brandLegalPages";

export const BRAND_ASSETS_BUCKET = "brand-assets";

export const BRAND_LEGAL_DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const BRAND_LEGAL_PDF_MIME = "application/pdf";
export const BRAND_LEGAL_HTML_MIME = "text/html";

function resolveUploadContentType(file: File): string {
  const lower = file.name.toLowerCase();
  if (file.type === BRAND_LEGAL_DOCX_MIME || lower.endsWith(".docx")) return BRAND_LEGAL_DOCX_MIME;
  if (file.type === BRAND_LEGAL_PDF_MIME || lower.endsWith(".pdf")) return BRAND_LEGAL_PDF_MIME;
  return file.type || "application/octet-stream";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

export function brandLegalObjectPath(brandId: string, kind: BrandLegalPageKind, fileName: string): string {
  return `${brandId}/legal/${kind}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function brandLegalHtmlObjectPath(brandId: string, kind: BrandLegalPageKind): string {
  return `${brandId}/legal/${kind}/${Date.now()}-${kind}.html`;
}

async function uploadObject(path: string, body: Blob | File, contentType: string): Promise<string> {
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, body, {
      upsert: false,
      contentType,
      cacheControl: "3600",
    });
  if (uploadErr) throw uploadErr;

  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function convertDocxToHtml(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const { sanitizeLegalHtml } = await import("@/lib/sanitizeLegalHtml");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return sanitizeLegalHtml(result.value);
}

export async function uploadBrandLegalPage(
  brandId: string,
  kind: BrandLegalPageKind,
  file: File
): Promise<BrandLegalPageDocument> {
  const path = brandLegalObjectPath(brandId, kind, file.name);
  const contentType = resolveUploadContentType(file);
  const fileUrl = await uploadObject(path, file, contentType);

  let htmlUrl: string | undefined;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".docx")) {
    const html = await convertDocxToHtml(file);
    const htmlPath = brandLegalHtmlObjectPath(brandId, kind);
    const blob = new Blob([html], { type: `${BRAND_LEGAL_HTML_MIME};charset=utf-8` });
    htmlUrl = await uploadObject(htmlPath, blob, BRAND_LEGAL_HTML_MIME);
  }

  return {
    fileName: file.name,
    fileUrl,
    mimeType: contentType,
    htmlUrl,
    uploadedAt: new Date().toISOString(),
  };
}

/** @deprecated Use uploadBrandLegalPage — clean-slate legal slots only. */
export type LegalDocument = {
  name: string;
  url: string;
  uploaded_at: string;
};

/** @deprecated */
export async function uploadBrandLegalDocument(brandId: string, file: File): Promise<LegalDocument> {
  const path = `${brandId}/legal/${Date.now()}-${sanitizeFileName(file.name)}`;
  const fileUrl = await uploadObject(path, file, file.type || "application/octet-stream");
  return {
    name: file.name,
    url: fileUrl,
    uploaded_at: new Date().toISOString(),
  };
}
