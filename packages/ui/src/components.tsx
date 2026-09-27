import { useState, useId, type MouseEventHandler, type ReactNode } from "react";
import { PhoneDialButton } from "./phone";
import { telHref } from "./phoneLinks";

function fieldNameFromLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "field";
}
import { Link } from "react-router-dom";
import { IconEye, IconEyeOff } from "./icons";

export {
  ThemeProvider,
  useAdminTheme,
  readAdminTheme,
  writeAdminTheme,
  AppShell,
  scrollStaffAppToTop,
  LoginLayout,
  ComingSoonPage,
  SidebarNavLink,
  type ShellNavItem,
  type ShellNavSection,
  type LoginBrandingProps,
  type LoginFooterLink,
} from "./shell";

/** @deprecated Use AppShell navSections with react-router Link */
export function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={href} className={["ed-nav-link", active ? "ed-nav-link--active" : ""].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = [
    "ed-kpi",
    onClick ? "ed-kpi--clickable" : "",
    active ? "ed-kpi--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        <div className="ed-kpi__label">{label}</div>
        <div className="ed-kpi__value">{value}</div>
        {hint && <div className="ed-kpi__hint">{hint}</div>}
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="ed-kpi__label">{label}</div>
      <div className="ed-kpi__value">{value}</div>
      {hint && <div className="ed-kpi__hint">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-kpi-grid", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  block,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "oauth-google" | "oauth-whatsapp";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  disabled?: boolean;
  block?: boolean;
}) {
  const variantClass =
    variant === "primary"
      ? "ed-btn--primary"
      : variant === "secondary"
        ? "ed-btn--secondary"
        : variant === "danger"
          ? "ed-btn--danger"
          : variant === "oauth-google"
            ? "ed-btn--oauth-google"
            : variant === "oauth-whatsapp"
              ? "ed-btn--oauth-whatsapp"
              : "ed-btn--ghost";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={["ed-btn", variantClass, block ? "ed-btn--block" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

/** Primary save action with consistent pending / saved labels for admin forms. */
export function SaveButton({
  onClick,
  pending = false,
  saved = false,
  disabled,
  label = "Save",
  block,
}: {
  onClick: () => void;
  pending?: boolean;
  saved?: boolean;
  disabled?: boolean;
  label?: string;
  block?: boolean;
}) {
  return (
    <Button onClick={onClick} disabled={disabled ?? pending} block={block}>
      {pending ? "Saving…" : saved ? "Saved" : label}
    </Button>
  );
}

/** Right-aligned row for form submit actions (Save, etc.). */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="ed-form-actions">{children}</div>;
}

export type DraftPublishedValue = "draft" | "published";

/** Adjacent Draft / Published controls using primary + ghost button styles. */
export function DraftPublishedToggle({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel = "Publication status",
}: {
  value: DraftPublishedValue;
  onChange: (value: DraftPublishedValue) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-toggle-choice" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={`ed-btn ed-toggle-choice__btn${value === "draft" ? " ed-btn--primary" : " ed-btn--ghost"}`}
        aria-pressed={value === "draft"}
        disabled={disabled}
        onClick={() => onChange("draft")}
      >
        Draft
      </button>
      <button
        type="button"
        className={`ed-btn ed-toggle-choice__btn${value === "published" ? " ed-btn--primary" : " ed-btn--ghost"}`}
        aria-pressed={value === "published"}
        disabled={disabled}
        onClick={() => onChange("published")}
      >
        Published
      </button>
    </div>
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ed-card">
      {(title || actions) && (
        <div className="ed-card__header">
          {title && <h2 className="ed-card__title">{title}</h2>}
          {actions ? <div className="ed-card__actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  step,
  editable = false,
  disabled,
  id,
  name,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  step?: string;
  editable?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  list?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  const isTel = type === "tel";
  const dialHref = isTel ? telHref(value) : null;
  const input = (
    <input
      id={inputId}
      name={inputName}
      className="ed-field__input"
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      step={step}
      disabled={disabled}
      list={list}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <label
      className={`ed-field${editable ? " ed-field--editable" : ""}${isTel ? " ed-field--dialable" : ""}`}
      htmlFor={inputId}
    >
      <span className="ed-field__label">{label}</span>
      {isTel ? (
        <div className="ed-field__input-wrap">
          {input}
          {dialHref ? <PhoneDialButton phone={value} label={`Call ${value.trim()}`} /> : null}
        </div>
      ) : (
        input
      )}
    </label>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Enter a password",
  autoComplete = "current-password",
  disabled,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);

  return (
    <label className="ed-field ed-field--password" htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <div className="ed-field__input-wrap">
        <input
          id={inputId}
          name={inputName}
          className="ed-field__input"
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="ed-field__toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
        </button>
      </div>
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  editable = false,
  id,
  name,
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  editable?: boolean;
  id?: string;
  name?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`} htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <select
        id={inputId}
        name={inputName}
        className="ed-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MutationError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="ed-mutation-error" role="alert">
      <span className="ed-mutation-error__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      </span>
      <p className="ed-mutation-error__message">{message}</p>
    </div>
  );
}

export function DataList<T extends { id: string }>({
  items,
  render,
  empty,
  variant = "default",
}: {
  items: T[];
  render: (item: T) => ReactNode;
  empty?: ReactNode;
  /** pipeline = compact rows for lead/application queues */
  variant?: "default" | "pipeline";
}) {
  if (items.length === 0) {
    if (empty != null) {
      return typeof empty === "string" ? <p className="ed-empty">{empty}</p> : empty;
    }
    return <p className="ed-empty">No items yet.</p>;
  }
  return (
    <div className={variant === "pipeline" ? "ed-data-list ed-data-list--pipeline" : "ed-data-list"}>
      {items.map((item) => (
        <div key={item.id} className="ed-data-list__item">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" }) {
  return <span className={`ed-badge ed-badge--${tone}`}>{children}</span>;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h2 className="ed-page-title">{children}</h2>;
}

export function PageToolbar({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="ed-page-toolbar">
      <div>
        {typeof title === "string" ? (
          <h2 className={`ed-page-title${subtitle ? " ed-page-title--with-sub" : ""}`}>{title}</h2>
        ) : (
          title
        )}
        {subtitle && <p className="ed-muted ed-text-sm ed-page-toolbar__subtitle">{subtitle}</p>}
      </div>
      {children && <div className="ed-page-toolbar__actions">{children}</div>}
    </div>
  );
}

export function ListRow({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["ed-list-row", className].filter(Boolean).join(" ")}>
      <div className="ed-list-row__main">{children}</div>
      {aside ? <div className="ed-list-row__aside">{aside}</div> : null}
    </div>
  );
}

/** App content grid: 1 col mobile, 2 col tablet, 3 col desktop (when cols=3). */
export function PageGrid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
}) {
  const colClass = cols === 2 ? "ed-page-grid--2" : "ed-page-grid--3";
  return <div className={["ed-page-grid", colClass, className].filter(Boolean).join(" ")}>{children}</div>;
}

/** Full-width row inside PageGrid (forms, tables). */
export function PageGridFull({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-page-grid__full", className].filter(Boolean).join(" ")}>{children}</div>;
}

/** Form field grid: default 2 columns from tablet; pass columns={1} or {3} to override. */
export function FormGrid({ children, columns }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  const modifier =
    columns === 3 ? " ed-form-grid--3" : columns === 1 ? " ed-form-grid--1" : "";
  return <div className={`ed-form-grid${modifier}`}>{children}</div>;
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  editable = false,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  editable?: boolean;
  id?: string;
  name?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`} htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <textarea
        id={inputId}
        name={inputName}
        className="ed-field__input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Responsive grid for boolean toggle fields: 2 columns mobile/tablet, 3 on desktop. */
export function ToggleGrid({ children }: { children: ReactNode }) {
  return <div className="ed-toggle-grid">{children}</div>;
}

export function Toggle({
  checked,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={["ed-toggle", checked ? "ed-toggle--on" : ""].filter(Boolean).join(" ")}
      onClick={() => onChange(!checked)}
    >
      <span className="ed-toggle__thumb" aria-hidden />
    </button>
  );
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="ed-toggle-field">
      <div className="ed-toggle-field__body">
        <label className="ed-toggle-field__label" htmlFor={id}>
          {label}
        </label>
        {description ? <p className="ed-toggle-field__description">{description}</p> : null}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  variant = "default",
  "aria-label": ariaLabel = "Filter",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "default" | "segmented";
  "aria-label"?: string;
}) {
  return (
    <div
      className={["ed-filter-tabs", variant === "segmented" ? "ed-filter-tabs--segmented" : ""]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        const label =
          option.count != null ? `${option.label} (${option.count})` : option.label;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            className={`ed-filter-tabs__btn${active ? " is-active" : ""}`}
            aria-selected={active}
            onClick={() => onChange(option.value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function PipelineMasterDetail({
  list,
  detail,
}: {
  list: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="ed-pipeline-layout">
      <div className="ed-pipeline-layout__list">{list}</div>
      {detail ? <div className="ed-pipeline-layout__detail">{detail}</div> : null}
    </div>
  );
}

export function PipelineListItem({
  title,
  meta,
  lines,
  badges,
  initials,
  when,
  selected,
  linked,
  onSelect,
}: {
  title: string;
  meta?: string;
  lines?: string[];
  badges?: ReactNode;
  initials?: string;
  when?: string;
  selected?: boolean;
  linked?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`ed-pipeline-item${selected ? " ed-pipeline-item--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {linked ? <span className="ed-pipeline-item__linked">LINKED</span> : null}
      {initials && (
        <span className="ed-pipeline-item__avatar" aria-hidden>
          {initials}
        </span>
      )}
      <span className="ed-pipeline-item__body">
        <span className="ed-pipeline-item__title-row">
          <span className="ed-pipeline-item__title">{title}</span>
          {when && <span className="ed-pipeline-item__when">{when}</span>}
        </span>
        {meta && <span className="ed-pipeline-item__meta">{meta}</span>}
        {lines?.map((line) => (
          <span key={line} className="ed-pipeline-item__line">
            {line}
          </span>
        ))}
        {badges && <span className="ed-pipeline-item__badges">{badges}</span>}
      </span>
    </button>
  );
}

export function PipelineEmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ed-pipeline-empty">
      <p className="ed-pipeline-empty__message">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export function PipelineDetailPlaceholder({ message }: { message: string }) {
  return (
    <Card title="Details">
      <p className="ed-text-sm ed-muted ed-pipeline-detail-placeholder">{message}</p>
    </Card>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  disabled,
  "aria-label": ariaLabel = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-qty-stepper" aria-label={ariaLabel}>
      <button
        type="button"
        className="ed-qty-stepper__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="ed-qty-stepper__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="ed-qty-stepper__btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function MobileCartBar({
  itemCount,
  totalLabel,
  onOpen,
  openLabel = "View Cart",
}: {
  itemCount: number;
  totalLabel: string;
  onOpen: () => void;
  openLabel?: string;
}) {
  if (itemCount <= 0) return null;

  return (
    <div className="ed-cart-bar">
      <button type="button" className="ed-cart-bar__btn" onClick={onOpen}>
        <span className="ed-cart-bar__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span className="ed-cart-bar__summary">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="ed-cart-bar__dot" aria-hidden>
          ·
        </span>
        <span className="ed-cart-bar__total">{totalLabel}</span>
        <span className="ed-cart-bar__action">
          {openLabel} →
        </span>
      </button>
    </div>
  );
}

export function BottomNav({
  items,
  navLabel = "Primary",
  scrollable = false,
  "aria-label": ariaLabelProp,
}: {
  items: { href: string; label: string; icon: ReactNode; active?: boolean }[];
  navLabel?: string;
  scrollable?: boolean;
  "aria-label"?: string;
}) {
  const ariaLabel = ariaLabelProp ?? navLabel;
  const className = ["ed-bottom-nav", scrollable || items.length > 5 ? "ed-bottom-nav--scroll" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <nav className={className} aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={`ed-bottom-nav__item${item.active ? " ed-bottom-nav__item--active" : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          <span className="ed-bottom-nav__icon">{item.icon}</span>
          <span className="ed-bottom-nav__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function OpsPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ed-ops-page-header">
      <div>
        <h1 className="ed-ops-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-ops-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="ed-ops-page-header__action">{action}</div> : null}
    </header>
  );
}

export function OpsListHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="ed-ops-list-header">
      <h2 className="ed-ops-list-header__title">{title}</h2>
      {badge ? <span className="ed-ops-list-header__badge">{badge}</span> : null}
    </div>
  );
}

export function OpsSearchField({
  value,
  onChange,
  placeholder = "Search…",
  onFilterClick,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}) {
  return (
    <div className="ed-ops-search-row">
      <label className="ed-ops-search">
        <span className="ed-ops-search__icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      {onFilterClick ? (
        <button type="button" className="ed-ops-filter-btn" aria-label="Filter" onClick={onFilterClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function OpsMobileFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="ed-ops-fab" aria-label={label} onClick={onClick}>
      +
    </button>
  );
}

export function OpsSectionCard({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ed-ops-section-card">
      <div className="ed-ops-section-card__head">
        <span className="ed-ops-section-card__icon">{icon}</span>
        <div>
          <h3 className="ed-ops-section-card__title">{title}</h3>
          {description ? <p className="ed-ops-section-card__desc">{description}</p> : null}
        </div>
      </div>
      {children}
      {footer ? <div className="ed-ops-section-card__footer">{footer}</div> : null}
    </section>
  );
}

export type EditorSectionTone = "primary" | "secondary" | "tertiary" | "neutral";

/** Homepage / marketing editor page header with optional last-saved badge. */
export function EditorPageHeader({
  title,
  subtitle,
  lastSavedLabel,
}: {
  title: string;
  subtitle?: ReactNode;
  lastSavedLabel?: string | null;
}) {
  return (
    <header className="ed-editor-page-header">
      <div className="ed-editor-page-header__main">
        <h1 className="ed-editor-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-editor-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {lastSavedLabel ? (
        <p className="ed-editor-page-header__saved">
          <span className="ed-editor-page-header__saved-icon material-symbols-outlined" aria-hidden>
            schedule
          </span>
          {lastSavedLabel}
        </p>
      ) : null}
    </header>
  );
}

/** Always-visible editor section card (Site Identity, Navigation, etc.). */
export function EditorSectionCard({
  icon,
  iconTone = "primary",
  title,
  headerAction,
  children,
}: {
  icon: ReactNode;
  iconTone?: EditorSectionTone;
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ed-editor-section-card">
      <div className="ed-editor-section-card__header">
        <div className="ed-editor-section-card__title-row">
          <span className={`ed-editor-section-card__icon ed-editor-section-card__icon--${iconTone}`}>
            {icon}
          </span>
          <h2 className="ed-editor-section-card__title">{title}</h2>
        </div>
        {headerAction ? <div className="ed-editor-section-card__action">{headerAction}</div> : null}
      </div>
      <div className="ed-editor-section-card__body">{children}</div>
    </section>
  );
}

/** Sticky draft/save bar for homepage and marketing editors. */
export function EditorSaveBar({
  draftNote = "Changes are currently in draft.",
  savedNote = "All changes saved.",
  isDirty = false,
  onDiscard,
  onSave,
  savePending = false,
  saved = false,
  saveLabel = "Save changes",
  discardLabel = "Discard",
  inline = false,
}: {
  draftNote?: string;
  savedNote?: string;
  isDirty?: boolean;
  onDiscard?: () => void;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  /** When true, bar flows at the end of a panel instead of fixed to the viewport. */
  inline?: boolean;
}) {
  return (
    <div
      className={["ed-editor-save-bar", inline ? "ed-editor-save-bar--inline" : ""].filter(Boolean).join(" ")}
      role="region"
      aria-label="Save changes"
    >
      <div className="ed-editor-save-bar__inner">
        <p className="ed-editor-save-bar__status">{isDirty ? draftNote : savedNote}</p>
        <div className="ed-editor-save-bar__actions">
          {onDiscard && isDirty ? (
            <Button variant="secondary" onClick={onDiscard} disabled={savePending}>
              {discardLabel}
            </Button>
          ) : null}
          <SaveButton
            onClick={onSave}
            pending={savePending}
            saved={saved}
            label={saveLabel}
            disabled={savePending}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Backend commerce (merchandise orders, inventory ops) ─── */

export function CommercePageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ed-commerce-page-header">
      <div className="ed-commerce-page-header__copy">
        <h1 className="ed-commerce-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-commerce-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="ed-commerce-page-header__action">{action}</div> : null}
    </header>
  );
}

export function CommerceAlertBanner({
  message,
  actionLabel,
  onAction,
  actionHref,
}: {
  message: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  const action =
    actionLabel && onAction ? (
      <button type="button" className="ed-commerce-alert__action" onClick={onAction}>
        {actionLabel}
      </button>
    ) : actionLabel && actionHref ? (
      <Link to={actionHref} className="ed-commerce-alert__action">
        {actionLabel}
      </Link>
    ) : null;

  return (
    <div className="ed-commerce-alert" role="status">
      <span className="ed-commerce-alert__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </span>
      <p className="ed-commerce-alert__message">{message}</p>
      {action}
    </div>
  );
}

export function CommerceWorkspace({
  main,
  aside,
}: {
  main: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={`ed-commerce-workspace${aside ? "" : " ed-commerce-workspace--single"}`}>
      <div className="ed-commerce-workspace__main">{main}</div>
      {aside ? <aside className="ed-commerce-workspace__aside">{aside}</aside> : null}
    </div>
  );
}

export function CommerceSectionHeader({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <div className="ed-commerce-section-header">
      <h2 className="ed-commerce-section-header__title">{title}</h2>
      {badge ? <span className="ed-commerce-section-header__badge">{badge}</span> : null}
    </div>
  );
}

export function CommerceWidgetCard({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ed-commerce-widget">
      <div className="ed-commerce-widget__head">
        <span className="ed-commerce-widget__icon">{icon}</span>
        <div>
          <h3 className="ed-commerce-widget__title">{title}</h3>
          {description ? <p className="ed-commerce-widget__desc">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="ed-commerce-widget__body">{children}</div> : null}
      {footer ? <div className="ed-commerce-widget__footer">{footer}</div> : null}
    </section>
  );
}

export type CommerceStatTone = "blue" | "purple" | "teal" | "rose";

export function CommerceStatTiles({
  items,
}: {
  items: { label: string; value: string; tone?: CommerceStatTone }[];
}) {
  return (
    <div className="ed-commerce-stat-tiles">
      {items.map((item) => (
        <div
          key={item.label}
          className={`ed-commerce-stat-tile ed-commerce-stat-tile--${item.tone ?? "blue"}`}
        >
          <p className="ed-commerce-stat-tile__label">{item.label}</p>
          <p className="ed-commerce-stat-tile__value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function CommerceArchiveNote({ children }: { children?: ReactNode }) {
  return (
    <div className="ed-commerce-archive-note">
      <span className="ed-commerce-archive-note__icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </span>
      <p className="ed-commerce-archive-note__text">
        {children ?? "Older orders are archived. View full history."}
      </p>
    </div>
  );
}

export function CommerceOrderCard({
  orderLabel,
  statusBadges,
  placedAt,
  invoiceLabel,
  invoiceNumber,
  lines,
  totalLabel,
  dueLabel,
  dueTone = "default",
  footer,
  expanded,
}: {
  orderLabel: string;
  statusBadges: ReactNode;
  placedAt: string;
  invoiceLabel?: string;
  invoiceNumber?: string;
  lines: ReactNode;
  totalLabel: string;
  dueLabel?: string;
  dueTone?: "default" | "danger";
  footer?: ReactNode;
  expanded?: ReactNode;
}) {
  return (
    <article className="ed-commerce-order-card">
      <div className="ed-commerce-order-card__top">
        <div className="ed-commerce-order-card__identity">
          <strong className="ed-commerce-order-card__id">{orderLabel}</strong>
          <div className="ed-commerce-order-card__badges">{statusBadges}</div>
        </div>
        {invoiceNumber ? (
          <div className="ed-commerce-order-card__invoice">
            <span className="ed-commerce-order-card__invoice-label">{invoiceLabel ?? "Invoice"}</span>
            <span className="ed-commerce-order-card__invoice-number">{invoiceNumber}</span>
          </div>
        ) : null}
      </div>
      <p className="ed-commerce-order-card__date">
        <span className="ed-commerce-order-card__date-icon" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
        {placedAt}
      </p>
      <ul className="ed-commerce-order-card__lines">{lines}</ul>
      <div className="ed-commerce-order-card__footer">
        <p className="ed-commerce-order-card__total">{totalLabel}</p>
        {dueLabel ? (
          <p
            className={`ed-commerce-order-card__due${
              dueTone === "danger" ? " ed-commerce-order-card__due--danger" : ""
            }`}
          >
            <span aria-hidden>⏱</span> {dueLabel}
          </p>
        ) : null}
        {footer}
      </div>
      {expanded ? <div className="ed-commerce-order-card__expanded">{expanded}</div> : null}
    </article>
  );
}

/* ─── Backend pipeline (leads, applications) ─── */

export type PipelineMetricTone = "blue" | "red" | "purple";

export function PipelinePageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ed-pipeline-page-header">
      <div className="ed-pipeline-page-header__copy">
        <h1 className="ed-pipeline-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-pipeline-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-pipeline-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function PipelineMetricCard({
  icon,
  label,
  value,
  hint,
  badge,
  tone = "blue",
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  badge?: ReactNode;
  tone?: PipelineMetricTone;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = [
    "ed-pipeline-metric",
    `ed-pipeline-metric--${tone}`,
    active ? "ed-pipeline-metric--active" : "",
    onClick ? "ed-pipeline-metric--clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <div className="ed-pipeline-metric__head">
        <span className="ed-pipeline-metric__icon">{icon}</span>
        {badge}
      </div>
      <p className="ed-pipeline-metric__value">{value}</p>
      <p className="ed-pipeline-metric__label">{label}</p>
      {hint ? <p className="ed-pipeline-metric__hint">{hint}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export function PipelineMetricStrip({ children }: { children: ReactNode }) {
  return <div className="ed-pipeline-metric-strip">{children}</div>;
}

export function PipelineWorkspace({
  list,
  detail,
  detailOpen,
}: {
  list: ReactNode;
  detail?: ReactNode;
  detailOpen?: boolean;
}) {
  return (
    <div
      className={[
        "ed-pipeline-workspace",
        detailOpen ? "ed-pipeline-workspace--detail-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ed-pipeline-workspace__list">{list}</div>
      {detail ? <aside className="ed-pipeline-workspace__detail">{detail}</aside> : null}
    </div>
  );
}

export function PipelinePanel({ children }: { children: ReactNode }) {
  return <section className="ed-pipeline-panel">{children}</section>;
}

export function PipelineTableToolbar({
  tabs,
  meta,
}: {
  tabs?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="ed-pipeline-table-toolbar">
      <div className="ed-pipeline-table-toolbar__tabs">{tabs}</div>
      {meta ? <p className="ed-pipeline-table-toolbar__meta">{meta}</p> : null}
    </div>
  );
}

export type PipelineStatusTone = "new" | "contacted" | "trial" | "hot" | "lost" | "converted" | "neutral";

export function PipelineStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: PipelineStatusTone;
}) {
  return <span className={`ed-pipeline-status-badge ed-pipeline-status-badge--${tone}`}>{label}</span>;
}

export type PipelineTimelineItem = {
  id: string;
  title: string;
  detail?: ReactNode;
  time?: string;
};

export function PipelineTimeline({ items }: { items: PipelineTimelineItem[] }) {
  return (
    <div className="ed-pipeline-timeline">
      {items.map((item, index) => (
        <div key={item.id} className="ed-pipeline-timeline__item">
          <span
            className={`ed-pipeline-timeline__dot${
              index === 0 ? " ed-pipeline-timeline__dot--active" : ""
            }`}
            aria-hidden
          />
          <div className="ed-pipeline-timeline__content">
            <p className="ed-pipeline-timeline__title">{item.title}</p>
            {item.detail ? <p className="ed-pipeline-timeline__detail">{item.detail}</p> : null}
            {item.time ? <p className="ed-pipeline-timeline__time">{item.time}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineDetailPanel({
  title,
  onBack,
  menu,
  children,
  footer,
}: {
  title: string;
  onBack?: () => void;
  menu?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="ed-pipeline-detail-panel">
      <div className="ed-pipeline-detail-panel__head">
        {onBack ? (
          <button type="button" className="ed-pipeline-detail-panel__back" onClick={onBack}>
            ← Back
          </button>
        ) : null}
        <h2 className="ed-pipeline-detail-panel__title">{title}</h2>
        {menu ? <div className="ed-pipeline-detail-panel__menu">{menu}</div> : null}
      </div>
      <div className="ed-pipeline-detail-panel__body">{children}</div>
      {footer ? <div className="ed-pipeline-detail-panel__footer">{footer}</div> : null}
    </div>
  );
}

/* ─── Backend catalog workspace (batches, curriculum groups) ─── */

export function CatalogBreadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="ed-catalog-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="ed-catalog-breadcrumbs__item">
          {index > 0 ? <span className="ed-catalog-breadcrumbs__sep" aria-hidden>›</span> : null}
          {item.href ? (
            <Link className="ed-catalog-breadcrumbs__link" to={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="ed-catalog-breadcrumbs__current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function CatalogPageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: {
  breadcrumbs?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ed-catalog-page-header">
      <div className="ed-catalog-page-header__copy">
        {breadcrumbs}
        <h1 className="ed-catalog-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-catalog-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-catalog-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function CatalogWorkspace({
  main,
  aside,
  asideOpen = true,
}: {
  main: ReactNode;
  aside?: ReactNode;
  asideOpen?: boolean;
}) {
  return (
    <div
      className={[
        "ed-catalog-workspace",
        aside ? "" : "ed-catalog-workspace--single",
        aside && asideOpen ? "ed-catalog-workspace--aside-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ed-catalog-workspace__main">{main}</div>
      {aside ? (
        <aside className={`ed-catalog-workspace__aside${asideOpen ? " is-open" : ""}`}>{aside}</aside>
      ) : null}
    </div>
  );
}

export function CatalogToolbar({
  tabs,
  meta,
}: {
  tabs: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="ed-catalog-toolbar">
      <div className="ed-catalog-toolbar__tabs">{tabs}</div>
      {meta ? <div className="ed-catalog-toolbar__meta">{meta}</div> : null}
    </div>
  );
}

export type CatalogAccent = "blue" | "purple" | "teal" | "rose";

export function CatalogEnrollmentBadge({
  label,
  tone,
}: {
  label: string;
  tone: "open" | "closed";
}) {
  return (
    <span className={`ed-catalog-enrollment-badge ed-catalog-enrollment-badge--${tone}`}>
      {tone === "open" ? <span className="ed-catalog-enrollment-badge__dot" aria-hidden /> : null}
      {label}
    </span>
  );
}

export function CatalogListCard({
  icon,
  accent = "blue",
  title,
  badge,
  meta,
  actions,
  onClick,
  selected,
}: {
  icon: ReactNode;
  accent?: CatalogAccent;
  title: string;
  badge?: ReactNode;
  meta: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const className = [
    "ed-catalog-list-card",
    `ed-catalog-list-card--${accent}`,
    onClick ? "ed-catalog-list-card--clickable" : "",
    selected ? "ed-catalog-list-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <span className="ed-catalog-list-card__icon" aria-hidden>
        {icon}
      </span>
      <div className="ed-catalog-list-card__body">
        <div className="ed-catalog-list-card__head">
          <strong className="ed-catalog-list-card__title">{title}</strong>
          {badge}
        </div>
        <div className="ed-catalog-list-card__meta">{meta}</div>
      </div>
      {actions ? <div className="ed-catalog-list-card__actions">{actions}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

export function CatalogFormPanel({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="ed-catalog-form-panel">
      <div className="ed-catalog-form-panel__head">
        {icon ? <span className="ed-catalog-form-panel__icon" aria-hidden>{icon}</span> : null}
        <div>
          <h2 className="ed-catalog-form-panel__title">{title}</h2>
          {description ? <p className="ed-catalog-form-panel__description">{description}</p> : null}
        </div>
      </div>
      <div className="ed-catalog-form-panel__body">{children}</div>
      {footer ? <div className="ed-catalog-form-panel__footer">{footer}</div> : null}
    </div>
  );
}

export function CatalogCreateSlot({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ed-catalog-create-slot" onClick={onClick}>
      <span className="ed-catalog-create-slot__icon" aria-hidden>
        +
      </span>
      <span>{label}</span>
    </button>
  );
}

export function CatalogFab({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ed-catalog-fab" aria-label={label} onClick={onClick}>
      +
    </button>
  );
}

/* ─── Backend settings workspace (center/brand account & profile) ─── */

export function SettingsPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="ed-settings-page-header">
      <h1 className="ed-settings-page-header__title">{title}</h1>
      {subtitle ? <p className="ed-settings-page-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function SettingsStack({ children }: { children: ReactNode }) {
  return <div className="ed-settings-stack">{children}</div>;
}

export function SettingsSection({
  title,
  mobileLabel,
  children,
  footer,
  className,
}: {
  title?: string;
  mobileLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={["ed-settings-section", className].filter(Boolean).join(" ")}>
      {mobileLabel ? <p className="ed-settings-section__mobile-label">{mobileLabel}</p> : null}
      {title ? <h2 className="ed-settings-section__title">{title}</h2> : null}
      <div className="ed-settings-section__body">{children}</div>
      {footer ? <div className="ed-settings-section__footer">{footer}</div> : null}
    </section>
  );
}

export function SettingsAccountLayout({
  photo,
  children,
}: {
  photo: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ed-settings-account-layout">
      <div className="ed-settings-account-layout__photo">{photo}</div>
      <div className="ed-settings-account-layout__fields">{children}</div>
    </div>
  );
}

export function SettingsMetaList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="ed-settings-meta-list">
      {items.map((item) => (
        <div key={item.label} className="ed-settings-meta-list__row">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SettingsProfileBanner({
  initials,
  title,
}: {
  initials: string;
  title: string;
}) {
  return (
    <div className="ed-settings-profile-banner">
      <span className="ed-settings-profile-banner__mark" aria-hidden>
        {initials}
      </span>
      <p className="ed-settings-profile-banner__title">{title}</p>
    </div>
  );
}

export function SettingsSubsection({
  label,
  children,
  cardOnMobile = false,
}: {
  label?: string;
  children: ReactNode;
  cardOnMobile?: boolean;
}) {
  return (
    <div
      className={[
        "ed-settings-subsection",
        cardOnMobile ? "ed-settings-subsection--card-mobile" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ? <h3 className="ed-settings-subsection__label">{label}</h3> : null}
      {children}
    </div>
  );
}

export function SettingsFormFooter({
  hint,
  children,
}: {
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="ed-settings-form-footer">
      {hint ? <p className="ed-settings-form-footer__hint">{hint}</p> : null}
      <div className="ed-settings-form-footer__actions">{children}</div>
    </div>
  );
}

export function SettingsPhoneField({
  label,
  countryCode,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  countryCode?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  const fullPhone = value.trim() ? `${countryCode ?? "+91"}${value.trim()}` : "";
  return (
    <label className={`ed-settings-phone-field${telHref(fullPhone) ? " ed-field--dialable" : ""}`} htmlFor={id}>
      <span className="ed-field__label">{label}</span>
      <div className="ed-settings-phone-field__row">
        <span className="ed-settings-phone-field__prefix" aria-hidden>
          {countryCode ?? "+91"}
        </span>
        <div className="ed-field__input-wrap ed-settings-phone-field__input-wrap">
          <input
            id={id}
            className="ed-field__input"
            type="tel"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          <PhoneDialButton phone={fullPhone} label={`Call ${fullPhone}`} />
        </div>
      </div>
    </label>
  );
}

export function SettingsMapsButton({
  label = "Verify on Google Maps",
  href,
}: {
  label?: string;
  href: string;
}) {
  return (
    <a className="ed-settings-maps-button" href={href} target="_blank" rel="noreferrer">
      <span className="ed-settings-maps-button__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </span>
      {label}
    </a>
  );
}

export function SettingsSocialField({
  platform,
  value,
  onChange,
  onRemove,
  removable,
}: {
  platform: string;
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const id = useId();
  const tone = platform.toLowerCase().replace(/[^a-z]/g, "");
  return (
    <div className={`ed-settings-social-field ed-settings-social-field--${tone}`}>
      <span className="ed-settings-social-field__icon" aria-hidden>
        {platform.charAt(0).toUpperCase()}
      </span>
      <label className="ed-settings-social-field__input-wrap" htmlFor={id}>
        <span className="ed-sr-only">{platform}</span>
        <input
          id={id}
          className="ed-field__input"
          type="url"
          value={value}
          placeholder={`${platform.toLowerCase()}.com/your-page`}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {removable && onRemove ? (
        <button type="button" className="ed-settings-social-field__remove" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

/* ─── Backend billing workspace (brand platform subscription) ─── */

export function BillingPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="ed-billing-page-header">
      {eyebrow ? <p className="ed-billing-page-header__eyebrow">{eyebrow}</p> : null}
      <h1 className="ed-billing-page-header__title">{title}</h1>
      {subtitle ? <p className="ed-billing-page-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function BillingStatusBadge({
  label,
  tone = "active",
}: {
  label: string;
  tone?: "active" | "draft" | "warning";
}) {
  return <span className={`ed-billing-status-badge ed-billing-status-badge--${tone}`}>{label}</span>;
}

export function BillingSubscriptionCard({
  icon,
  title = "Platform subscription",
  description,
  planName,
  statusBadge,
  priceLabel,
  action,
}: {
  icon?: ReactNode;
  title?: string;
  description: ReactNode;
  planName: string;
  statusBadge: ReactNode;
  priceLabel: string;
  action?: ReactNode;
}) {
  return (
    <section className="ed-billing-subscription-card">
      <div className="ed-billing-subscription-card__intro">
        <div className="ed-billing-subscription-card__intro-head">
          {icon ? <span className="ed-billing-subscription-card__icon">{icon}</span> : null}
          <div className="ed-billing-subscription-card__copy">
            <div className="ed-billing-subscription-card__title-row">
              <h2 className="ed-billing-subscription-card__title">{title}</h2>
              <span className="ed-billing-subscription-card__badge-mobile">{statusBadge}</span>
            </div>
            <p className="ed-billing-subscription-card__description">{description}</p>
          </div>
        </div>
      </div>
      <div className="ed-billing-subscription-card__meta">
        <div className="ed-billing-subscription-card__detail">
          <span>Plan</span>
          <strong className="ed-billing-subscription-card__plan">{planName}</strong>
        </div>
        <div className="ed-billing-subscription-card__detail ed-billing-subscription-card__detail--status">
          <span>Status</span>
          {statusBadge}
        </div>
        <div className="ed-billing-subscription-card__detail">
          <span>Price</span>
          <strong>{priceLabel}</strong>
        </div>
        {action ? <div className="ed-billing-subscription-card__action">{action}</div> : null}
      </div>
    </section>
  );
}

export function BillingInvoicesPanel({
  title = "Invoices",
  headIcon,
  emptyIcon,
  emptyTitle = "No invoices yet.",
  emptyDescription,
  isEmpty,
  children,
}: {
  title?: string;
  headIcon?: ReactNode;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  isEmpty: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="ed-billing-invoices-panel">
      <header className="ed-billing-invoices-panel__head">
        {headIcon ? <span className="ed-billing-invoices-panel__head-icon">{headIcon}</span> : null}
        <h2 className="ed-billing-invoices-panel__title">{title}</h2>
      </header>
      <div className="ed-billing-invoices-panel__body">
        {isEmpty ? (
          <div className="ed-billing-invoices-panel__empty">
            {emptyIcon ? <span className="ed-billing-invoices-panel__empty-icon">{emptyIcon}</span> : null}
            <p className="ed-billing-invoices-panel__empty-title">{emptyTitle}</p>
            {emptyDescription ? (
              <p className="ed-billing-invoices-panel__empty-description">{emptyDescription}</p>
            ) : null}
          </div>
        ) : (
          <div className="ed-billing-invoices-panel__list">{children}</div>
        )}
      </div>
    </section>
  );
}

export function BillingInvoiceRow({
  amount,
  meta,
  badge,
}: {
  amount: string;
  meta: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="ed-billing-invoice-row">
      <div className="ed-billing-invoice-row__main">
        <strong className="ed-billing-invoice-row__amount">{amount}</strong>
        <div className="ed-billing-invoice-row__meta">{meta}</div>
      </div>
      {badge ? <div className="ed-billing-invoice-row__badge">{badge}</div> : null}
    </div>
  );
}

export function BillingPromoGrid({ children }: { children: ReactNode }) {
  return <div className="ed-billing-promo-grid">{children}</div>;
}

export function BillingPromoCard({
  accent = "blue",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  accent?: "blue" | "purple";
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  actionLabel: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  const action =
    onAction ? (
      <button type="button" className="ed-billing-promo-card__action" onClick={onAction}>
        {actionLabel}
      </button>
    ) : actionHref ? (
      <Link to={actionHref} className="ed-billing-promo-card__action">
        {actionLabel}
      </Link>
    ) : (
      <span className="ed-billing-promo-card__action">{actionLabel}</span>
    );

  return (
    <article className={`ed-billing-promo-card ed-billing-promo-card--${accent}`}>
      {icon ? <span className="ed-billing-promo-card__icon">{icon}</span> : null}
      <h3 className="ed-billing-promo-card__title">{title}</h3>
      <p className="ed-billing-promo-card__description">{description}</p>
      {action}
    </article>
  );
}

export function BillingStack({ children }: { children: ReactNode }) {
  return <div className="ed-billing-stack">{children}</div>;
}
