import { Link, useLocation } from "react-router-dom";
import type { HomepageLink } from "@/types/homepage";
import { resolveMarketingSectionHref } from "@/lib/marketingPublicSite";
import { sanitizeMarketingHref } from "@/lib/sanitizeMarketingHref";
import { marketingHrefWithPublicOrigin, useMarketingPublicOrigin } from "@/features/marketing/MarketingPublicOrigin";

type Props = {
  href: string;
  label: string;
  className?: string;
  externalClassName?: string;
};

export function MarketingFooterLink({ href, label, className, externalClassName }: Props) {
  const { pathname } = useLocation();
  const resolved = sanitizeMarketingHref(
    marketingHrefWithPublicOrigin(resolveMarketingSectionHref(href, pathname), useMarketingPublicOrigin())
  );
  const linkClass = className ?? "mkt-footer-shell__link";

  if (resolved.startsWith("/") && !resolved.startsWith("//") && !/^https?:/i.test(resolved)) {
    return (
      <Link to={resolved} className={linkClass}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={resolved}
      className={externalClassName ?? linkClass}
      target={resolved.startsWith("http") ? "_blank" : undefined}
      rel={resolved.startsWith("http") ? "noreferrer" : undefined}
    >
      {label}
    </a>
  );
}

type ColumnProps = {
  title: string;
  links: HomepageLink[];
  headingClassName?: string;
  listClassName?: string;
  linkClassName?: string;
};

export function FooterLinkColumn({
  title,
  links,
  headingClassName,
  listClassName,
  linkClassName,
}: ColumnProps) {
  if (links.length === 0) return null;

  return (
    <div className="mkt-footer-shell__column">
      <h3 className={headingClassName ?? "mkt-footer-shell__heading"}>{title}</h3>
      <ul className={listClassName ?? "mkt-footer-shell__links"}>
        {links.map((link) => (
          <li key={`${title}-${link.label}-${link.href}`}>
            <MarketingFooterLink href={link.href} label={link.label} className={linkClassName} />
          </li>
        ))}
      </ul>
    </div>
  );
}
