import { useEffect, useState } from "react";
import {
  isPdfDocument,
  isWordDocument,
  type BrandLegalPageDocument,
} from "@/lib/brandLegalPages";
import { sanitizeLegalHtml } from "@/lib/sanitizeLegalHtml";

type Props = {
  doc: BrandLegalPageDocument;
  title: string;
};

export function BrandLegalPageContent({ doc, title }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isPdfDocument(doc)) return;

    if (isWordDocument(doc) && !doc.htmlUrl) {
      setLoadError("This Word file could not be converted. Re-upload as .docx or use PDF.");
      return;
    }

    const url = doc.htmlUrl ?? doc.fileUrl;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Could not load document (HTTP ${response.status})`);
        }
        const text = await response.text();
        if (!cancelled) {
          setHtml(sanitizeLegalHtml(text));
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setHtml(null);
          setLoadError(err instanceof Error ? err.message : "Could not load document");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc]);

  if (isPdfDocument(doc)) {
    return (
      <iframe
        title={title}
        src={doc.fileUrl}
        className="marketing-legal-page__pdf"
      />
    );
  }

  if (loadError) {
    return (
      <div className="marketing-legal-page__error">
        <p>{loadError}</p>
        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
          Download original file
        </a>
      </div>
    );
  }

  if (!html) {
    return <p className="marketing-legal-page__loading">Loading document…</p>;
  }

  return (
    <article
      className="marketing-legal-page__body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
