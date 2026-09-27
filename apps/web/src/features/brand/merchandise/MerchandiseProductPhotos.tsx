import { useEffect, useId, useRef, useState } from "react";
import { Button, MutationError } from "@edunudg/ui";
import {
  activeMerchandisePhotoUrls,
  clearMerchandiseProductPhoto,
  MERCHANDISE_PHOTO_MAX_SLOTS,
  normalizeMerchandisePhotoUrls,
  uploadMerchandiseProductPhoto,
} from "@/lib/merchandiseProductPhotoStorage";
import { buildCatalogPhotoCells } from "@/lib/brandMerchandiseHelpers";
import { useBrandMerchMobile } from "./hooks/useBrandMerchBreakpoint";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

const IMAGE_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

const CAMERA_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

type Props = {
  brandId: string;
  catalogItemId: string;
  photoUrls: string[] | null | undefined;
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  variant?: "default" | "catalog";
  onManageGallery?: () => void;
};

export function MerchandiseProductPhotos({
  brandId,
  catalogItemId,
  photoUrls,
  onChange,
  disabled,
  variant = "default",
  onManageGallery,
}: Props) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState(() => normalizeMerchandisePhotoUrls(photoUrls));
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setSlots(normalizeMerchandisePhotoUrls(photoUrls));
  }, [photoUrls]);

  const handleUpload = async (slot: number, file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setPendingSlot(slot);
    try {
      const next = await uploadMerchandiseProductPhoto(brandId, catalogItemId, slot, file);
      setSlots(next);
      onChange(next);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPendingSlot(null);
    }
  };

  const handleRemove = async (slot: number) => {
    setLocalError(null);
    setPendingSlot(slot);
    try {
      const next = await clearMerchandiseProductPhoto(brandId, catalogItemId, slot);
      setSlots(next);
      onChange(next);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setPendingSlot(null);
    }
  };

  const focusFirstEmptySlot = () => {
    if (onManageGallery) {
      onManageGallery();
      return;
    }
    const emptyInput = rootRef.current?.querySelector<HTMLInputElement>(
      'input[type="file"]:not([data-filled="true"])'
    );
    emptyInput?.click();
  };

  const activeCount = activeMerchandisePhotoUrls(slots).length;
  const mobileLayout = useBrandMerchMobile();

  if (variant === "catalog") {
    const maxCells = mobileLayout ? 3 : MERCHANDISE_PHOTO_MAX_SLOTS;
    const cells = buildCatalogPhotoCells(slots, maxCells);

    return (
      <div ref={rootRef} className="ed-merch-photos ed-merch-photos--catalog">
        <div className="ed-merch-photos__grid">
          {cells.map((cell) => {
            const slot = cell.slot;
            const inputId = `${baseId}-catalog-slot-${slot}`;
            const busy = pendingSlot === slot;

            if (cell.kind === "upload") {
              return (
                <label key={`upload-${slot}`} className="ed-merch-photos__upload" htmlFor={inputId}>
                  {CAMERA_ICON}
                  <input
                    id={inputId}
                    type="file"
                    accept={ACCEPT}
                    disabled={disabled || busy}
                    onChange={(e) => void handleUpload(slot, e.target.files?.[0])}
                  />
                </label>
              );
            }

            if (cell.kind === "image") {
              return (
                <div key={`image-${slot}`} className="ed-merch-photos__slot">
                  {slot === 1 ? <span className="ed-merch-photos__main-tag">MAIN</span> : null}
                  <img src={cell.url} alt="" className="ed-merch-photos__thumb" />
                  <input
                    id={inputId}
                    type="file"
                    accept={ACCEPT}
                    data-filled="true"
                    disabled={disabled || busy}
                    hidden
                    onChange={(e) => void handleUpload(slot, e.target.files?.[0])}
                  />
                </div>
              );
            }

            return (
              <div key={`empty-${slot}`} className="ed-merch-photos__slot">
                <div className="ed-merch-photos__placeholder">{IMAGE_ICON}</div>
              </div>
            );
          })}
        </div>
        {localError ? <MutationError message={localError} /> : null}
        <button type="button" hidden data-testid="manage-gallery-trigger" onClick={focusFirstEmptySlot}>
          Manage gallery
        </button>
      </div>
    );
  }

  return (
    <div className="ed-merch-photos">
      <p className="ed-text-sm ed-muted ed-merch-photos__header">
        Product photos ({activeCount}/{MERCHANDISE_PHOTO_MAX_SLOTS}) — upload replaces the photo in that slot.
      </p>
      <div className="ed-merch-photos__grid">
        {Array.from({ length: MERCHANDISE_PHOTO_MAX_SLOTS }, (_, i) => {
          const slot = i + 1;
          const url = slots[i]?.trim() || null;
          const inputId = `${baseId}-slot-${slot}`;
          const busy = pendingSlot === slot;

          return (
            <div key={slot} className="ed-merch-photos__slot">
              <span className="ed-merch-photos__slot-label">Photo {slot}</span>
              {url ? (
                <img src={url} alt="" className="ed-merch-photos__thumb" width={72} height={72} />
              ) : (
                <div className="ed-merch-photos__placeholder" aria-hidden>
                  No image
                </div>
              )}
              <input
                id={inputId}
                type="file"
                accept={ACCEPT}
                className="ed-field__input"
                disabled={disabled || busy}
                onChange={(e) => void handleUpload(slot, e.target.files?.[0])}
              />
              {url ? (
                <Button variant="ghost" onClick={() => void handleRemove(slot)} disabled={disabled || busy}>
                  Remove
                </Button>
              ) : null}
              {busy ? <span className="ed-text-sm ed-muted">Saving…</span> : null}
            </div>
          );
        })}
      </div>
      <MutationError message={localError} />
    </div>
  );
}
