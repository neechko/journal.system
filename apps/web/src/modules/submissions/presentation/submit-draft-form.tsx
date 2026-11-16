"use client";

import { useActionState } from "react";
import { submitDraftSubmissionAction } from "./actions";
import { initialDraftSubmissionActionState } from "./action-state";

export function SubmitDraftForm({
  submissionId,
}: {
  submissionId: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitDraftSubmissionAction,
    initialDraftSubmissionActionState,
  );
  const confirmationId = `submission-confirmation-${submissionId}`;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
    >
      <input name="submissionId" type="hidden" value={submissionId} />
      <div className="flex items-start gap-3">
        <input
          className="mt-1 size-4 accent-forest"
          id={confirmationId}
          name="confirmation"
          required
          type="checkbox"
          value="confirm"
        />
        <label
          className="text-sm leading-6 text-muted"
          htmlFor={confirmationId}
        >
          I confirm that this manuscript is ready to be submitted to the
          journal for editorial consideration. I understand this draft will
          become read-only.
        </label>
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting..." : "Submit for editorial consideration"}
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
