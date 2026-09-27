import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MutationError } from "@edunudg/ui";
import { uploadBrandSiteLogo } from "@/lib/brandLandingEditorApi";
import { invalidateBrandLogoCaches } from "@/lib/brandLogoCache";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

type BrandLogoUploadProps = {
  brandId: string | null;
  currentLogoUrl?: string | null;
  brandDisplayName?: string | null;
  onUploaded?: (publicUrl: string) => void;
  disabled?: boolean;
  editable?: boolean;
  variant?: "default" | "settings";
};

const ICON_BUILDING = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M4 21V8l8-4 8 4v13" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const ICON_UPLOAD = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3v12" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 21h14" />
  </svg>
);

export function BrandLogoUpload({
  brandId,
  currentLogoUrl,
  brandDisplayName,
  onUploaded,
  disabled,
  editable = false,
  variant = "default",
}: BrandLogoUploadProps) {
  const qc = useQueryClient();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl?.trim() || null);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentLogoUrl?.trim() || null);
  }, [currentLogoUrl]);

  const handleChange = async (file: File | undefined) => {
    if (!file || !brandId) return;
    setLocalError(null);
    setPending(true);
    try {
      const url = await uploadBrandSiteLogo(brandId, file);
      setPreview(url);
      invalidateBrandLogoCaches(qc, brandId);
      onUploaded?.(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setPending(false);
    }
  };

  if (variant === "settings") {
    const currentLabel = brandDisplayName?.trim() || "your brand";
    return (
      <div className="ed-brand-settings-logo">
        <input
          ref={inputRef}
          id={inputId}
          name="brand-logo"
          type="file"
          accept={ACCEPT}
          disabled={disabled || !brandId || pending}
          className="sr-only"
          onChange={(e) => void handleChange(e.target.files?.[0])}
        />
        <div className="ed-brand-settings-logo-drop">
          {preview ? (
            <img src={preview} alt="" className="ed-brand-settings-logo-drop__preview" />
          ) : (
            <div className="ed-brand-settings-logo-drop__placeholder" aria-hidden>
              {ICON_BUILDING}
            </div>
          )}
          <button
            type="button"
            className="ed-brand-settings-logo-btn"
            disabled={disabled || !brandId || pending}
            onClick={() => inputRef.current?.click()}
          >
            {ICON_UPLOAD}
            {pending ? "Uploading…" : "Choose file"}
          </button>
        </div>
        <p className="ed-brand-settings-logo-meta">Current: {currentLabel}</p>
        <p className="ed-brand-settings-logo-tip">
          <span aria-hidden>ℹ</span>
          Recommended: SVG or 512×512 PNG
        </p>
        {!brandId ? <p className="ed-text-sm ed-muted">Create the brand first, then upload a logo.</p> : null}
        <MutationError message={localError} />
      </div>
    );
  }

  return (
    <div className={`ed-field ed-brand-logo-upload${editable ? " ed-field--editable" : ""}`}>
      <label className="ed-field__label" htmlFor={inputId}>
        Site logo
      </label>
      <div className="ed-brand-logo-upload__row">
        {preview ? <img src={preview} alt="" className="ed-brand-logo-preview" width={40} height={40} /> : null}
        <input
          id={inputId}
          name="brand-logo"
          className="ed-field__input"
          type="file"
          accept={ACCEPT}
          disabled={disabled || !brandId || pending}
          onChange={(e) => void handleChange(e.target.files?.[0])}
        />
      </div>
      <p className="ed-text-sm ed-muted ed-editor-field-hint">
        Same as Homepage Site logo on the brand portal.
      </p>
      {!brandId ? (
        <p className="ed-text-sm ed-muted">Create the brand first, then upload a logo.</p>
      ) : null}
      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      <MutationError message={localError} />
    </div>
  );
}
