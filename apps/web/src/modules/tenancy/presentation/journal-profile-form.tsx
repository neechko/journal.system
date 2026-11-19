"use client";

import { useActionState } from "react";
import { updateJournalProfileAction } from "./actions";
import { initialActionState } from "./action-state";

export function JournalProfileForm({
  organizationId,
  journalId,
  description,
  aimsScope,
  authorGuidelines,
  isPublished,
}: {
  organizationId: string;
  journalId: string;
  description: string | null;
  aimsScope: string | null;
  authorGuidelines: string | null;
  isPublished: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateJournalProfileAction,
    initialActionState,
  );
  const confirmation = isPublished
    ? "I understand these changes will immediately appear on the public journal page."
    : "I understand this information will be public after the journal page is published.";

  return (
    <form action={action} className="mt-5 space-y-5 border-t border-line pt-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
          Public content
        </p>
        <h4 className="mt-2 font-display text-xl text-ink">
          Public journal profile
        </h4>
      </div>
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="journalId" type="hidden" value={journalId} />
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={`journal-description-${journalId}`}
        >
          Journal description
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          defaultValue={description ?? ""}
          id={`journal-description-${journalId}`}
          maxLength={2000}
          name="description"
          rows={4}
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={`journal-aims-scope-${journalId}`}
        >
          Aims and scope
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          defaultValue={aimsScope ?? ""}
          id={`journal-aims-scope-${journalId}`}
          maxLength={5000}
          name="aimsScope"
          rows={5}
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={`journal-author-guidelines-${journalId}`}
        >
          Author guidelines
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          defaultValue={authorGuidelines ?? ""}
          id={`journal-author-guidelines-${journalId}`}
          maxLength={5000}
          name="authorGuidelines"
          rows={5}
        />
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-paper p-4 text-sm leading-6 text-muted">
        <input
          className="mt-1 size-4 shrink-0 accent-forest"
          name="confirm"
          required
          type="checkbox"
          value="confirm"
        />
        <span>{confirmation}</span>
      </label>
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={`journal-profile-reason-${journalId}`}
        >
          Audit reason
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id={`journal-profile-reason-${journalId}`}
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
        {pending ? "Saving..." : "Save profile"}
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
