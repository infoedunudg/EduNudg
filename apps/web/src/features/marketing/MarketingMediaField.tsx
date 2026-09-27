import { useId, useRef, useState } from "react";
import { Button, MutationError } from "@edunudg/ui";
import {
  uploadMarketingMedia,
  type MarketingUploadScope,
} from "@/lib/marketingMediaStorage";
import { isVideoMediaUrl } from "@/lib/mediaUrl";

function fieldNameFromLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "field";
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").pop();
    return name && name.length > 0 ? decodeURIComponent(name) : url;
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
}

/** Images and videos accepted in marketing media pickers. */
export const MARKETING_MEDIA_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,video/quicktime";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  mediaType: "image" | "video";
  uploadSubdir: string;
  uploadScope: MarketingUploadScope;
  disabled?: boolean;
  layout?: "default" | "logo" | "hero";
  recommendedSize?: string;
  /** Called after a successful upload with the new public URL (e.g. auto-save config). */
  onUploaded?: (url: string) => void | Promise<void>;
  /** Bubble upload failures (e.g. when this field is visually hidden behind a dropzone). */
  onError?: (message: string | null) => void;
  onPendingChange?: (pending: boolean) => void;
  /** First photo in a homepage / center-site section. */
  required?: boolean;
  /** When false, skip in-field MutationError (parent shows it). Default true. */
  showInlineError?: boolean;
};

function MediaFieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
}) {
  const mark = required ? (
    <span className="ed-field__required" aria-hidden>
      {" "}
      *
    </span>
  ) : null;
  if (htmlFor) {
    return (
      <label className="ed-field__label" htmlFor={htmlFor}>
        {label}
        {mark}
      </label>
    );
  }
  return (
    <span className="ed-field__label">
      {label}
      {mark}
    </span>
  );
}

export function MarketingMediaField({
  label,
  value,
  onChange,
  mediaType,
  uploadSubdir,
  uploadScope,
  disabled,
  layout = "default",
  recommendedSize,
  onUploaded,
  onError,
  onPendingChange,
  required = false,
  showInlineError = true,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showVideoPreview = mediaType === "video" || isVideoMediaUrl(value);

  const reportError = (message: string | null) => {
    setError(message);
    onError?.(message);
  };

  const setUploadPending = (next: boolean) => {
    setPending(next);
    onPendingChange?.(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    reportError(null);
    setUploadPending(true);
    try {
      const url = await uploadMarketingMedia(uploadScope, uploadSubdir, file);
      onChange(url);
      await onUploaded?.(url);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      reportError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPending(false);
    }
  };

  const inlineError = showInlineError ? <MutationError message={error} /> : null;

  const fileInput = (
    <input
      ref={inputRef}
      id={inputId}
      name={fieldNameFromLabel(label)}
      className="ed-field__input ed-marketing-media-input--hidden"
      type="file"
      accept={MARKETING_MEDIA_ACCEPT}
      disabled={disabled || pending}
      required={required && !value.trim()}
      onChange={(e) => void handleFile(e.target.files?.[0])}
    />
  );
  const requiredHint =
    required && !value.trim() ? (
      <p className="ed-text-sm ed-field__required-hint" role="status">
        This photo is required.
      </p>
    ) : null;

  if (layout === "logo") {
    return (
      <div className="ed-field ed-marketing-media-field ed-marketing-media-field--logo">
        <MediaFieldLabel label={label} required={required} />
        <div className="ed-marketing-media-logo">
          <div className="ed-marketing-media-logo__preview">
            {value ? (
              <img key={value} src={value} alt="" className="ed-marketing-media-logo__image" />
            ) : (
              <span className="ed-marketing-media-logo__placeholder material-symbols-outlined" aria-hidden>
                image
              </span>
            )}
          </div>
          <div className="ed-marketing-media-logo__actions">
            {fileInput}
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || pending}>
              <span className="material-symbols-outlined" aria-hidden>
                image
              </span>
              Change logo
            </Button>
            {value ? (
              <Button variant="danger" onClick={() => onChange("")} disabled={disabled || pending}>
                <span className="material-symbols-outlined" aria-hidden>
                  delete
                </span>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
        {requiredHint}
        {inlineError}
      </div>
    );
  }

  if (layout === "hero") {
    return (
      <div className="ed-field ed-marketing-media-field ed-marketing-media-field--hero">
        <MediaFieldLabel htmlFor={inputId} label={label} required={required} />
        {value && !showVideoPreview ? (
          <img key={value} src={value} alt="" className="ed-marketing-media-hero__preview" />
        ) : null}
        {value && showVideoPreview ? (
          <video
            key={value}
            src={value}
            className="ed-marketing-media-hero__preview"
            controls
            muted
            playsInline
          />
        ) : null}
        <div className="ed-marketing-media-hero__footer">
          {fileInput}
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || pending}>
            <span className="material-symbols-outlined" aria-hidden>
              upload
            </span>
            {value ? "Replace file" : "Upload file"}
          </Button>
          {value ? (
            <>
              <p className="ed-marketing-media-hero__filename">
                <span className="material-symbols-outlined" aria-hidden>
                  image
                </span>
                {fileNameFromUrl(value)}
              </p>
              {recommendedSize ? (
                <p className="ed-text-sm ed-muted">Recommended size: {recommendedSize}</p>
              ) : null}
              <button type="button" className="ed-link-button ed-text-sm" onClick={() => onChange("")}>
                Remove file
              </button>
            </>
          ) : (
            <p className="ed-text-sm ed-muted">No file selected yet. Upload PNG, JPEG, or MP4.</p>
          )}
        </div>
        {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
        {requiredHint}
        {inlineError}
      </div>
    );
  }

  return (
    <div className="ed-field ed-marketing-media-field">
      <MediaFieldLabel htmlFor={inputId} label={label} required={required} />
      {value && !showVideoPreview ? (
        <img key={value} src={value} alt="" className="ed-marketing-media-preview" />
      ) : null}
      {value && showVideoPreview ? (
        <video
          key={value}
          src={value}
          className="ed-marketing-media-preview"
          controls
          muted
          playsInline
        />
      ) : null}
      <div className="ed-marketing-media-hero__footer">
        {fileInput}
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || pending}>
          <span className="material-symbols-outlined" aria-hidden>
            upload
          </span>
          {value ? "Replace file" : "Upload file"}
        </Button>
        {value ? (
          <>
            <p className="ed-text-sm ed-muted ed-marketing-media-url" title={value}>
              Current: {fileNameFromUrl(value)}
            </p>
            <button type="button" className="ed-link-button ed-text-sm" onClick={() => onChange("")}>
              Remove file
            </button>
          </>
        ) : (
          <p className="ed-text-sm ed-muted">No file selected yet. Upload PNG, JPEG, or MP4.</p>
        )}
      </div>
      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      {requiredHint}
      {inlineError}
    </div>
  );
}
