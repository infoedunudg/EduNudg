import { useEffect, useId, useState } from "react";
import { uploadStudentPhoto } from "@/lib/studentPhotoStorage";
import { useSignedStorageUrl } from "@/hooks/useSignedStorageUrl";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

type Props = {
  brandId: string;
  studentId: string;
  currentPhotoUrl?: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  /** Large avatar for profile hero row. */
  hero?: boolean;
};

export function StudentPhotoUpload({
  brandId,
  studentId,
  currentPhotoUrl,
  onUploaded,
  disabled,
  required,
  compact,
  hero,
}: Props) {
  const inputId = useId();
  const signedCurrent = useSignedStorageUrl(currentPhotoUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalPreview(null);
  }, [currentPhotoUrl]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preview = localPreview || signedCurrent || "";

  const handleChange = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setPending(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      setLocalPreview(blobUrl);
      const ref = await uploadStudentPhoto(brandId, studentId, file);
      onUploaded(ref);
    } catch (err) {
      setLocalPreview(null);
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPending(false);
    }
  };

  if (hero) {
    return (
      <div className="ed-sp-photo-hero">
        <label className="ed-sp-photo-hero__control" htmlFor={inputId}>
          <span className="ed-sp-photo-hero__ring">
            {preview ? (
              <img src={preview} alt="" className="ed-sp-photo-preview ed-sp-photo-preview--hero" width={88} height={88} />
            ) : (
              <span className="ed-sp-photo-preview ed-sp-photo-preview--empty ed-sp-photo-preview--hero" aria-hidden>
                {pending ? "…" : "Add"}
              </span>
            )}
          </span>
          <span className="ed-sp-photo-hero__action">{pending ? "Uploading…" : "Update photo"}</span>
          <input
            id={inputId}
            name="student-photo"
            className="ed-sp-photo-upload__input"
            type="file"
            accept={ACCEPT}
            disabled={disabled || pending}
            onChange={(e) => void handleChange(e.target.files?.[0])}
          />
        </label>
        {required && !preview ? (
          <span className="ed-sp-photo-hero__required" aria-hidden>
            Required
          </span>
        ) : null}
        {localError ? (
          <p className="ed-sp-photo-hero__error" role="alert">
            {localError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`ed-field ed-sp-photo-upload${compact ? " ed-sp-photo-upload--compact" : ""}`}>
      <label className="ed-field__label" htmlFor={inputId}>
        Photo{required ? " *" : ""}
      </label>
      {!compact ? (
        <p className="ed-text-sm ed-muted">Upload from your device. A new photo replaces the previous one.</p>
      ) : null}
      <div className="ed-sp-photo-upload__row">
        {preview ? (
          <img src={preview} alt="" className="ed-sp-photo-preview" width={72} height={72} />
        ) : (
          <div className="ed-sp-photo-preview ed-sp-photo-preview--empty" aria-hidden>
            {compact ? "Add" : "No photo"}
          </div>
        )}
        <label className="ed-sp-photo-upload__pick">
          <span className="ed-sp-photo-upload__pick-label">{pending ? "Uploading…" : "Choose photo"}</span>
          <input
            id={inputId}
            name="student-photo"
            className="ed-sp-photo-upload__input"
            type="file"
            accept={ACCEPT}
            disabled={disabled || pending}
            onChange={(e) => void handleChange(e.target.files?.[0])}
          />
        </label>
      </div>
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
