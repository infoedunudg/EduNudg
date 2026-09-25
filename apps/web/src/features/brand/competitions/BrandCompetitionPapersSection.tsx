import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, FormGrid, Input, MutationError, Select, ToggleField } from "@edunudg/ui";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import {
  COMPETITION_PAPER_ACCEPT,
  createCompetitionQuestionPaperFromFile,
  deleteCompetitionQuestionPaper,
  isPdfMime,
  listCompetitionQuestionPapers,
  type CompetitionPaper,
  upsertCompetitionQuestionPaper,
} from "@/lib/competitionQuestionPapersApi";
import { fetchLevels, fetchPrograms } from "@/lib/curriculumApi";

type Props = {
  brandId: string;
  canEdit: boolean;
  onGoToEvents?: () => void;
};

export function BrandCompetitionPapersSection({ brandId, canEdit, onGoToEvents }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filterProgram, setFilterProgram] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editActive, setEditActive] = useState(true);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const programs = useQuery({
    queryKey: ["curriculum-programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });
  const filterLevels = useQuery({
    queryKey: ["curriculum-levels", filterProgram],
    enabled: !!filterProgram,
    queryFn: () => fetchLevels(filterProgram),
  });
  const formLevels = useQuery({
    queryKey: ["curriculum-levels", programId],
    enabled: !!programId,
    queryFn: () => fetchLevels(programId),
  });
  const papers = useQuery({
    queryKey: ["competition-papers", brandId, filterProgram || null, filterLevel || null],
    queryFn: () =>
      listCompetitionQuestionPapers(brandId, filterProgram || undefined, filterLevel || undefined),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["competition-papers", brandId] });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      if (!file || !programId || !levelId) throw new Error("Course, level, and file are required.");
      await createCompetitionQuestionPaperFromFile(brandId, {
        programId,
        levelId,
        title: title.trim() || file.name,
        file,
        isActive,
      });
    },
    onSuccess: () => {
      invalidate();
      setTitle("");
      setFile(null);
      setProgramId("");
      setLevelId("");
      setIsActive(true);
      if (fileRef.current) fileRef.current.value = "";
      closeAddForm();
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (row: CompetitionPaper) => {
      clear();
      await upsertCompetitionQuestionPaper(brandId, {
        id: row.id,
        programId: row.program_id,
        levelId: row.level_id,
        title: editTitle.trim() || row.title,
        fileName: row.file_name,
        fileUrl: row.file_url,
        mimeType: row.mime_type,
        isActive: editActive,
      });
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await deleteCompetitionQuestionPaper(brandId, id);
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const rows = papers.data ?? [];
  const canSubmit = !!programId && !!levelId && !!file;

  return (
    <div className="ed-brand-merch-section">
      <MutationError message={error} />
      <section className="ed-brand-merch-section__panel">
        <header className="ed-brand-merch-section__head">
          <div>
            <h2 className="ed-brand-merch-section__title">Question papers</h2>
            <p className="ed-brand-merch-section__subtitle">
              Upload PDF, Excel, or CSV papers by course and level. Uploading alone does not show them to
              students — open Events, choose the event, then <strong>Questions &amp; papers</strong> and
              attach the file.
            </p>
          </div>
        </header>
        <div className="ed-brand-merch-section__body">
          {rows.length > 0 ? (
            <div className="ed-comp-papers-next" role="status">
              <p>
                <strong>Next step:</strong> attach each paper to an event (for example Testing). Until then,
                enrolled students will not see View papers.
              </p>
              {onGoToEvents ? (
                <Button type="button" variant="secondary" onClick={onGoToEvents}>
                  Go to Events to attach
                </Button>
              ) : null}
            </div>
          ) : null}
          <FormGrid>
            <Select
              label="Filter course"
              value={filterProgram}
              onChange={(v) => {
                setFilterProgram(v);
                setFilterLevel("");
              }}
              options={[
                { value: "", label: "All courses" },
                ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              label="Filter level"
              value={filterLevel}
              onChange={setFilterLevel}
              options={[
                { value: "", label: "All levels" },
                ...(filterLevels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </FormGrid>

          {canEdit ? (
            <AddFormSection
              buttonLabel="Upload paper"
              panelTitle="Upload question paper"
              actionsPlacement="footer"
              primaryAction={{
                label: "Upload paper",
                onClick: () => create.mutate(),
                pending: create.isPending,
                disabled: !canSubmit || create.isPending,
              }}
            >
              {({ close }) => {
                bindClose(close);
                return (
                  <FormGrid>
                    <Select
                      label="Course"
                      value={programId}
                      onChange={(v) => {
                        setProgramId(v);
                        setLevelId("");
                      }}
                      options={[
                        { value: "", label: "Select course" },
                        ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
                      ]}
                    />
                    <Select
                      label="Level"
                      value={levelId}
                      onChange={setLevelId}
                      options={[
                        { value: "", label: "Select level" },
                        ...(formLevels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
                      ]}
                    />
                    <Input label="Title" value={title} onChange={setTitle} placeholder="Level 1 exam paper" />
                    <div>
                      <label className="ed-label" htmlFor="comp-paper-file">
                        File (PDF, Excel, or CSV)
                      </label>
                      <input
                        id="comp-paper-file"
                        ref={fileRef}
                        type="file"
                        accept={COMPETITION_PAPER_ACCEPT}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                      {file ? <p className="ed-brand-merch-section__subtitle">Selected: {file.name}</p> : null}
                    </div>
                    <ToggleField label="Active" checked={isActive} onChange={setIsActive} />
                  </FormGrid>
                );
              }}
            </AddFormSection>
          ) : null}

          {rows.length === 0 ? (
            <p className="ed-brand-merch-catalog__empty">No question papers uploaded yet.</p>
          ) : (
            <div className="ed-brand-merch-section__list">
              {rows.map((row) => {
                const editing = editingId === row.id;
                return (
                  <article key={row.id} className="ed-brand-merch-item">
                    <div className="ed-brand-merch-item__inner">
                      <div className="ed-brand-merch-item__head">
                        <div>
                          <h3 className="ed-brand-merch-item__title">{row.title}</h3>
                          <p className="ed-brand-merch-item__meta">
                            {row.file_name}
                            {row.is_active ? "" : " · Inactive"}
                            {isPdfMime(row.mime_type) ? " · PDF" : " · Spreadsheet"}
                          </p>
                        </div>
                        {canEdit ? (
                          <CrudRowActions
                            editing={editing}
                            onEdit={() => {
                              setEditingId(row.id);
                              setEditTitle(row.title);
                              setEditActive(row.is_active);
                            }}
                            onSave={() => update.mutate(row)}
                            onCancel={() => setEditingId(null)}
                            onDelete={() => remove.mutate(row.id)}
                            deleteTitle="Delete paper"
                            deleteDescription="Removes this paper from the bank. Events that already attached it will drop the link."
                            saveDisabled={!editTitle.trim() || update.isPending}
                          />
                        ) : null}
                      </div>
                      {editing ? (
                        <FormGrid>
                          <Input label="Title" value={editTitle} onChange={setEditTitle} />
                          <ToggleField label="Active" checked={editActive} onChange={setEditActive} />
                        </FormGrid>
                      ) : (
                        <div className="ed-sp-actions">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              void import("@/lib/secureStorageUrl").then(({ openSecureStorageUrl }) =>
                                openSecureStorageUrl(row.file_url, row.file_name).catch((err) => {
                                  window.alert(err instanceof Error ? err.message : "Could not open file.");
                                })
                              );
                            }}
                          >
                            Open file
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
