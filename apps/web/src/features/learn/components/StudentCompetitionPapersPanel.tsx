import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, MutationError } from "@edunudg/ui";
import {
  fetchStudentCompetitionPapers,
  isPdfMime,
  type StudentCompetitionPaper,
} from "@/lib/competitionQuestionPapersApi";
import { resolveSecureStorageUrl } from "@/lib/secureStorageUrl";

type Props = {
  competitionId: string;
  onClose: () => void;
};

function PaperActions({ paper }: { paper: StudentCompetitionPaper }) {
  const [href, setHref] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveSecureStorageUrl(paper.file_url)
      .then((url) => {
        if (!cancelled) setHref(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open file.");
      });
    return () => {
      cancelled = true;
    };
  }, [paper.file_url]);

  if (error) return <span className="ed-text-sm ed-danger">{error}</span>;
  if (!href) return <span className="ed-text-sm ed-muted">Preparing link…</span>;
  return (
    <a href={href} download={paper.file_name} target="_blank" rel="noreferrer">
      Download
    </a>
  );
}

export function StudentCompetitionPapersPanel({ competitionId, onClose }: Props) {
  const papers = useQuery({
    queryKey: ["student-competition-papers", competitionId],
    queryFn: () => fetchStudentCompetitionPapers(competitionId),
  });

  const list = papers.data ?? [];
  const pdf = list.find((p) => isPdfMime(p.mime_type));
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!pdf?.file_url) {
      setPdfSrc(null);
      return;
    }
    void resolveSecureStorageUrl(pdf.file_url)
      .then((url) => {
        if (!cancelled) setPdfSrc(url);
      })
      .catch(() => {
        if (!cancelled) setPdfSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pdf?.file_url]);

  return (
    <div className="ed-sp-quiz" role="dialog" aria-label="Competition question papers">
      <div className="ed-sp-quiz__head">
        <h2>Question papers</h2>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      {papers.isLoading ? <p>Loading papers…</p> : null}
      {papers.error ? (
        <MutationError
          message={
            papers.error instanceof Error ? papers.error.message : "Could not load papers."
          }
        />
      ) : null}
      {!papers.isLoading && !papers.error && list.length === 0 ? (
        <p>No papers attached to this competition.</p>
      ) : null}

      {list.length > 0 ? (
        <ul className="ed-comp-options__preview">
          {list.map((p: StudentCompetitionPaper) => (
            <li key={p.id}>
              <strong>{p.title}</strong> — {p.file_name} <PaperActions paper={p} />
            </li>
          ))}
        </ul>
      ) : null}

      {pdf && pdfSrc ? (
        <iframe title={pdf.title} src={pdfSrc} className="ed-sp-paper-viewer" />
      ) : null}
    </div>
  );
}
