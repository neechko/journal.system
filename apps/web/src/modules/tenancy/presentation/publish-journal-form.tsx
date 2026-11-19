"use client";

import { useActionState } from "react";
import { publishJournalAction } from "./actions";
import { initialActionState } from "./action-state";

export function PublishJournalForm({
  organizationId,
  journalId,
}: {
  organizationId: string;
  journalId: string;
}) {
  const [state, action, pending] = useActionState(
    publishJournalAction,
    initialActionState,
  );

  return (
    <form action={action} className="mt-5 space-y-4 border-t border-line pt-5">
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="journalId" type="hidden" value={journalId} />
      <label className="flex items-start gap-3 rounded-xl bg-paper p-4 text-sm leading-6 text-muted">
        <input
          className="mt-1 size-4 shrink-0 accent-forest"
          name="confirm"
          required
          type="checkbox"
          value="confirm"
        />
        <span>
          I understand that this journal page will be visible to the public
          after it is published.
        </span>
      </label>
      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor={`publish-reason-${journalId}`}>
          Audit reason
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id={`publish-reason-${journalId}`}
          maxLength={500}
          minLength={10}
          name="reason"
          required
          rows={2}
        />
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Publishing..." : "Publish journal page"}
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
