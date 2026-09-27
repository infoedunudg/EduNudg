import { Input } from "@edunudg/ui";
import type { HomepageConfig, HomepageEventType, HomepageUpcomingEvent } from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import { eventPhotoUploadSubdir } from "@/lib/marketingMediaStorage";
import type { PortalMode } from "@/lib/portalMode";
import {
  emptyUpcomingEvent,
  emptyUpcomingEventsSection,
  HOMEPAGE_EVENT_TYPE_LABELS,
} from "@/lib/upcomingEvents";
import {
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  EditorSectionNote,
} from "./HomepageEditorShell";
import { MarketingMediaField } from "./MarketingMediaField";

type Props = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  commit: (config: HomepageConfig) => void;
  commitMedia: (config: HomepageConfig) => void;
  uploadScope: MarketingUploadScope;
  portalMode?: PortalMode;
};

export function UpcomingEventsEditorFields({
  config,
  onChange,
  commit,
  commitMedia,
  uploadScope,
  portalMode = "brand",
}: Props) {
  const section = config.upcomingEvents ?? emptyUpcomingEventsSection();

  return (
    <>
      <EditorSectionNote>
        Competitions, workshops, demos, and other events. Only upcoming dates (today or later) appear on the
        public homepage. The first event cover image is required; later covers, time, and duration are optional.
        Set max items to limit how many show.
        {portalMode === "center"
          ? " Center Site covers use a separate upload slot from Homepage — they will not overwrite each other."
          : null}
      </EditorSectionNote>
      <EditorFieldsGrid>
        <Input
          label="Eyebrow"
          value={section.eyebrow ?? ""}
          onChange={(v) => onChange({ ...config, upcomingEvents: { ...section, eyebrow: v } })}
        />
        <Input
          label="Section title"
          value={section.title ?? ""}
          onChange={(v) => onChange({ ...config, upcomingEvents: { ...section, title: v } })}
        />
        <EditorFieldSpan>
          <Input
            label="Subtitle"
            value={section.subtitle ?? ""}
            onChange={(v) => onChange({ ...config, upcomingEvents: { ...section, subtitle: v } })}
          />
        </EditorFieldSpan>
        <Input
          label="Max events to show (blank = all upcoming)"
          value={section.maxItems && section.maxItems > 0 ? String(section.maxItems) : ""}
          onChange={(v) => {
            const n = Number.parseInt(v, 10);
            onChange({
              ...config,
              upcomingEvents: {
                ...section,
                maxItems: Number.isFinite(n) && n > 0 ? n : undefined,
              },
            });
          }}
        />
      </EditorFieldsGrid>
      <EditorItemList
        onAdd={() =>
          commit({
            ...config,
            upcomingEvents: {
              ...section,
              items: [...(section.items ?? []), emptyUpcomingEvent()],
            },
          })
        }
        addLabel="+ Add event"
      >
        {(section.items ?? []).map((event, i) => (
          <UpcomingEventEditorItem
            key={`event-${i}`}
            event={event}
            index={i}
            config={config}
            onChange={onChange}
            uploadScope={uploadScope}
            portalMode={portalMode}
            onPersist={commitMedia}
            imageRequired={i === 0}
            onRemove={() =>
              commit({
                ...config,
                upcomingEvents: {
                  ...section,
                  items: (section.items ?? []).filter((_, idx) => idx !== i),
                },
              })
            }
          />
        ))}
      </EditorItemList>
    </>
  );
}

function UpcomingEventEditorItem({
  event,
  index,
  config,
  onChange,
  uploadScope,
  portalMode,
  onPersist,
  imageRequired = false,
  onRemove,
}: {
  event: HomepageUpcomingEvent;
  index: number;
  config: HomepageConfig;
  onChange: (c: HomepageConfig) => void;
  uploadScope: MarketingUploadScope;
  portalMode: PortalMode;
  onPersist: (c: HomepageConfig) => void;
  imageRequired?: boolean;
  onRemove: () => void;
}) {
  const section = config.upcomingEvents ?? emptyUpcomingEventsSection();
  const update = (patch: Partial<HomepageUpcomingEvent>) => {
    const items = [...(section.items ?? [])];
    items[index] = { ...event, ...patch };
    onChange({ ...config, upcomingEvents: { ...section, items } });
  };
  const persist = (patch: Partial<HomepageUpcomingEvent>) => {
    const items = [...(section.items ?? [])];
    items[index] = { ...event, ...patch };
    onPersist({ ...config, upcomingEvents: { ...section, items } });
  };

  return (
    <EditorItemPanel
      title={event.title?.trim() || `Event ${index + 1}`}
      onRemove={onRemove}
      removeLabel="Remove event"
    >
      <EditorFieldsGrid>
        <label className="ed-field">
          <span className="ed-field-label">Type</span>
          <select
            className="ed-input"
            value={event.type}
            onChange={(e) => update({ type: e.target.value as HomepageEventType })}
          >
            {(Object.keys(HOMEPAGE_EVENT_TYPE_LABELS) as HomepageEventType[]).map((key) => (
              <option key={key} value={key}>
                {HOMEPAGE_EVENT_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <Input label="Title" value={event.title} onChange={(title) => update({ title })} />
        <Input
          label="Start date"
          type="date"
          value={event.startDate}
          onChange={(startDate) => update({ startDate })}
        />
        <Input
          label="End date (optional)"
          type="date"
          value={event.endDate ?? ""}
          onChange={(endDate) => update({ endDate: endDate || undefined })}
        />
        <Input
          label="Start time (optional)"
          value={event.startTime ?? ""}
          onChange={(startTime) => update({ startTime: startTime || undefined })}
          placeholder="10:00 AM"
        />
        <Input
          label="End time (optional)"
          value={event.endTime ?? ""}
          onChange={(endTime) => update({ endTime: endTime || undefined })}
          placeholder="1:00 PM"
        />
        <Input
          label="Duration (optional)"
          value={event.duration ?? ""}
          onChange={(duration) => update({ duration: duration || undefined })}
          placeholder="2 hours"
        />
        <Input
          label="Location (optional)"
          value={event.location ?? ""}
          onChange={(location) => update({ location: location || undefined })}
        />
        <EditorFieldSpan>
          <Input
            label="Description (optional)"
            value={event.description ?? ""}
            onChange={(description) => update({ description: description || undefined })}
          />
        </EditorFieldSpan>
        <Input
          label="CTA label"
          value={event.ctaLabel ?? ""}
          onChange={(ctaLabel) => update({ ctaLabel: ctaLabel || undefined })}
        />
        <Input
          label="CTA link"
          value={event.ctaHref ?? ""}
          onChange={(ctaHref) => update({ ctaHref: ctaHref || undefined })}
          placeholder="enroll or https://…"
        />
        <EditorFieldSpan>
          <MarketingMediaField
            label={imageRequired ? "Cover image" : "Cover image (optional)"}
            value={event.imageUrl ?? ""}
            onChange={(imageUrl) => persist({ imageUrl: imageUrl || undefined })}
            mediaType="image"
            uploadSubdir={eventPhotoUploadSubdir(portalMode, index)}
            uploadScope={uploadScope}
            layout="hero"
            required={imageRequired}
          />
        </EditorFieldSpan>
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}
