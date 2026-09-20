import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  FormGrid,
  Input,
  MutationError,
  Select,
  ToggleField,
} from "@edunudg/ui";
import { BrandCompetitionQuestionsPanel } from "@/features/brand/competitions/BrandCompetitionQuestionsPanel";
import { BrandCompetitionPapersPanel } from "@/features/brand/competitions/BrandCompetitionPapersPanel";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import {
  deleteBrandCompetition,
  listBrandCompetitions,
  upsertBrandCompetition,
  type BrandCompetition,
} from "@/lib/brandCompetitionsApi";
import "@/features/brand/merchandise/brandMerchandiseCatalog.css";

type Props = { brandId: string; canEdit: boolean };

type CompetitionForm = {
  name: string;
  eventDate: string;
  location: string;
  feeType: "free" | "paid";
  registrationClosesAt: string;
  isActive: boolean;
};

const emptyForm: CompetitionForm = {
  name: "",
  eventDate: "",
  location: "",
  feeType: "free",
  registrationClosesAt: "",
  isActive: true,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rowToForm(row: BrandCompetition): CompetitionForm {
  return {
    name: row.name,
    eventDate: row.event_date ?? "",
    location: row.location ?? "",
    feeType: row.fee_type,
    registrationClosesAt: toDatetimeLocal(row.registration_closes_at),
    isActive: row.is_active,
  };
}

export function BrandCompetitionsSection({ brandId, canEdit }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [questionsFor, setQuestionsFor] = useState<string | null>(null);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const competitions = useQuery({
    queryKey: ["brand-competitions", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandCompetitions(brandId),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["brand-competitions", brandId] });

  const toPayload = (f: CompetitionForm, id?: string) => ({
    id,
    name: f.name,
    eventDate: f.eventDate || undefined,
    location: f.location,
    isActive: f.isActive,
    feeType: f.feeType,
    registrationClosesAt: f.registrationClosesAt || undefined,
    registrationMode: "open" as const,
  });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertBrandCompetition(brandId, toPayload(form));
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      closeAddForm();
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await upsertBrandCompetition(brandId, toPayload(editForm, id));
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
      await deleteBrandCompetition(brandId, id);
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const renderFields = (
    f: CompetitionForm,
    setF: (value: CompetitionForm | ((prev: CompetitionForm) => CompetitionForm)) => void
  ) => (
    <FormGrid>
      <Input label="Name" value={f.name} onChange={(name) => setF((prev) => ({ ...prev, name }))} />
      <Input
        label="Event date"
        value={f.eventDate}
        onChange={(eventDate) => setF((prev) => ({ ...prev, eventDate }))}
        type="date"
      />
      <Input
        label="Location"
        value={f.location}
        onChange={(location) => setF((prev) => ({ ...prev, location }))}
      />
      <Select
        label="Fee type"
        value={f.feeType}
        onChange={(v) => setF((prev) => ({ ...prev, feeType: v as "free" | "paid" }))}
        options={[
          { value: "free", label: "Free — student can enroll" },
          { value: "paid", label: "Paid — Coming soon on portal" },
        ]}
      />
      <Input
        label="Registration closes"
        value={f.registrationClosesAt}
        onChange={(registrationClosesAt) => setF((prev) => ({ ...prev, registrationClosesAt }))}
        type="datetime-local"
      />
      <ToggleField
        label="Active"
        description="Visible on student learn dashboard"
        checked={f.isActive}
        onChange={(isActive) => setF((prev) => ({ ...prev, isActive }))}
      />
    </FormGrid>
  );

  const rows = competitions.data ?? [];

  return (
    <div className="ed-brand-merch-section">
      <MutationError message={error} />

      <section className="ed-brand-merch-section__panel">
        <header className="ed-brand-merch-section__head">
          <div>
            <h2 className="ed-brand-merch-section__title">Events</h2>
            <p className="ed-brand-merch-section__subtitle">
              Competitions appear on the student learn portal. Free events allow self-enrollment; paid events
              show Coming soon. Attach quiz questions after you create an event.
            </p>
          </div>
        </header>

        <div className="ed-brand-merch-section__body">
          {canEdit ? (
            <AddFormSection
              buttonLabel="Add competition"
              panelTitle="Add competition"
              actionsPlacement="footer"
              primaryAction={{
                label: "Add competition",
                onClick: () => create.mutate(),
                pending: create.isPending,
                disabled: !form.name.trim(),
              }}
            >
              {({ close }) => {
                bindClose(close);
                return renderFields(form, setForm);
              }}
            </AddFormSection>
          ) : null}

          {rows.length === 0 ? (
            <p className="ed-brand-merch-catalog__empty">No competitions scheduled.</p>
          ) : (
            <div className="ed-brand-merch-section__list">
              {rows.map((c) => {
                const editing = editingId === c.id;
                return (
                  <article key={c.id} className="ed-brand-merch-item">
                    <div className="ed-brand-merch-item__inner">
                      <div className="ed-brand-merch-item__head">
                        <div>
                          <h3 className="ed-brand-merch-item__title">{c.name}</h3>
                          <p className="ed-brand-merch-item__meta">
                            {c.event_date ?? "Date TBD"}
                            {c.location ? ` · ${c.location}` : ""}
                          </p>
                        </div>
                        <div className="ed-brand-merch-item__actions">
                          {canEdit ? (
                            <CrudRowActions
                              editing={editing}
                              onEdit={() => {
                                setEditingId(c.id);
                                setEditForm(rowToForm(c));
                              }}
                              onSave={() => update.mutate(c.id)}
                              onCancel={() => setEditingId(null)}
                              onDelete={() => remove.mutate(c.id)}
                              deleteTitle="Delete competition"
                              deleteDescription="This removes the competition from the learn portal. Existing registrations are also removed."
                              saveDisabled={!editForm.name.trim() || update.isPending}
                            />
                          ) : null}
                        </div>
                      </div>

                      {editing ? (
                        renderFields(editForm, setEditForm)
                      ) : (
                        <>
                          <div className="ed-brand-merch-item__badges">
                            {c.fee_type === "paid" ? <Badge>Paid</Badge> : <Badge tone="success">Free</Badge>}
                            <Badge tone={c.is_active ? "success" : "default"}>
                              {c.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <div className="ed-brand-merch-item__facts">
                            <div className="ed-brand-merch-item__fact">
                              <span>Registration</span>
                              <span>
                                {c.registration_closes_at
                                  ? `Closes ${new Date(c.registration_closes_at).toLocaleString()}`
                                  : "Open"}
                              </span>
                            </div>
                            <div className="ed-brand-merch-item__fact">
                              <span>Mode</span>
                              <span>{c.registration_mode}</span>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            onClick={() => setQuestionsFor((id) => (id === c.id ? null : c.id))}
                          >
                            {questionsFor === c.id ? "Hide questions & papers" : "Questions & papers"}
                          </Button>
                          {questionsFor === c.id ? (
                            <>
                              <BrandCompetitionQuestionsPanel
                                brandId={brandId}
                                competitionId={c.id}
                                canEdit={canEdit}
                              />
                              <BrandCompetitionPapersPanel
                                brandId={brandId}
                                competitionId={c.id}
                                canEdit={canEdit}
                              />
                            </>
                          ) : null}
                        </>
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
