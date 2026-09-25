import {
  CenterDetailHero,
  CenterDetailStatsRow,
  CenterMobileHeroBanner,
  CenterStatusBadge,
  CentersSectionCard,
  FormGrid,
  Input,
} from "@edunudg/ui";
import type { BrandStudentRow } from "@/lib/brandStudentsApi";
import { useSignedStorageUrl } from "@/hooks/useSignedStorageUrl";
import {
  displayOrDash,
  formatStudentDate,
  levelStatusLabel,
  studentInitials,
  studentStatusLabel,
  studentStatusTone,
} from "@/features/brand/students/brandStudentsHelpers";
import "./brandStudents.css";

type Props = {
  student: BrandStudentRow;
  isMobile: boolean;
};

const noop = (_value: string) => undefined;

export function BrandStudentDetailPanel({ student, isMobile }: Props) {
  const initials = studentInitials(student);
  const studentId = student.student_code ?? student.id.slice(0, 8).toUpperCase();
  const photoUrl = useSignedStorageUrl(student.photo_url);
  const status = (
    <CenterStatusBadge status={studentStatusTone(student)}>{studentStatusLabel(student)}</CenterStatusBadge>
  );

  return (
    <div className={`ed-brand-centers__detail${isMobile ? " ed-brand-centers__detail--mobile" : ""}`}>
      {isMobile ? (
        <CenterMobileHeroBanner
          initials={initials}
          imageUrl={photoUrl}
          title={student.full_name}
          slug={studentId}
          slugLabel="Student ID"
        />
      ) : (
        <CenterDetailHero
          initials={initials}
          imageUrl={photoUrl}
          title={student.full_name}
          franchiseId={studentId}
          idLabel="Student ID"
          status={status}
        />
      )}

      <CenterDetailStatsRow
        items={[
          { key: "franchise", label: "Franchise", value: student.center_name },
          { key: "city", label: "City", value: displayOrDash(student.center_city) },
          { key: "program", label: "Program", value: displayOrDash(student.program_name) },
          { key: "level", label: "Current level", value: displayOrDash(student.current_level_name) },
        ]}
      />

      <CentersSectionCard title="Contact">
        <FormGrid columns={2}>
          <Input label="Login email" type="email" value={displayOrDash(student.login_email)} onChange={noop} disabled />
          <Input label="Phone" type="tel" value={displayOrDash(student.phone)} onChange={noop} disabled />
          <Input label="Parent name" value={displayOrDash(student.parent_name)} onChange={noop} disabled />
          <Input label="Parent phone" type="tel" value={displayOrDash(student.parent_phone)} onChange={noop} disabled />
          <Input label="Parent email" type="email" value={displayOrDash(student.parent_email)} onChange={noop} disabled />
          <Input label="School" value={displayOrDash(student.school_name)} onChange={noop} disabled />
          <Input label="Address" value={displayOrDash(student.address_line1)} onChange={noop} disabled />
          <Input label="City" value={displayOrDash(student.city)} onChange={noop} disabled />
          <Input label="State" value={displayOrDash(student.state)} onChange={noop} disabled />
          <Input label="Pincode" value={displayOrDash(student.pincode)} onChange={noop} disabled />
          <Input label="Date of birth" value={formatStudentDate(student.date_of_birth)} onChange={noop} disabled />
          <Input
            label="Joined"
            value={formatStudentDate(student.enrollment_created_at)}
            onChange={noop}
            disabled
          />
        </FormGrid>
      </CentersSectionCard>

      <CentersSectionCard title="Curriculum">
        <FormGrid columns={2}>
          <Input label="Program" value={displayOrDash(student.program_name)} onChange={noop} disabled />
          <Input label="Starting level" value={displayOrDash(student.starting_level_name)} onChange={noop} disabled />
          <Input label="Current level" value={displayOrDash(student.current_level_name)} onChange={noop} disabled />
          <Input
            label="Batches"
            value={student.batch_names.length > 0 ? student.batch_names.join(", ") : "—"}
            onChange={noop}
            disabled
          />
        </FormGrid>
        {student.levels.length === 0 ? (
          <p className="ed-text-sm ed-muted ed-brand-student-empty">No curriculum levels assigned yet.</p>
        ) : (
          <div className="ed-brand-student-levels">
            {student.levels.map((level) => (
              <article
                key={level.level_id}
                className={`ed-brand-student-level${level.is_current ? " is-current" : ""}`}
              >
                <div>
                  <p className="ed-brand-student-level__title">
                    {level.abacus_level_code ? `${level.name} (${level.abacus_level_code})` : level.name}
                  </p>
                  <p className="ed-brand-student-level__meta">
                    {level.is_current ? "Current · " : ""}
                    {levelStatusLabel(level.status)}
                  </p>
                </div>
                <CenterStatusBadge status={level.status === "completed" ? "active" : level.is_current ? "pending" : "closed"}>
                  {levelStatusLabel(level.status).toUpperCase()}
                </CenterStatusBadge>
              </article>
            ))}
          </div>
        )}
      </CentersSectionCard>
    </div>
  );
}
