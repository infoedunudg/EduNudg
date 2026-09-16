import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@edunudg/ui";
import {
  applyFranchiseCurriculumCatalog,
  applyFranchiseImportRpcErrors,
  downloadFranchiseCenterImportTemplate,
  formatFranchiseImportFailureSummary,
  FRANCHISE_CENTER_IMPORT_ACCEPT,
  parseCurriculumAssignmentCell,
  readFranchiseCenterImportFile,
  resolveCurriculumProgramIds,
  toRpcRow,
  type FranchiseCenterImportPreview,
  type FranchiseImportRowFailure,
} from "@/lib/franchiseCenterImportHelpers";
import { importFranchiseCenters } from "@/lib/franchiseCenterImportApi";
import { fetchBrandPrograms, syncCenterProgramEnablement } from "@/lib/centerProgramApi";

type Props = {
  brandId: string;
  brandSlug: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

function ImportStep({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <li className="ed-import-step">
      <span className="ed-import-step__badge" aria-hidden="true">
        {step}
      </span>
      <div className="ed-import-step__body">
        <div className="ed-import-step__copy">
          <span className="ed-import-step__title">{title}</span>
          {hint ? <span className="ed-import-step__hint">{hint}</span> : null}
        </div>
        {children ? <div className="ed-import-step__action">{children}</div> : null}
      </div>
    </li>
  );
}

function ImportPreviewTable({ preview }: { preview: FranchiseCenterImportPreview }) {
  if (preview.rows.length === 0) return null;
  const hasRowErrors = preview.rows.some((row) => row.errors.length > 0);

  return (
    <div className={hasRowErrors ? "ed-import-preview ed-import-preview--has-errors" : "ed-import-preview"}>
      <table className="ed-import-preview__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">URL</th>
            <th scope="col">Name</th>
            <th scope="col">City</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row) => (
            <tr key={row.rowNumber} className={row.errors.length ? "ed-import-preview__row--error" : undefined}>
              <td>{row.rowNumber}</td>
              <td>{row.values.center_slug ?? ""}</td>
              <td>{row.values.name ?? ""}</td>
              <td>{row.values.city ?? ""}</td>
              <td>{row.errors.length ? row.errors.join(" ") : "Ready"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FranchiseCenterImportDialog({ brandId, brandSlug, open, onClose, onImported }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FranchiseCenterImportPreview | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [rowFailures, setRowFailures] = useState<FranchiseImportRowFailure[]>([]);
  const [importSucceeded, setImportSucceeded] = useState(false);

  const programs = useQuery({
    queryKey: ["brand-programs-for-auth", brandId],
    enabled: open && !!brandId,
    queryFn: () => fetchBrandPrograms(brandId),
  });
  const programCatalog = programs.data ?? [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setUploadedFileName(null);
      setFileError(null);
      setSubmitError(null);
      setResultSummary(null);
      setRowFailures([]);
      setImportSucceeded(false);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleFileChange = async (file: File | null) => {
    setPreview(null);
    setUploadedFileName(null);
    setFileError(null);
    setSubmitError(null);
    setResultSummary(null);
    setRowFailures([]);

    if (!file) return;

    setUploadedFileName(file.name);

    const { preview: parsed, error } = await readFranchiseCenterImportFile(file);
    if (error || !parsed) {
      setFileError(error ?? "Could not read file.");
      return;
    }

    setPreview(applyFranchiseCurriculumCatalog(parsed, programCatalog));
  };

  const handleImport = async () => {
    if (!preview || preview.validRows.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);
    setResultSummary(null);
    setRowFailures([]);
    setImportSucceeded(false);

    const { result, error } = await importFranchiseCenters(
      brandId,
      preview.validRows.map((row) => toRpcRow(row))
    );

    if (error || !result) {
      setSubmitting(false);
      setSubmitError(error ?? "Import failed.");
      return;
    }

    for (const created of result.created) {
      const source = preview.validRows[created.row - 1];
      if (!source) continue;
      const names = parseCurriculumAssignmentCell(source.curriculum_assignment);
      const { ids } = resolveCurriculumProgramIds(names, programCatalog);
      if (ids.length === 0) continue;
      try {
        await syncCenterProgramEnablement(created.center_id, ids);
      } catch (assignErr) {
        setSubmitting(false);
        setSubmitError(
          assignErr instanceof Error ? assignErr.message : "Centers imported, but curriculum assignment failed."
        );
        return;
      }
    }

    setSubmitting(false);

    const createdCount = result.created.length;
    const errorCount = result.errors.length;

    if (errorCount > 0) {
      const applied = applyFranchiseImportRpcErrors(preview, result.errors);
      setPreview(applied.preview);
      setRowFailures(applied.failures);
      setSubmitError(formatFranchiseImportFailureSummary(applied.failures));
      if (createdCount > 0) {
        setResultSummary(
          `Imported ${createdCount} center${createdCount === 1 ? "" : "s"}. ${errorCount} row${errorCount === 1 ? "" : "s"} still need fixes.`
        );
        onImported();
      }
      return;
    }

    if (createdCount > 0) {
      setResultSummary(`Imported ${createdCount} franchise center${createdCount === 1 ? "" : "s"}.`);
      setImportSucceeded(true);
      onImported();
      window.setTimeout(() => onClose(), 1500);
      return;
    }

    setSubmitError("Import failed.");
  };

  const validCount = preview?.validRows.length ?? 0;
  const invalidCount = preview ? preview.rows.length - validCount : 0;

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog"
      aria-labelledby="franchise-import-title"
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <h2 id="franchise-import-title">Import franchise centers</h2>
          <button type="button" className="ed-import-dialog__close" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <div className="ed-import-dialog__body">
          {importSucceeded ? (
            <p className="ed-import-dialog__success" role="status">
              {resultSummary}
            </p>
          ) : (
            <>
              <p className="ed-import-dialog__intro">
                Bulk onboard centers for <strong>{brandSlug}</strong>. CSV or Excel · max 500 rows · 2 MB. Reimporting the same Franchise Owner name updates that franchise and makes it active again if it was deleted.
              </p>

              <ol className="ed-import-steps" aria-label="Import steps">
                <ImportStep step={1} title="Download the format" hint="Template with headers and sample row.">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void downloadFranchiseCenterImportTemplate(brandSlug, programCatalog.map((p) => p.name))}
                  >
                    Download template
                  </Button>
                </ImportStep>

                <ImportStep
                  step={2}
                  title="Add your data"
                  hint="Required: Owner Name, city. Optional: proposed_franchise_name (Display Name), state, country (default IN), address, pincode, mobile_number, owner_email, curriculum_assignment."
                />

                <ImportStep step={3} title="Upload franchise data" hint={uploadedFileName ? `Selected: ${uploadedFileName}` : "Save as .csv, .xlsx, or .xls, then upload."}>
                  <label className="ed-import-dialog__file-label">
                    <span className="ed-btn ed-btn--secondary">Upload Franchise Data</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={FRANCHISE_CENTER_IMPORT_ACCEPT}
                      className="ed-import-dialog__file-input"
                      onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </ImportStep>

                {preview ? (
                  <ImportStep
                    step={4}
                    title="Review and import"
                    hint={`${validCount} ready${invalidCount > 0 ? ` · ${invalidCount} with errors` : ""}`}
                  />
                ) : null}
              </ol>

              {fileError ? (
                <div className="ed-import-dialog__errors" role="alert">
                  <p>{fileError}</p>
                </div>
              ) : null}
              {preview ? (
                <>
                  <ImportPreviewTable preview={preview} />
                  {submitError || rowFailures.length > 0 ? (
                    <div className="ed-import-dialog__errors" role="alert">
                      {submitError ? <p>{submitError}</p> : null}
                      {rowFailures.length > 0 ? (
                        <ul>
                          {rowFailures.map((failure) => (
                            <li key={`${failure.rowNumber}-${failure.message}`}>
                              Spreadsheet row {failure.rowNumber}: {failure.message}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                  {resultSummary && !importSucceeded ? (
                    <p className="ed-import-dialog__note" role="status">
                      {resultSummary}
                    </p>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>

        {!importSucceeded ? (
          <footer className="ed-import-dialog__footer">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            {preview ? (
              <Button type="button" onClick={() => void handleImport()} disabled={submitting || validCount === 0}>
                {submitting ? "Importing…" : `Import ${validCount} center${validCount === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
