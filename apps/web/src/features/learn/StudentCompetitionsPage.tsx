import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  MutationError,
  PipelineDetailPlaceholder,
  PipelineListItem,
  PipelineMasterDetail,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CompetitionCard } from "@/features/learn/components/CompetitionCard";
import { StudentCompetitionQuizPanel } from "@/features/learn/components/StudentCompetitionQuizPanel";
import { StudentCompetitionPapersPanel } from "@/features/learn/components/StudentCompetitionPapersPanel";
import { SectionCard, StudentEmptyState, StudentPageHeading, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentTabBar } from "@/features/learn/components/StudentTabBar";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { StudentLearnRpcError, type StudentCompetitionCard } from "@/lib/studentLearnApi";
import {
  fetchStudentCompetitions,
  registerForCompetition,
  withdrawCompetitionRegistration,
  type PastCompetitionResult,
  type RegisteredCompetition,
} from "@/lib/studentCompetitionsApi";
import { formatShortDate } from "@/features/learn/studentFormatters";
import "@/features/center/centerOps.css";

type Tab = "upcoming" | "registered" | "past";

const TAB_LABELS: Record<Tab, string> = {
  upcoming: "Upcoming",
  registered: "My registrations",
  past: "Past results",
};

function quizLabel(status?: string, canTake?: boolean): string | undefined {
  if (status === "submitted") return "View score";
  if (status === "in_progress") return "Resume quiz";
  if (canTake) return "Take quiz";
  return undefined;
}

function isRegisteredStatus(status?: string | null): boolean {
  return status === "registered" || status === "confirmed" || status === "waitlisted";
}

