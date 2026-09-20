import type { ReactNode } from "react";
import { Button, MutationError } from "@edunudg/ui";
import { formatShortDate } from "@/features/learn/studentFormatters";

type Props = {
  name: string;
  eventDate: string | null;
  location: string | null;
  feeType: string;
  statusTag?: string;
  canEnroll?: boolean;
  enrollBlockedReason?: string | null;
  onEnroll?: () => void;
  enrollPending?: boolean;
  enrollError?: string | null;
  quizActionLabel?: string;
  onQuizAction?: () => void;
  papersActionLabel?: string;
  onPapersAction?: () => void;
  secondaryAction?: ReactNode;
};

export function CompetitionCard({
  name,
  eventDate,
  location,
  feeType,
  statusTag,
  canEnroll,
  enrollBlockedReason,
  onEnroll,
  enrollPending,
  enrollError,
  quizActionLabel,
  onQuizAction,
  papersActionLabel,
  onPapersAction,
  secondaryAction,
}: Props) {
  const isPaid = feeType === "paid" || enrollBlockedReason === "paid_coming_soon";

  return (
    <article className="ed-sp-competition">
      <div className="ed-sp-competition__head">
        <div>
          <h3 className="ed-sp-competition__title">{name}</h3>
          <p className="ed-sp-competition__meta">
            {formatShortDate(eventDate)}
            {location ? ` · ${location}` : ""}
          </p>
        </div>
        <div className="ed-sp-competition__tags">
          <span className={feeType === "paid" ? "ed-sp-tag ed-sp-tag--paid" : "ed-sp-tag ed-sp-tag--free"}>
            {feeType === "paid" ? "Paid" : "Free"}
          </span>
          {statusTag ? <span className="ed-sp-tag ed-sp-tag--registered">{statusTag}</span> : null}
        </div>
      </div>
      {enrollError ? <MutationError message={enrollError} /> : null}
      <div className="ed-sp-actions">
        {isPaid ? (
          <Button disabled aria-label="Paid event — online enrollment coming soon">
            Coming soon — online payment
          </Button>
        ) : onEnroll ? (
          <Button onClick={onEnroll} disabled={!canEnroll || enrollPending}>
            {enrollPending ? "Enrolling…" : "Enroll now"}
          </Button>
        ) : null}
        {onQuizAction && quizActionLabel ? <Button onClick={onQuizAction}>{quizActionLabel}</Button> : null}
        {onPapersAction && papersActionLabel ? (
          <Button variant="secondary" onClick={onPapersAction}>
            {papersActionLabel}
          </Button>
        ) : null}
        {secondaryAction}
      </div>
    </article>
  );
}
