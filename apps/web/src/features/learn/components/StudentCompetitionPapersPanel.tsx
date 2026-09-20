import { useQuery } from "@tanstack/react-query";
import { Button, MutationError } from "@edunudg/ui";
import {
  fetchStudentCompetitionPapers,
  isPdfMime,
  type StudentCompetitionPaper,
} from "@/lib/competitionQuestionPapersApi";

type Props = {
  competitionId: string;
  onClose: () => void;
};

export function StudentCompetitionPapersPanel({ competitionId, onClose }: Props) {
  const papers = useQuery({
    queryKey: ["student-competition-papers", competitionId],
    queryFn: () => fetchStudentCompetitionPapers(competitionId),
  });

  const list = papers.data ?? [];
  const pdf = list.find((p) => isPdfMime(p.mime_type));

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
              <strong>{p.title}</strong> — {p.file_name}{" "}
              <a href={p.file_url} download={p.file_name} target="_blank" rel="noreferrer">
                Download
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {pdf ? (
        <iframe
          title={pdf.title}
          src={pdf.file_url}
          className="ed-sp-paper-viewer"
        />
      ) : null}
    </div>
  );
}