export function StudentCompetitionsPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId!;
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selectedPastId, setSelectedPastId] = useState<string | null>(null);
  const [quizCompetitionId, setQuizCompetitionId] = useState<string | null>(null);
  const [papersCompetitionId, setPapersCompetitionId] = useState<string | null>(null);
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["student-competitions", brandId, tab],
    enabled: !!brandId,
    queryFn: () => fetchStudentCompetitions(brandId, tab),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
  });

  const enroll = useMutation({
    mutationFn: registerForCompetition,
    onSuccess: () => {
      setTab("registered");
      void qc.invalidateQueries({ queryKey: ["student-competitions", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] });
    },
  });

  const withdraw = useMutation({
    mutationFn: withdrawCompetitionRegistration,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["student-competitions", brandId] }),
  });

  if (list.error instanceof StudentLearnRpcError) {
    return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
  }

  const sectionTitle = TAB_LABELS[tab];
  const items = list.data ?? [];
  const heroCompetition = tab === "upcoming" ? (items as StudentCompetitionCard[])[0] : undefined;
  const restUpcoming = tab === "upcoming" ? (items as StudentCompetitionCard[]).slice(1) : [];

  const pastItems = tab === "past" ? (items as PastCompetitionResult[]) : [];
  const selectedPast =
    pastItems.find((r) => r.competition_id === selectedPastId) ?? pastItems[0] ?? null;

  function upcomingCardProps(c: StudentCompetitionCard) {
    const enrolled = isRegisteredStatus(c.my_registration_status);
    return {
      statusTag: enrolled ? c.my_registration_status : undefined,
      canEnroll: c.can_enroll,
      enrollBlockedReason: c.enroll_blocked_reason,
      onEnroll: enrolled
        ? undefined
        : () =>
            enroll.mutate(c.id, {
              onSuccess: () => {
                if (c.has_papers) setPapersCompetitionId(c.id);
              },
            }),
      enrollPending: enroll.isPending,
      quizActionLabel: quizLabel(c.quiz_status, c.can_take),
      onQuizAction: quizLabel(c.quiz_status, c.can_take)
        ? () => setQuizCompetitionId(c.id)
        : undefined,
      papersActionLabel: c.can_view_papers ? "View papers" : undefined,
      onPapersAction: c.can_view_papers ? () => setPapersCompetitionId(c.id) : undefined,
    };
  }

  return (
    <div className="ed-sp-stack">
      <StudentPageHeading title="Competitions" subtitle="Register for events, take quizzes, and view your results." />

      {quizCompetitionId ? (
        <StudentCompetitionQuizPanel competitionId={quizCompetitionId} onClose={() => setQuizCompetitionId(null)} />
      ) : null}
      {papersCompetitionId ? (
        <StudentCompetitionPapersPanel
          competitionId={papersCompetitionId}
          onClose={() => setPapersCompetitionId(null)}
        />
      ) : null}

      <StudentTabBar tabs={["upcoming", "registered", "past"] as const} value={tab} onChange={setTab} labels={TAB_LABELS} />

        {tab === "upcoming" && heroCompetition && (
          <div className="ed-sp-comp-hero">
            <p className="ed-text-sm ed-muted">Next up</p>
            <h2 className="ed-sp-competition__title">{heroCompetition.name}</h2>
            <p className="ed-sp-competition__meta">
              {formatShortDate(heroCompetition.event_date)}
              {heroCompetition.location ? ` · ${heroCompetition.location}` : ""}
            </p>
            <MutationError message={enroll.error instanceof Error ? enroll.error.message : null} />
            <CompetitionCard
              name={heroCompetition.name}
              eventDate={heroCompetition.event_date}
              location={heroCompetition.location}
              feeType={heroCompetition.fee_type}
              {...upcomingCardProps(heroCompetition)}
            />
          </div>
        )}

        {tab === "past" ? (
          <PipelineMasterDetail
            list={
              <SectionCard title="Past results">
                {list.isLoading && <StudentPortalLoading label="Loading competitions…" />}
                {!list.isLoading && pastItems.length === 0 && (
                  <StudentEmptyState
                    title="Nothing here yet"
                    text="Your competition results will show up after events you participate in."
                  />
                )}
                {pastItems.map((r) => (
                  <PipelineListItem
                    key={r.competition_id}
                    title={r.name}
                    lines={[
                      [
                        formatShortDate(r.event_date),
                        r.result_rank ?? (r.score != null ? `Score ${r.score}` : "Result posted"),
                      ]
                        .filter(Boolean)
                        .join(" · "),
                    ]}
                    selected={r.competition_id === (selectedPastId ?? selectedPast?.competition_id)}
                    onSelect={() => setSelectedPastId(r.competition_id)}
                  />
                ))}
              </SectionCard>
            }
            detail={
              selectedPast ? (
                <SectionCard title={selectedPast.name}>
                  <div className="ed-ops-detail-enter">
                    <p className="ed-sp-competition__meta">
                      {formatShortDate(selectedPast.event_date)}
                      {selectedPast.result_rank ? ` · ${selectedPast.result_rank}` : ""}
                      {selectedPast.score != null ? ` · Score ${selectedPast.score}` : ""}
                    </p>
                  </div>
                </SectionCard>
              ) : (
                <SectionCard title="Result detail">
                  <PipelineDetailPlaceholder message="Select a past competition to view your result." />
                </SectionCard>
              )
            }
          />
        ) : (
          <SectionCard title={sectionTitle}>
            {list.isLoading && <StudentPortalLoading label="Loading competitions…" />}
            <MutationError message={enroll.error instanceof Error ? enroll.error.message : null} />

            {!list.isLoading && items.length === 0 && (
              <StudentEmptyState
                title="Nothing here yet"
                text={
                  tab === "upcoming"
                    ? "New competitions from your brand will appear here when registration opens."
                    : "Enroll in an upcoming event to see it here. Question papers appear on this tab after you enroll (when the brand attached papers)."
                }
              />
            )}

            {tab === "upcoming" && restUpcoming.length > 0 && (
              <div className="ed-sp-layout-competitions__list">
                {restUpcoming.map((c) => (
                  <CompetitionCard
                    key={c.id}
                    name={c.name}
                    eventDate={c.event_date}
                    location={c.location}
                    feeType={c.fee_type}
                    {...upcomingCardProps(c)}
                  />
                ))}
              </div>
            )}

            {tab === "registered" && (items as RegisteredCompetition[]).length > 0 && (
              <div className="ed-sp-layout-competitions__list">
                {(items as RegisteredCompetition[]).map((r) => (
                  <CompetitionCard
                    key={r.registration_id}
                    name={r.name}
                    eventDate={r.event_date}
                    location={r.location}
                    feeType={r.fee_type}
                    statusTag={r.status}
                    quizActionLabel={quizLabel(r.quiz_status, r.can_take) ?? (r.quiz_status === "submitted" ? "View score" : undefined)}
                    onQuizAction={
                      r.can_take || r.quiz_status === "submitted"
                        ? () => setQuizCompetitionId(r.competition_id)
                        : undefined
                    }
                    papersActionLabel={r.can_view_papers ? "View papers" : undefined}
                    onPapersAction={
                      r.can_view_papers ? () => setPapersCompetitionId(r.competition_id) : undefined
                    }
                    secondaryAction={
                      r.fee_type === "free" && r.status === "registered" ? (
                        <Button variant="ghost" onClick={() => withdraw.mutate(r.registration_id)} disabled={withdraw.isPending}>
                          Withdraw
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </SectionCard>
        )}
    </div>
  );
}
