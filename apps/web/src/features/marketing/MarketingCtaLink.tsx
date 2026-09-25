import { Link } from "react-router-dom";
import { StaggerLabel } from "./StaggerLabel";
import { marketingHrefWithPublicOrigin, useMarketingPublicOrigin } from "./MarketingPublicOrigin";
import { sanitizeMarketingHref } from "@/lib/sanitizeMarketingHref";

export type MarketingCtaVariant = "on-dark" | "on-light";

type Props = {
  href: string;
  label: string;
  variant?: MarketingCtaVariant;
  className?: string;
  /** Screen-reader-only duplicate label (nav desktop CTA). */
  srOnlyLabel?: boolean;
  onClick?: () => void;
};

/** Shared primary CTA for marketing nav, hero, and footer. */
export function MarketingCtaLink({
  href,
  label,
  variant = "on-dark",
  className,
  srOnlyLabel = false,
  onClick,
}: Props) {
  const classes = [
    "novu-marketing-cta",
    `novu-marketing-cta--${variant}`,
    "group",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {srOnlyLabel ? <span className="novu-marketing-cta__sr-only">{label}</span> : null}
      <StaggerLabel text={label} />
    </>
  );

  const publicOrigin = useMarketingPublicOrigin();
  const resolvedHref = sanitizeMarketingHref(marketingHrefWithPublicOrigin(href, publicOrigin));
  const a11y = { "aria-label": label };

  if (resolvedHref.startsWith("#") || /^https?:/i.test(resolvedHref)) {
    return (
      <a href={resolvedHref} className={classes} {...a11y} onClick={onClick}>
        {body}
      </a>
    );
  }

  return (
    <Link to={resolvedHref} className={classes} {...a11y} onClick={onClick}>
      {body}
    </Link>
  );
}
