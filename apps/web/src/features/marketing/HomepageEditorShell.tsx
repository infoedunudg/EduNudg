import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Button, EditorPageHeader, EditorSaveBar, EditorSectionCard, FormGrid, Input, MutationError, Select, Toggle } from "@edunudg/ui";
import type { MarketingTheme } from "@/types/homepage";
import type { PortalMode } from "@/lib/portalMode";
import type { HomepageSectionVisibility } from "@/lib/homepageSections";
import {
  CUSTOM_NAV_HREF_OPTION,
  marketingNavSectionOptions,
  normalizeMarketingNavHref,
  resolveNavHrefSelectValue,
} from "@/lib/marketingPublicSite";

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  lastSavedLabel?: string | null;
  actions?: ReactNode;
  onSave?: () => void;
  onDiscard?: () => void;
  isDirty?: boolean;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  children: ReactNode;
};

export type EditorSectionTone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

export type EditorSectionMeta = {
  icon: string;
  tone: EditorSectionTone;
  description: string;
};

/** Icons, tones, and subtitles for homepage editor accordions (Novu + Abacus). */
export const HOMEPAGE_EDITOR_SECTION_META: Record<string, EditorSectionMeta> = {
  site: { icon: "web_asset", tone: "secondary", description: "General metadata & branding" },
  navigation: { icon: "navigation", tone: "tertiary", description: "Menus, links and footer" },
  hero: { icon: "auto_awesome", tone: "primary", description: "Main banner content & media" },
  featureScroll: { icon: "grid_view", tone: "secondary", description: "Responsive feature grid items" },
  highlights: { icon: "view_carousel", tone: "neutral", description: "Featured content carousels" },
  testimonials: { icon: "format_quote", tone: "error", description: "Student & partner success stories" },
  faq: { icon: "help", tone: "neutral", description: "Common questions and answers" },
  privacyFooter: { icon: "shield", tone: "secondary", description: "Legal disclosures and footer layout" },
  featureGrid: { icon: "grid_view", tone: "secondary", description: "Why us feature blocks" },
  founders: { icon: "groups", tone: "primary", description: "Public mentors / leadership section" },
  upcomingEvents: { icon: "event", tone: "secondary", description: "Competitions, workshops, and demos" },
  about: { icon: "info", tone: "primary", description: "Company story, features, and team photos" },
  trustMedia: { icon: "play_circle", tone: "primary", description: "Trust stats and video" },
  gallery: { icon: "photo_library", tone: "neutral", description: "Photo gallery images" },
  programsGrid: { icon: "school", tone: "primary", description: "Program cards and Know More details" },
  curriculumSyllabus: { icon: "menu_book", tone: "primary", description: "Published syllabus at #curriculum" },
  footerRich: { icon: "call_to_action", tone: "neutral", description: "Rich footer and contact info" },
  legalPages: { icon: "gavel", tone: "secondary", description: "Privacy policy and terms uploads" },
  socialConnect: { icon: "share", tone: "secondary", description: "Footer Facebook and Instagram icons" },
  ecosystemIntro: { icon: "layers", tone: "secondary", description: "Intro band below hero" },
  connectivityShowcase: { icon: "devices", tone: "primary", description: "Phone showcase and satellite cards" },
  footerCta: { icon: "campaign", tone: "neutral", description: "Pre-footer call to action" },
  brandSignup: { icon: "person_add", tone: "primary", description: "Brand signup promo and form copy" },
};

/** Scroll accordion header into view after sibling panels collapse and layout settles. */
function scrollEditorAccordionIntoView(element: HTMLElement | null): void {
  if (!element) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/** When `isOpen` becomes true after a user click, scroll the section to the top of the viewport. */
function useScrollAccordionOnOpen(
  isOpen: boolean,
  sectionRef: RefObject<HTMLElement | null>
): () => void {
  const scrollOnOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !scrollOnOpenRef.current) return;
    scrollOnOpenRef.current = false;
    scrollEditorAccordionIntoView(sectionRef.current);
  }, [isOpen, sectionRef]);

  const markScrollOnOpen = useCallback(() => {
    scrollOnOpenRef.current = true;
  }, []);

  return markScrollOnOpen;
}

function MaterialIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="ed-ms-icon material-symbols-outlined"
      aria-hidden
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}

function sectionIcon(sectionId: string, filled?: boolean) {
  const meta = HOMEPAGE_EDITOR_SECTION_META[sectionId];
  return <MaterialIcon name={meta?.icon ?? "tune"} filled={filled} />;
}

/** Shared layout wrapper for platform and brand homepage editors. */
export function HomepageEditorShell({
  title,
  subtitle,
  lastSavedLabel,
  actions,
  onSave,
  onDiscard,
  isDirty = false,
  savePending,
  saved,
  saveLabel = "Save changes",
  children,
}: ShellProps) {
  return (
    <div
      className={[
        "ed-homepage-editor-shell",
        onSave ? "ed-homepage-editor-shell--has-save" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <EditorPageHeader title={title} subtitle={subtitle} lastSavedLabel={lastSavedLabel} />
      {actions}
      {children}
      {onSave ? (
        <EditorSaveBar
          isDirty={isDirty}
          onDiscard={onDiscard}
          onSave={onSave}
          savePending={savePending}
          saved={saved}
          saveLabel={saveLabel}
        />
      ) : null}
    </div>
  );
}

type PagePanelGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const PagePanelGroupContext = createContext<PagePanelGroupContextValue | null>(null);

/** Single-open accordion group for Brand / Center homepage panels (separate from section accordions). */
export function HomepageEditorPanels({
  children,
  defaultOpenId = null,
}: {
  children: ReactNode;
  defaultOpenId?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const value = useMemo(() => ({ openId, setOpenId }), [openId]);
  return (
    <PagePanelGroupContext.Provider value={value}>
      <div className="ed-homepage-editor-pages">{children}</div>
    </PagePanelGroupContext.Provider>
  );
}

type PanelProps = {
  panelId: string;
  title: string;
  description?: ReactNode;
  icon?: string;
  iconTone?: EditorSectionTone;
  onSave: () => void;
  onDiscard?: () => void;
  isDirty?: boolean;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  saveError?: string | null;
  /** When true and no page-panel group is present, start expanded. */
  defaultOpen?: boolean;
  children: ReactNode;
};

/** One editable site (brand or center template) as a themed accordion panel. */
export function HomepageEditorPanel({
  panelId,
  title,
  description,
  icon = "web",
  iconTone = "primary",
  onSave,
  onDiscard,
  isDirty = false,
  savePending,
  saved,
  saveLabel = "Save changes",
  saveError = null,
  defaultOpen = true,
  children,
}: PanelProps) {
  const group = useContext(PagePanelGroupContext);
  const bodyId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = group ? group.openId === panelId : localOpen;
  const toneClass = `ed-editor-accordion__icon--${iconTone === "error" ? "neutral" : iconTone}`;
  const markScrollOnOpen = useScrollAccordionOnOpen(isOpen, sectionRef);

  const toggle = useCallback(() => {
    if (group) {
      if (!isOpen) markScrollOnOpen();
      group.setOpenId(isOpen ? null : panelId);
      return;
    }
    if (!isOpen) markScrollOnOpen();
    setLocalOpen((open) => !open);
  }, [group, isOpen, markScrollOnOpen, panelId]);

  const descriptionText =
    typeof description === "string" || description == null ? description : undefined;

  return (
    <section
      ref={sectionRef}
      className={[
        "ed-homepage-editor-panel",
        "ed-editor-accordion",
        isOpen ? "ed-editor-accordion--open" : "",
        isDirty ? "ed-homepage-editor-panel--dirty" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isOpen ? (
        <button
          type="button"
          className="ed-editor-accordion__trigger"
          aria-expanded={false}
          aria-controls={bodyId}
          onClick={toggle}
        >
          <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
            <MaterialIcon name={icon} />
          </span>
          <span className="ed-editor-accordion__heading">
            <span className="ed-editor-accordion__title">
              {title}
              {isDirty ? <span className="ed-homepage-editor-panel__dirty-badge">Unsaved</span> : null}
            </span>
            {descriptionText ? (
              <span className="ed-editor-accordion__description">{descriptionText}</span>
            ) : description ? (
              <span className="ed-editor-accordion__description">{description}</span>
            ) : null}
          </span>
          <MaterialIcon name="add" />
        </button>
      ) : (
        <>
          <div className="ed-editor-accordion__open-header">
            <div className="ed-editor-accordion__open-title">
              <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
                <MaterialIcon name={icon} filled />
              </span>
              <div className="ed-homepage-editor-panel__open-copy">
                <h3 className="ed-editor-accordion__title">{title}</h3>
                {description ? <p className="ed-homepage-editor-panel__desc">{description}</p> : null}
              </div>
            </div>
            <div className="ed-editor-accordion__open-actions">
              {isDirty ? <span className="ed-homepage-editor-panel__dirty-badge">Unsaved</span> : null}
              <button
                type="button"
                className="ed-editor-accordion__collapse"
                aria-expanded
                aria-controls={bodyId}
                aria-label={`Collapse ${title}`}
                onClick={toggle}
              >
                <MaterialIcon name="remove" />
              </button>
            </div>
          </div>
          <div id={bodyId} className="ed-editor-accordion__body ed-homepage-editor-panel__body">
            {children}
            <MutationError message={saveError} />
            <EditorSaveBar
              isDirty={isDirty}
              onDiscard={onDiscard}
              onSave={onSave}
              savePending={savePending}
              saved={saved}
              saveLabel={saveLabel}
              inline
            />
          </div>
        </>
      )}
    </section>
  );
}

type EditorStaticSectionProps = {
  sectionId: string;
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
};

/** Always-visible section card wired to {@link HOMEPAGE_EDITOR_SECTION_META}. */
export function EditorStaticSection({ sectionId, title, headerAction, children }: EditorStaticSectionProps) {
  const meta = HOMEPAGE_EDITOR_SECTION_META[sectionId];
  const tone = meta?.tone === "error" ? "neutral" : (meta?.tone ?? "primary");
  return (
    <div data-editor-section={sectionId}>
      <EditorSectionCard
        icon={sectionIcon(sectionId, true)}
        iconTone={tone as "primary" | "secondary" | "tertiary" | "neutral"}
        title={title ?? sectionId}
        headerAction={headerAction}
      >
        {children}
      </EditorSectionCard>
    </div>
  );
}

type AccordionGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const AccordionGroupContext = createContext<AccordionGroupContextValue | null>(null);

/** Two-column field grid used inside homepage editor accordions (tablet+). */
export function EditorFieldsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="ed-editable-form">
      <FormGrid columns={2}>{children}</FormGrid>
    </div>
  );
}

/** Span both columns inside {@link EditorFieldsGrid}. */
export function EditorFieldSpan({ children }: { children: ReactNode }) {
  return <div className="ed-form-grid__full">{children}</div>;
}

/** Muted helper copy above repeatable editor blocks. */
export function EditorSectionNote({ children }: { children: ReactNode }) {
  return <p className="ed-text-sm ed-muted ed-editor-section-note">{children}</p>;
}

type EditorItemPanelProps = {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  variant?: "default" | "nav";
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
    onDragEnd: () => void;
  };
};

/** Card panel for one repeatable homepage item (nav link, FAQ, program card, etc.). */
export function EditorItemPanel({
  title,
  children,
  onRemove,
  removeLabel = "Remove item",
  className,
  variant = "default",
  dragHandleProps,
}: EditorItemPanelProps) {
  if (variant === "nav") {
    return (
      <div
        className={["ed-editor-nav-row", className].filter(Boolean).join(" ")}
        {...dragHandleProps}
      >
        <span className="ed-editor-nav-row__handle material-symbols-outlined" aria-hidden>
          drag_indicator
        </span>
        <div className="ed-editor-nav-row__fields">{children}</div>
        {onRemove ? (
          <button
            type="button"
            className="ed-editor-nav-row__remove"
            onClick={onRemove}
            aria-label={removeLabel}
          >
            <span className="material-symbols-outlined" aria-hidden>
              delete
            </span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={["ed-editor-item-panel", className].filter(Boolean).join(" ")}>
      <h4 className="ed-editor-item-panel__title">{title}</h4>
      {children}
      {onRemove ? (
        <div className="ed-editor-item-panel__remove">
          <Button variant="danger" onClick={onRemove}>
            {removeLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type EditorItemListProps = {
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
};

/** Vertical stack of {@link EditorItemPanel} rows with an optional primary add action. */
export function EditorItemList({ children, onAdd, addLabel, className }: EditorItemListProps) {
  return (
    <div className={["ed-editor-item-list", className].filter(Boolean).join(" ")}>
      {children}
      {onAdd && addLabel ? (
        <div className="ed-editor-item-list__add">
          <Button variant="primary" onClick={onAdd}>
            {addLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type EditorGroupedPanelProps = {
  title: string;
  note?: ReactNode;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  emptyLabel?: string;
  isEmpty?: boolean;
  actions?: ReactNode;
};

/** Dashed inset group (e.g. program benefits) with optional empty state and add action. */
export function EditorGroupedPanel({
  title,
  note,
  children,
  onAdd,
  addLabel,
  emptyLabel,
  isEmpty,
  actions,
}: EditorGroupedPanelProps) {
  return (
    <div className="ed-editor-grouped-panel">
      <p className="ed-editor-grouped-panel__head">{title}</p>
      {note ? <p className="ed-text-sm ed-muted ed-editor-grouped-panel__note">{note}</p> : null}
      {isEmpty && emptyLabel ? (
        <p className="ed-text-sm ed-muted ed-editor-grouped-panel__empty">{emptyLabel}</p>
      ) : null}
      {children}
      {actions ??
        (onAdd && addLabel ? (
          <div className="ed-editor-grouped-panel__actions">
            <Button variant="primary" onClick={onAdd}>
              {addLabel}
            </Button>
          </div>
        ) : null)}
    </div>
  );
}

type EditorSubItemProps = {
  children: ReactNode;
  onRemove: () => void;
  removeLabel?: string;
};

/** Nested item inside a grouped panel (e.g. one benefit bullet). */
export function EditorSubItem({ children, onRemove, removeLabel = "Remove" }: EditorSubItemProps) {
  return (
    <div className="ed-editor-sub-item">
      {children}
      <Button variant="danger" onClick={onRemove}>
        {removeLabel}
      </Button>
    </div>
  );
}

/** Single-open accordion list wrapper for homepage editor forms. */
export function HomepageEditorSections({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = { openId, setOpenId };
  return (
    <AccordionGroupContext.Provider value={value}>
      <div className="ed-homepage-editor">{children}</div>
    </AccordionGroupContext.Provider>
  );
}

type AccordionProps = {
  sectionId: string;
  title?: string;
  description?: string;
  icon?: string;
  iconTone?: EditorSectionTone;
  children: ReactNode;
  splitAside?: ReactNode;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

/** Collapsed-by-default section; only one open at a time inside HomepageEditorSections. */
export function EditorAccordion({
  sectionId,
  title: titleOverride,
  description: descriptionOverride,
  icon: iconOverride,
  iconTone: toneOverride,
  children,
  splitAside,
  enabled = true,
  onEnabledChange,
}: AccordionProps) {
  const group = useContext(AccordionGroupContext);
  const bodyId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const meta = HOMEPAGE_EDITOR_SECTION_META[sectionId];
  const title = titleOverride ?? sectionId;
  const description = descriptionOverride ?? meta?.description ?? "";
  const icon = iconOverride ?? meta?.icon ?? "tune";
  const tone = toneOverride ?? meta?.tone ?? "neutral";
  const isOpen = group?.openId === sectionId;
  const showToggle = onEnabledChange != null;
  const markScrollOnOpen = useScrollAccordionOnOpen(isOpen, sectionRef);

  const toggle = useCallback(() => {
    if (!group) return;
    if (!isOpen) markScrollOnOpen();
    group.setOpenId(isOpen ? null : sectionId);
  }, [group, isOpen, markScrollOnOpen, sectionId]);

  const toneClass = `ed-editor-accordion__icon--${tone}`;

  return (
    <section
      ref={sectionRef}
      data-editor-section={sectionId}
      className={[
        "ed-editor-accordion",
        isOpen ? "ed-editor-accordion--open" : "",
        splitAside ? "ed-editor-accordion--split" : "",
        showToggle && !enabled ? "ed-editor-accordion--section-off" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isOpen ? (
        <button
          type="button"
          className="ed-editor-accordion__trigger"
          aria-expanded={false}
          aria-controls={bodyId}
          onClick={toggle}
        >
          <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
            <MaterialIcon name={icon} />
          </span>
          <span className="ed-editor-accordion__heading">
            <span className="ed-editor-accordion__title">{title}</span>
            {description ? (
              <span className="ed-editor-accordion__description">{description}</span>
            ) : null}
          </span>
          <MaterialIcon name="add" />
        </button>
      ) : (
        <>
          <div className="ed-editor-accordion__open-header">
            <div className="ed-editor-accordion__open-title">
              <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
                <MaterialIcon name={icon} filled />
              </span>
              <h3 className="ed-editor-accordion__title">{title}</h3>
            </div>
            <div className="ed-editor-accordion__open-actions">
              {showToggle ? (
                <label className="ed-editor-accordion__visibility-label">
                  <span className="ed-editor-accordion__visibility-text">Visible on site</span>
                  <Toggle
                    checked={enabled}
                    onChange={onEnabledChange}
                    aria-label={`${title} visible on site`}
                  />
                </label>
              ) : null}
              <button
                type="button"
                className="ed-editor-accordion__collapse"
                aria-expanded
                aria-controls={bodyId}
                aria-label={`Collapse ${title}`}
                onClick={toggle}
              >
                <MaterialIcon name="remove" />
              </button>
            </div>
          </div>
          <div id={bodyId} className="ed-editor-accordion__body">
            {splitAside ? (
              <div className="ed-editor-accordion__split">
                <div className="ed-editor-accordion__split-aside">{splitAside}</div>
                <div className="ed-editor-accordion__split-main">{children}</div>
              </div>
            ) : (
              children
            )}
          </div>
        </>
      )}
    </section>
  );
}

export type NavLinkHrefFieldProps = {
  value: string;
  onChange: (href: string) => void;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
  sections?: HomepageSectionVisibility;
  label?: string;
};

/** Theme-aware nav target picker: preset section anchors + optional custom href. */
export function NavLinkHrefField({
  value,
  onChange,
  marketingTheme,
  portalMode,
  sections,
  label = "Link",
}: NavLinkHrefFieldProps) {
  const options = useMemo(
    () => marketingNavSectionOptions({ theme: marketingTheme, portalMode, sections }),
    [marketingTheme, portalMode, sections]
  );
  const selectValue = resolveNavHrefSelectValue(value, options);
  const isCustom = selectValue === CUSTOM_NAV_HREF_OPTION;

  return (
    <>
      <Select
        label={label}
        value={selectValue}
        onChange={(next) => {
          if (next === CUSTOM_NAV_HREF_OPTION) {
            onChange(normalizeMarketingNavHref(value) || "#");
            return;
          }
          onChange(next);
        }}
        options={options}
      />
      {isCustom ? (
        <Input
          label="Custom link"
          value={value}
          onChange={(next) => onChange(normalizeMarketingNavHref(next))}
        />
      ) : null}
    </>
  );
}
