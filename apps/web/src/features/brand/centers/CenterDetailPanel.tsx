import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CenterCurriculumToggleCard,
  CenterDetailFooter,
  CenterDetailHero,
  CenterDetailStatsRow,
  CenterMobileHeroBanner,
  CentersSectionCard,
  CenterStatusBadge,
  FormGrid,
  Input,
  MutationError,
  PasswordInput,
  SaveButton,
  Textarea,
} from "@edunudg/ui";
import { centerPortalUrl, portalBackendUrl, portalLoginUrl } from "@/lib/brandPortalUrl";
import {
  type BrandCenterRow,
  fetchCenterStats,
  setFranchiseCenterStatus,
  updateFranchiseCenter,
  softDeleteFranchiseCenter,
} from "@/lib/centerCentersApi";
import type { CenterPublicProfileInput } from "@/lib/centerProfileFields";
import {
  fetchCenterOwnerLoginEmail,
  shouldSyncCenterOwnerCredentials,
  upsertCenterOwnerCredentials,
} from "@/lib/centerOwnerCredentialsApi";
import { staffAuthPasswordError } from "@/lib/staffAuthPassword";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  fetchCenterAuthorizedProgramIds,
  setCenterCourseAuthorized,
} from "@/lib/centerCurriculumApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
import { CenterPhotoUpload } from "@/features/center/settings/CenterPhotoUpload";
import {
  centerFranchiseId,
  centerInitials,
  centerListTitle,
  centerStatsItems,
  centerStatusTone,
  programCurriculumSubtitle,
} from "@/features/brand/centers/brandCentersHelpers";
import "@/features/platform/brandDetailPage.css";

type FormState = Omit<CenterPublicProfileInput, "socialLinks"> & { name: string };

function centerToForm(center: BrandCenterRow): FormState {
  return {
    name: center.name,
    displayName: center.display_name ?? "",
    shortDescription: center.short_description ?? "",
    addressLine1: center.address_line1 ?? "",
    city: center.city ?? "",
    region: center.region ?? "",
    pincode: center.pincode ?? "",
    country: center.country ?? "IN",
    contactPhone: center.contact_phone ?? "",
    photoUrl: center.photo_url ?? "",
  };
}

type Props = {
  center: BrandCenterRow;
  brandId: string;
  brandSlug: string;
  isMobile: boolean;
  onStatusChanged: () => void;
  onDeleted?: () => void;
};

