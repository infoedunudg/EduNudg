import { Link } from "react-router-dom";
import { formatShortDate } from "@/features/learn/studentFormatters";

type Props = {
  name: string;
  eventDate: string | null;
  location: string | null;
  feeType: string;
  statusTag?: string;
  accentIndex?: number;
  href?: string;
};

const ACCENTS = [
  "linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)",
  "linear-gradient(135deg, #6d28d9 0%, #c084fc 100%)",
  "linear-gradient(135deg, #0f766e 0%, #5eead4 100%)",
  "linear-gradient(135deg, #b45309 0%, #fcd34d 100%)",
];

function categoryLabel(feeType: string, statusTag?: string, index = 0) {
  if (statusTag && statusTag !== "none") return "Registered";
  if (feeType === "paid") return index % 2 === 0 ? "Advanced Lab" : "Career Path";
  return index % 2 === 0 ? "Live Workshop" : "New Elective";
}

function categoryTone(feeType: string, statusTag?: string) {
  if (statusTag && statusTag !== "none") return "registered";
  if (feeType === "paid") return "premium";
  return "free";
}

function subtitle(eventDate: string | null, location: string | null, feeType: string, index: number) {
  if (eventDate) {
    const days = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400000);
    if (days >= 0 && days <= 7) {
      return days === 0 ? "Starts today" : days === 1 ? "Starts tomorrow" : `Starts in ${days} days`;
    }
    return `Starts ${formatShortDate(eventDate)}`;
  }
  if (feeType === "paid") return index % 2 === 0 ? "Unlocked at your current level" : "View requirements";
  if (location) return location;
  return "Open for enrollment";
}

export function RecommendedEventCard({
  name,
  eventDate,
  location,
  feeType,
  statusTag,
  accentIndex = 0,
  href = "/competitions",
}: Props) {
  return (
    <Link to={href} className="ed-sp-recommend-card ed-sp-recommend-card--desktop">
      <div
        className="ed-sp-recommend-card__media"
        style={{ background: ACCENTS[accentIndex % ACCENTS.length] }}
        aria-hidden
      />
      <div className="ed-sp-recommend-card__body">
        <span
          className={`ed-sp-recommend-card__tag ed-sp-recommend-card__tag--${categoryTone(feeType, statusTag)}`}
        >
          {categoryLabel(feeType, statusTag, accentIndex)}
        </span>
        <h3 className="ed-sp-recommend-card__title">{name}</h3>
        <p className="ed-sp-recommend-card__meta">{subtitle(eventDate, location, feeType, accentIndex)}</p>
        <p className="ed-sp-recommend-card__cta">View events →</p>
      </div>
    </Link>
  );
}
