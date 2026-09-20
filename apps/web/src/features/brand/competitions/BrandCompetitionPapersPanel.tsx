import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, MutationError, Select } from "@edunudg/ui";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  listBrandCompetitionPapers,
  listCompetitionQuestionPapers,
  setBrandCompetitionPapers,
} from "@/lib/competitionQuestionPapersApi";
import { fetchLevels, fetchPrograms } from "@/lib/curriculumApi";

type Props = { brandId: string; competitionId: string; canEdit: boolean };

export function BrandCompetitionPapersPanel({ brandId, competitionId, canEdit }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const programs = useQuery({
    queryKey: ["curriculum-programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });
  const levels = useQuery({
    queryKey: ["curriculum-levels", programId],
    enabled: !!programId,
    queryFn: () => fetchLevels(programId),
  });
  const bank = useQuery({
    queryKey: ["competition-papers", brandId, programId, levelId],
    enabled: !!programId && !!levelId,
    queryFn: () => listCompetitionQuestionPapers(brandId, programId, levelId),
  });
  const attached = useQuery({
    queryKey: ["competition-attached-papers", brandId, competitionId],
    queryFn: () => listBrandCompetitionPapers(brandId, competitionId),
  });

  const attachedIds = useMemo(
    () => new Set((attached.data ?? []).map((p) => p.paper_id)),
    [attached.data]
  );
  const available = (bank.data ?? []).filter((p) => p.is_active && !attachedIds.has(p.id));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["competition-attached-papers", brandId, competitionId] });
    void qc.invalidateQueries({ queryKey: ["competition-papers", brandId] });
  };

  const attachSelected = useMutation({
    mutationFn: async () => {
      clear();
      const picked = Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => id);
      const current = (attached.data ?? []).map((p) => p.paper_id);
      await setBrandCompetitionPapers(brandId, competitionId, [...current, ...picked]);
    },
    onSuccess: () => {
      setSelected({});
      invalidate();
    },
    onError: capture,
  });

  const removeOne = useMutation({
    mutationFn: async (paperId: string) => {
      clear();
      const remaining = (attached.data ?? []).map((p) => p.paper_id).filter((id) => id !== paperId);
      await setBrandCompetitionPapers(brandId, competitionId, remaining);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  return (
    <div className="ed-comp-questions">
      <h4 className="ed-brand-merch-item__title">Question papers</h4>
      <p className="ed-brand-merch-section__subtitle">
        Select course and level, check papers from the library, then <strong>Attach selected papers</strong>.
        Enrolled students see them under View papers — not before enroll.
      </p>
      <MutationError message={error} />

      {(attached.data ?? []).length > 0 ? (
        <ul className="ed-comp-options__preview">
          {(attached.data ?? []).map((p) => (
            <li key={p.id}>
              {p.title} ({p.file_name})
              {canEdit ? (
                <>
                  {" "}
                  <button type="button" className="ed-link-button ed-text-sm" onClick={() => removeOne.mutate(p.paper_id)}>
                    Remove
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ed-brand-merch-section__subtitle">No papers attached yet.</p>
      )}

      {canEdit ? (
        <div className="ed-comp-questions__pick">
          <Select
            label="Course"
            value={programId}
            onChange={(v) => {
              setProgramId(v);
              setLevelId("");
              setSelected({});
            }}
            options={[
              { value: "", label: "Select course" },
              ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Select
            label="Level"
            value={levelId}
            onChange={(v) => {
              setLevelId(v);
              setSelected({});
            }}
            options={[
              { value: "", label: "Select level" },
              ...(levels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          {programId && levelId ? (
            <ul className="ed-comp-options__preview">
              {available.length === 0 ? (
                <li>No active papers for this course/level (or all are already attached).</li>
              ) : (
                available.map((p) => (
                  <li key={p.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!selected[p.id]}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                      />{" "}
                      {p.title}
                    </label>
                  </li>
                ))
              )}
            </ul>
          ) : null}
          <Button
            onClick={() => attachSelected.mutate()}
            disabled={
              attachSelected.isPending || !Object.values(selected).some(Boolean)
            }
          >
            Attach selected papers
          </Button>
        </div>
      ) : null}
    </div>
  );
}
