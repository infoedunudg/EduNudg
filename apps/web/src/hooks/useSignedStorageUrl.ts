import { useEffect, useState } from "react";
import { resolveSecureStorageUrl } from "@/lib/secureStorageUrl";

/** Resolves brand-private refs (and sensitive legacy paths) to a short-lived signed URL. */
export function useSignedStorageUrl(refOrUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    const raw = (refOrUrl ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("brand-private:")) return null;
    return raw;
  });

  useEffect(() => {
    let cancelled = false;
    const raw = (refOrUrl ?? "").trim();
    if (!raw) {
      setUrl(null);
      return;
    }
    if (!raw.startsWith("brand-private:") && !raw.includes("/competitions/papers/") && !raw.includes("/students/")) {
      setUrl(raw);
      return;
    }
    void resolveSecureStorageUrl(raw)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refOrUrl]);

  return url;
}
