import { useRef, useState } from "react";
import {
  CurriculumBannerDropzone,
  CurriculumBuilderHeader,
  CurriculumCourseEditorHero,
  CurriculumGeneralInfoCard,
  CurriculumMediaIcon,
  CurriculumSectionCard,
  CurriculumStatChip,
  CurriculumVideoPreview,
  FormGrid,
  Input,
  MutationError,
  SaveButton,
  Textarea,
  Toggle,
} from "@edunudg/ui";
import type { CurriculumProgram, ProgramMarketingInput } from "@/lib/curriculumApi";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";
import { curriculumBannerUploadHint, curriculumProgramMediaSubdir } from "@/lib/marketingMediaStorage";
import { CurriculumLevelPanel } from "@/features/brand/curriculum/CurriculumLevelPanel";
import { CourseParentMarketingFields, type LevelForm } from "@/features/brand/curriculum/curriculumForms";
import type { CurriculumLevel, CourseImpactStats } from "@/lib/curriculumApi";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import {
  courseAvatarTone,
  courseInitials,
  courseStatus,
  editorCourseDescription,
  editorCourseTitle,
  impactStatChips,
} from "@/features/brand/curriculum/curriculumBrandHelpers";

type Props = {
  brandId: string;
  course: CurriculumProgram;
  courseIndex: number;
  impact?: CourseImpactStats;
  levels: CurriculumLevel[];
  unitCounts: Record<string, number>;
  editCourse: ProgramMarketingInput;
  onEditCourseChange: (v: ProgramMarketingInput) => void;
  onSaveCourse: () => void;
  saveCoursePending: boolean;
  saveCourseSaved?: boolean;
  onArchiveCourse: () => void;
  onToggleActive?: (isActive: boolean) => void;
  toggleActivePending?: boolean;
  selectedLevelId: string | null;
  onSelectLevel: (id: string | null) => void;
  addLevel: LevelForm;
  onAddLevelChange: (v: LevelForm) => void;
  editLevel: LevelForm;
  onEditLevelChange: (v: LevelForm) => void;
  onCreateLevel: () => void;
  createLevelPending: boolean;
  onUpdateLevel: (id: string) => void;
  updateLevelPending: boolean;
  updateLevelSaved?: boolean;
  onDeleteLevel: (id: string) => void;
  onReorderLevels: (ordered: CurriculumLevel[]) => void;
  reorderPending: boolean;
  onError: (err: unknown) => void;
  levelCloser: ReturnType<typeof useAddFormCloser>;
  requestAddProgram?: boolean;
  readOnly?: boolean;
  layout?: "builder" | "legacy";
  showPageHeader?: boolean;
};

