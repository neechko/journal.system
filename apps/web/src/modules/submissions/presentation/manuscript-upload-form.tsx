"use client";

import { useActionState } from "react";
import { uploadDraftManuscriptAction } from "./actions";
import { initialDraftSubmissionActionState } from "./action-state";

export function ManuscriptUploadForm({
  submissionId,
}: {
  submissionId: string;
}) {
  const [state, formAction, pending] = useActionState(
    uploadDraftManuscriptAction,
    initialDraftSubmissionActionState,
  );
  const fileInputId = `manuscript-file-${submissionId}`;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
    >
      <input name="submissionId" type="hidden" value={submissionId} />
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={fileInputId}
        >
          Manuscript PDF
        </label>
        <input
          accept=".pdf,application/pdf"
          className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-lime/50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-forest-deep"
          id={fileInputId}
          name="manuscript"
          required
          type="file"
        />
        <p className="mt-2 text-sm leading-6 text-muted">
          PDF only, up to 10 MB. Uploading another file adds a new version.
        </p>
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Uploading..." : "Upload manuscript"}
      </button>
      <p
        aria-live="polite"
        className={`min-h-5 text-sm ${
          state.status === "error" ? "text-red-700" : "text-forest"
        }`}
        role="status"
      >
        {state.message}
      </p>
    </form>
  );
}