export function CenterDetailPanel({ center, brandId, brandSlug, isMobile, onStatusChanged, onDeleted }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const profileSaved = useSavedFlash();
  const [form, setForm] = useState(() => centerToForm(center));
  const [savedForm, setSavedForm] = useState(() => centerToForm(center));
  const [suspendMode, setSuspendMode] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [originalLoginEmail, setOriginalLoginEmail] = useState<string | null>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [loginFieldsTouched, setLoginFieldsTouched] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const next = centerToForm(center);
    setForm(next);
    setSavedForm(next);
    setSuspendMode(false);
    setSuspendReason("");
    setDeleteMode(false);
    setDeleteReason("");
  }, [center]);

  useEffect(() => {
    let cancelled = false;
    setCredentialsLoaded(false);
    setLoginFieldsTouched(false);
    setPassword("");
    void (async () => {
      try {
        const email = (await fetchCenterOwnerLoginEmail(center.id)) ?? "";
        if (!cancelled) {
          setOriginalLoginEmail(email || null);
          setLoginEmail(email);
        }
      } catch {
        if (!cancelled) {
          setOriginalLoginEmail(null);
          setLoginEmail("");
        }
      } finally {
        if (!cancelled) setCredentialsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [center.id]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (deleteMode && !dialog.open) dialog.showModal();
    if (!deleteMode && dialog.open) dialog.close();
  }, [deleteMode]);

  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [error]);

  const stats = useQuery({
    queryKey: ["brand-center-stats", center.id],
    queryFn: () => fetchCenterStats(center.id),
  });

  const programs = useQuery({
    queryKey: ["brand-programs-for-auth", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("programs")
        .select("id, name, age_label, description")
        .eq("brand_id", brandId)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as {
        id: string;
        name: string;
        age_label: string | null;
        description: string | null;
      }[];
    },
  });

  const authorizedProgramIds = useQuery({
    queryKey: ["center-program-auth", center.id],
    queryFn: () => fetchCenterAuthorizedProgramIds(center.id),
  });

  const authorizedSet = new Set(authorizedProgramIds.data ?? []);
  const title = centerListTitle(center);
  const initials = centerInitials(center);
  const centerBackendUrl = portalBackendUrl({ portalType: "center", brandSlug, centerSlug: center.slug });
  const centerLoginUrl = portalLoginUrl({ portalType: "center", brandSlug, centerSlug: center.slug });
  const centerFrontendUrl = centerPortalUrl(brandSlug, center.slug);
  const credentialsDirty =
    loginEmail.trim() !== (originalLoginEmail ?? "") || Boolean(password.trim());
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm) || credentialsDirty;

  const saveProfile = useMutation({
    mutationFn: async () => {
      clear();
      const shouldSyncCredentials = shouldSyncCenterOwnerCredentials({
        loginEmail,
        password,
        originalLoginEmail,
        credentialsLoaded,
        loginFieldsTouched,
      });

      if (shouldSyncCredentials) {
        if (!originalLoginEmail && !password.trim()) {
          throw new Error("Password required for a new franchise login");
        }
        const passwordError = staffAuthPasswordError(password);
        if (passwordError) throw new Error(passwordError);
      }

      await updateFranchiseCenter(center.id, {
        ...form,
        socialLinks: center.social_links,
      });

      // Profile-only saves must not invoke center-owner-credentials (edge 400s block unrelated edits).
      if (shouldSyncCredentials) {
        const { error: credErr } = await upsertCenterOwnerCredentials({
          centerId: center.id,
          brandId,
          email: loginEmail.trim(),
          password: password.trim() || undefined,
          fullName: form.name.trim() || center.name,
        });
        if (credErr) throw new Error(credErr);
      }
    },
    onSuccess: () => {
      setSavedForm(form);
      setPassword("");
      setOriginalLoginEmail(loginEmail.trim() || null);
      setLoginFieldsTouched(false);
      profileSaved.flash();
      void qc.invalidateQueries({ queryKey: ["centers", brandId] });
    },
    onError: capture,
  });

  const suspend = useMutation({
    mutationFn: async () => {
      clear();
      await setFranchiseCenterStatus(center.id, "suspended", suspendReason);
    },
    onSuccess: () => {
      setSuspendMode(false);
      onStatusChanged();
    },
    onError: capture,
  });

  const reEnable = useMutation({
    mutationFn: async () => {
      clear();
      await setFranchiseCenterStatus(center.id, "active");
    },
    onSuccess: onStatusChanged,
    onError: capture,
  });

  const removeFranchise = useMutation({
    mutationFn: async () => {
      clear();
      await softDeleteFranchiseCenter(center.id, deleteReason);
    },
    onSuccess: () => {
      setDeleteMode(false);
      onDeleted?.();
    },
    onError: capture,
  });

  const toggleProgram = useMutation({
    mutationFn: async ({ programId, enabled }: { programId: string; enabled: boolean }) => {
      clear();
      setPendingProgramId(programId);
      await setCenterCourseAuthorized(center.id, brandId, programId, enabled);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-program-auth", center.id] });
      void qc.invalidateQueries({ queryKey: ["authorized-programs", center.id] });
      void qc.invalidateQueries({ queryKey: ["course-impact"] });
    },
    onError: capture,
    onSettled: () => setPendingProgramId(null),
  });

  const closeDeleteDialog = () => {
    if (removeFranchise.isPending) return;
    setDeleteMode(false);
    setDeleteReason("");
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(savedForm);
    setLoginEmail(originalLoginEmail ?? "");
    setPassword("");
    setLoginFieldsTouched(false);
  };

  const portalLinks = (
    <div className="ed-center-detail-hero__portal-links">
      <a
        className="ed-center-detail-hero__frontend-link"
        href={centerFrontendUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Frontend ↗
      </a>
      <a
        className="ed-center-detail-hero__frontend-link"
        href={centerBackendUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Backend ↗
      </a>
    </div>
  );

  return (
    <div className={`ed-brand-centers__detail${isMobile ? " ed-brand-centers__detail--mobile" : ""}`}>
      {isMobile ? (
        <CenterMobileHeroBanner
          initials={initials}
          imageUrl={form.photoUrl}
          title={title}
          slug={center.slug}
          titleAction={portalLinks}
        />
      ) : (
        <CenterDetailHero
          initials={initials}
          imageUrl={form.photoUrl}
          title={title}
          franchiseId={centerFranchiseId(center)}
          status={<CenterStatusBadge status={centerStatusTone(center.status)} />}
          titleAction={portalLinks}
        />
      )}

      {stats.data ? (
        <CenterDetailStatsRow items={centerStatsItems(stats.data, centerBackendUrl)} />
      ) : null}

      <div ref={errorRef}>
        <MutationError message={error} />
      </div>

      {!isMobile ? null : (
        <div className="ed-brand-centers__mobile-photo">
          <CenterPhotoUpload
            brandId={brandId}
            centerId={center.id}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => setField("photoUrl", url)}
            disabled={saveProfile.isPending}
          />
        </div>
      )}

      <CentersSectionCard title="Franchise Identity">
        {!isMobile ? (
          <CenterPhotoUpload
            brandId={brandId}
            centerId={center.id}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => setField("photoUrl", url)}
            disabled={saveProfile.isPending}
          />
        ) : null}
        <FormGrid columns={isMobile ? 1 : 2}>
          <Input label="Franchise Owner" value={form.name} onChange={(v) => setField("name", v)} editable />
          <Input
            label="Display Name"
            value={form.displayName}
            onChange={(v) => setField("displayName", v)}
            placeholder={center.name}
            editable
          />
          <Input
            label="Login email"
            value={loginEmail}
            onChange={(v) => {
              setLoginFieldsTouched(true);
              setLoginEmail(v);
            }}
            type="email"
            editable
            disabled={!credentialsLoaded}
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(v) => {
              setLoginFieldsTouched(true);
              setPassword(v);
            }}
            placeholder={
              originalLoginEmail ? "Leave blank to keep current password" : "Required for new login"
            }
            disabled={!credentialsLoaded}
          />
        </FormGrid>
        <p className="ed-text-sm ed-muted">
          New or changed passwords must be at least 6 characters. The word <code>admin</code> is only 5 and
          Auth will reject it — use something like <code>admin1</code>.
        </p>
        <p className="ed-text-sm ed-muted">
          Franchise staff sign in with this email and password at{" "}
          {centerLoginUrl ? (
            <a href={centerLoginUrl} target="_blank" rel="noreferrer">
              <code>{centerLoginUrl.replace(/^https?:\/\//, "")}</code>
            </a>
          ) : (
            <code>
              {center.slug}.{brandSlug}.localhost:9000/login
            </code>
          )}
          .
        </p>
        <Textarea
          label="Short Description"
          value={form.shortDescription}
          onChange={(v) => setField("shortDescription", v)}
          rows={3}
          editable
        />
      </CentersSectionCard>

      <CentersSectionCard title="Location & Contact">
        <FormGrid columns={2}>
          <Input label="City" value={form.city} onChange={(v) => setField("city", v)} editable />
          <Input label="State" value={form.region} onChange={(v) => setField("region", v)} editable />
          <Input label="Pincode" value={form.pincode} onChange={(v) => setField("pincode", v)} editable />
          <Input label="Country" value={form.country} onChange={(v) => setField("country", v)} editable />
        </FormGrid>
        <Input
          label="Contact Phone"
          value={form.contactPhone}
          onChange={(v) => setField("contactPhone", v)}
          editable
        />
        {!isMobile ? (
          <Input label="Address" value={form.addressLine1} onChange={(v) => setField("addressLine1", v)} editable />
        ) : null}
      </CentersSectionCard>

      <CentersSectionCard title="Curriculum Assignment">
        {programs.isLoading || authorizedProgramIds.isLoading ? (
          <p className="ed-text-sm ed-muted">Loading curriculum…</p>
        ) : (programs.data ?? []).length === 0 ? (
          <p className="ed-text-sm ed-muted">
            Create a course on the Curriculum page before assigning it to franchises.
          </p>
        ) : (
          (programs.data ?? []).map((course) => {
            const checked = authorizedSet.has(course.id);
            const busy = pendingProgramId === course.id && toggleProgram.isPending;
            return (
              <CenterCurriculumToggleCard
                key={course.id}
                title={course.name}
                subtitle={programCurriculumSubtitle(course.age_label, course.description)}
                checked={checked}
                disabled={busy}
                onChange={(enabled) => toggleProgram.mutate({ programId: course.id, enabled })}
              />
            );
          })
        )}
      </CentersSectionCard>

      {suspendMode ? (
        <CentersSectionCard title="Disable franchise">
          <p className="ed-text-sm ed-muted">
            Disabling blocks center staff from /app and hides public registration. You can enable it again later.
          </p>
          <Input label="Reason (optional)" value={suspendReason} onChange={setSuspendReason} editable />
          <div className="ed-brand-centers__inline-actions">
            <Button onClick={() => suspend.mutate()} disabled={suspend.isPending}>
              {suspend.isPending ? "Disabling…" : "Confirm disable"}
            </Button>
            <Button variant="ghost" onClick={() => setSuspendMode(false)}>
              Cancel
            </Button>
          </div>
        </CentersSectionCard>
      ) : null}

      <dialog
        ref={deleteDialogRef}
        className="ed-import-dialog"
        aria-labelledby="delete-franchise-title"
        onClose={closeDeleteDialog}
        onClick={(event) => event.target === deleteDialogRef.current && closeDeleteDialog()}
      >
        <div className="ed-import-dialog__panel" role="document">
          <header className="ed-import-dialog__header">
            <h2 id="delete-franchise-title">Delete franchise</h2>
            <button
              type="button"
              className="ed-import-dialog__close"
              aria-label="Close"
              onClick={closeDeleteDialog}
            >
              ×
            </button>
          </header>
          <div className="ed-import-dialog__body">
            <p className="ed-import-dialog__intro">
              This removes <strong>{title}</strong> from Brand Backend and the public center site. Student and
              lead records are kept. This cannot be undone from this screen.
            </p>
            <Input label="Reason (optional)" value={deleteReason} onChange={setDeleteReason} editable />
          </div>
          <footer className="ed-import-dialog__footer">
            <Button variant="ghost" onClick={closeDeleteDialog} disabled={removeFranchise.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => removeFranchise.mutate()} disabled={removeFranchise.isPending}>
              {removeFranchise.isPending ? "Deleting…" : "Confirm delete"}
            </Button>
          </footer>
        </div>
      </dialog>

      {isMobile ? (
        <div className="ed-brand-centers__mobile-actions">
          <SaveButton
            onClick={() => saveProfile.mutate()}
            disabled={!form.name.trim() || saveProfile.isPending || !isDirty}
            pending={saveProfile.isPending}
            saved={profileSaved.saved}
            label="Save Changes"
            block
          />
          {center.status === "active" ? (
            <Button variant="danger" block onClick={() => setSuspendMode(true)}>
              Disable franchise
            </Button>
          ) : (
            <Button block onClick={() => reEnable.mutate()} disabled={reEnable.isPending}>
              {reEnable.isPending ? "Enabling…" : "Enable franchise"}
            </Button>
          )}
          <Button variant="secondary" block onClick={() => setDeleteMode(true)}>
            Delete franchise
          </Button>
        </div>
      ) : (
        <CenterDetailFooter
          suspendAction={
            center.status === "active" ? (
              <Button variant="danger" onClick={() => setSuspendMode(true)}>
                Disable franchise
              </Button>
            ) : (
              <Button onClick={() => reEnable.mutate()} disabled={reEnable.isPending}>
                {reEnable.isPending ? "Enabling…" : "Enable franchise"}
              </Button>
            )
          }
          deleteAction={
            <Button variant="secondary" onClick={() => setDeleteMode(true)}>
              Delete franchise
            </Button>
          }
          resetAction={
            <Button variant="ghost" onClick={resetForm} disabled={!isDirty}>
              Reset Changes
            </Button>
          }
          saveAction={
            <SaveButton
              onClick={() => saveProfile.mutate()}
              disabled={!form.name.trim() || saveProfile.isPending || !isDirty}
              pending={saveProfile.isPending}
              saved={profileSaved.saved}
              label="Save Changes"
            />
          }
        />
      )}
    </div>
  );
}
