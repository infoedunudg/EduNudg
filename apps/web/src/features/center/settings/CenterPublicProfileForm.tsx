import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormGrid,
  Input,
  MutationError,
  Select,
  SettingsFormFooter,
  SettingsMapsButton,
  SettingsPhoneField,
  SettingsProfileBanner,
  SettingsSection,
  SettingsSubsection,
  Textarea,
} from "@edunudg/ui";
import {
  type CenterPublicProfileInput,
  type CenterPublicProfileRow,
  updateCenterPublicProfile,
} from "@/lib/centerProfileApi";
import {
  formatSettingsLastEdited,
  googleMapsSearchUrl,
  INDIAN_STATES,
  joinIndiaPhone,
  splitIndiaPhone,
} from "@/lib/centerSettingsHelpers";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { initialsFromName } from "@/lib/welcomeMessage";
import { CenterPhotoUpload } from "./CenterPhotoUpload";
import "./centerSettings.css";

function profileToForm(row: CenterPublicProfileRow): Omit<CenterPublicProfileInput, "socialLinks"> & {
  phoneNational: string;
} {
  return {
    displayName: row.displayName,
    shortDescription: row.shortDescription,
    addressLine1: row.addressLine1,
    city: row.city,
    region: row.region,
    pincode: row.pincode,
    country: row.country || "IN",
    contactPhone: row.contactPhone,
    phoneNational: splitIndiaPhone(row.contactPhone),
    photoUrl: row.photoUrl,
  };
}

type Props = {
  brandId: string;
  centerId: string;
  profile: CenterPublicProfileRow;
};

export function CenterPublicProfileForm({ brandId, centerId, profile }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(() => profileToForm(profile));
  const [savedFlash, setSavedFlash] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profileToForm(profile));
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      setPhotoError(null);
      const { phoneNational, ...payload } = form;
      await updateCenterPublicProfile(centerId, {
        ...payload,
        contactPhone: joinIndiaPhone(phoneNational),
        socialLinks: profile.socialLinks,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-public-profile", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    },
    onError: capture,
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(profileToForm(profile));

  const bannerTitle = form.displayName.trim() || profile.name;
  const bannerInitials = initialsFromName(bannerTitle);
  const mapsUrl = useMemo(
    () =>
      googleMapsSearchUrl({
        addressLine1: form.addressLine1,
        city: form.city,
        region: form.region,
        pincode: form.pincode,
      }),
    [form.addressLine1, form.city, form.region, form.pincode]
  );
  const lastEdited = formatSettingsLastEdited(profile.updatedAt);

  const stateOptions = useMemo(() => {
    const values = Array.from(new Set([...INDIAN_STATES, form.region.trim()].filter(Boolean)));
    return [{ value: "", label: "Select state…" }, ...values.map((state) => ({ value: state, label: state }))];
  }, [form.region]);

  return (
    <SettingsSection title="Public Center Profile" mobileLabel="Public profile" className="ed-settings-section--profile">
      <SettingsProfileBanner initials={bannerInitials} title={bannerTitle} />

      <SettingsSubsection label="Public profile" cardOnMobile>
        <div className="ed-center-settings-page__mobile-photo">
          <CenterPhotoUpload
            brandId={brandId}
            centerId={centerId}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => {
              setPhotoError(null);
              setField("photoUrl", url);
            }}
            onError={setPhotoError}
            disabled={save.isPending}
            variant="mobile"
          />
        </div>
        <Input
          label="Display name"
          value={form.displayName}
          onChange={(value) => setField("displayName", value)}
          placeholder={profile.name}
        />
        <Textarea
          label="Short description"
          value={form.shortDescription}
          onChange={(value) => setField("shortDescription", value)}
          placeholder="A sentence about your center for parents"
          rows={4}
        />
      </SettingsSubsection>

      <SettingsSubsection label="Contact info" cardOnMobile>
        <SettingsPhoneField
          label="Phone number"
          value={form.phoneNational}
          onChange={(value) => setField("phoneNational", value)}
          placeholder="9876543210"
        />
        <Input
          label="Address line"
          value={form.addressLine1}
          onChange={(value) => setField("addressLine1", value)}
        />
        <FormGrid columns={2}>
          <Input label="City" value={form.city} onChange={(value) => setField("city", value)} />
          <Select
            label="State"
            value={form.region}
            onChange={(value) => setField("region", value)}
            options={stateOptions}
          />
        </FormGrid>
        <Input label="Pincode" value={form.pincode} onChange={(value) => setField("pincode", value)} />
        {mapsUrl ? <SettingsMapsButton href={mapsUrl} /> : null}
      </SettingsSubsection>

      <MutationError message={error || photoError} />
      <SettingsFormFooter hint={lastEdited ?? undefined}>
        <Button variant="ghost" onClick={resetForm} disabled={save.isPending}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : savedFlash ? "Saved" : "Save profile"}
        </Button>
      </SettingsFormFooter>
    </SettingsSection>
  );
}