export function CurriculumCourseDetail({
  brandId,
  course,
  courseIndex,
  impact,
  levels,
  unitCounts,
  editCourse,
  onEditCourseChange,
  onSaveCourse,
  saveCoursePending,
  saveCourseSaved = false,
  onToggleActive,
  toggleActivePending = false,
  selectedLevelId,
  onSelectLevel,
  addLevel,
  onAddLevelChange,
  editLevel,
  onEditLevelChange,
  onCreateLevel,
  createLevelPending,
  onUpdateLevel,
  updateLevelPending,
  updateLevelSaved = false,
  onDeleteLevel,
  onReorderLevels,
  reorderPending,
  onError,
  levelCloser,
  requestAddProgram = false,
  readOnly = false,
  layout = "builder",
  showPageHeader = false,
}: Props) {
  const bannerInputRef = useRef<HTMLDivElement>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const uploadScope = { kind: "brand" as const, brandId };
  const status = courseStatus(course);
  const statChips = impact ? impactStatChips(impact) : [];

  if (layout === "legacy") {
    return null;
  }

  const hero = (
    <CurriculumCourseEditorHero
      initials={courseInitials(course.name)}
      tone={courseAvatarTone(courseIndex)}
      title={editorCourseTitle(course.name)}
      status={status}
      description={editorCourseDescription(course.name)}
      embedded
      liveToggle={
        !readOnly && onToggleActive ? (
          <Toggle
            checked={course.is_active}
            disabled={toggleActivePending}
            aria-label={course.is_active ? `Turn ${course.name} off` : `Turn ${course.name} on`}
            onChange={onToggleActive}
          />
        ) : null
      }
      saveAction={
        !readOnly ? (
          <SaveButton
            onClick={onSaveCourse}
            pending={saveCoursePending}
            saved={saveCourseSaved}
            disabled={!editCourse.name.trim()}
            label="Save"
          />
        ) : null
      }
    />
  );

  return (
    <div className="ed-curriculum-brand__editor">
      {showPageHeader ? (
        <CurriculumBuilderHeader
          variant="detail"
          title="Curriculum Builder"
          subtitle="Structure courses, programs, and chapters for your franchise network."
        />
      ) : null}

      <CurriculumGeneralInfoCard
        hero={hero}
        stats={
          statChips.length > 0 ? (
            <>
              {statChips.map((chip) => (
                <CurriculumStatChip key={chip}>{chip}</CurriculumStatChip>
              ))}
            </>
          ) : null
        }
      >
        <div className="ed-editable-form">
          <FormGrid columns={2}>
            <Input
              label="Course Name"
              value={editCourse.name}
              onChange={(name) => onEditCourseChange({ ...editCourse, name })}
              editable={!readOnly}
            />
            <Input
              label="Age / Grade Badge"
              value={editCourse.ageLabel}
              onChange={(ageLabel) => onEditCourseChange({ ...editCourse, ageLabel })}
              placeholder="Level 1 to 8"
              editable={!readOnly}
            />
          </FormGrid>
          <Textarea
            label="Short Description (Card Blurb)"
            value={editCourse.description}
            onChange={(description) => onEditCourseChange({ ...editCourse, description })}
            rows={4}
            editable={!readOnly}
          />
        </div>
      </CurriculumGeneralInfoCard>

      <CurriculumSectionCard icon={<CurriculumMediaIcon />} title="Course Media & Visuals">
        <div className="ed-curriculum-brand__media-grid">
          <div>
            <p className="ed-field__label">Preview Video</p>
            <CurriculumVideoPreview
              url={editCourse.videoUrl}
              onDelete={
                !readOnly && editCourse.videoUrl
                  ? () => onEditCourseChange({ ...editCourse, videoUrl: "" })
                  : undefined
              }
            />
            <Input
              label="Preview Video Link"
              value={editCourse.videoUrl}
              onChange={(videoUrl) => onEditCourseChange({ ...editCourse, videoUrl })}
              placeholder="https://…"
              editable={!readOnly}
            />
          </div>
          <div>
            <p className="ed-field__label">Course Banner (Thumbnail)</p>
            <CurriculumBannerDropzone
              imageUrl={editCourse.marketingImageUrl}
              hint={curriculumBannerUploadHint()}
              uploading={bannerUploading}
              onUploadClick={() => {
                const input = bannerInputRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
                input?.click();
              }}
            />
            <MutationError message={bannerError} />
            <div className="ed-curriculum-brand__hidden-media" ref={bannerInputRef}>
              <MarketingMediaField
                label="Course Banner (Thumbnail)"
                value={editCourse.marketingImageUrl}
                onChange={(marketingImageUrl) => {
                  setBannerError(null);
                  onEditCourseChange({ ...editCourse, marketingImageUrl });
                }}
                onError={setBannerError}
                onPendingChange={setBannerUploading}
                showInlineError={false}
                mediaType="image"
                uploadSubdir={curriculumProgramMediaSubdir(course.id)}
                uploadScope={uploadScope}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      </CurriculumSectionCard>

      <CurriculumSectionCard
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3 4 7v10l8 4 8-4V7l-8-4z" />
            <path d="M12 7v14" />
            <path d="m8 9 8 4" />
          </svg>
        }
        title="Benefits & outcomes"
      >
        <div className="ed-editable-form">
          <CourseParentMarketingFields value={editCourse} onChange={onEditCourseChange} readOnly={readOnly} />
        </div>
      </CurriculumSectionCard>

      <CurriculumLevelPanel
        brandId={brandId}
        levels={levels}
        unitCounts={unitCounts}
        canEdit={!readOnly}
        selectedLevelId={selectedLevelId}
        onSelectLevel={onSelectLevel}
        addLevel={addLevel}
        onAddLevelChange={onAddLevelChange}
        editLevel={editLevel}
        onEditLevelChange={onEditLevelChange}
        onCreateLevel={onCreateLevel}
        createPending={createLevelPending}
        onUpdateLevel={onUpdateLevel}
        updatePending={updateLevelPending}
        updateSaved={updateLevelSaved}
        onDeleteLevel={onDeleteLevel}
        onReorderLevels={onReorderLevels}
        reorderPending={reorderPending}
        onError={onError}
        levelCloser={levelCloser}
        requestAddProgram={requestAddProgram}
        layout="builder"
      />
    </div>
  );
}

export function CurriculumCourseDetailPlaceholder() {
  return (
    <div className="ed-curriculum-brand__editor-placeholder">
      <p className="ed-text-sm ed-muted">Select a course to manage programs and chapters.</p>
    </div>
  );
}
