"use client";

import { useActionState } from "react";
import { createJournalAction } from "./actions";
import { initialActionState } from "./action-state";

export function JournalForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(
    createJournalAction,
    initialActionState,
  );

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
          Journal setup
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink">Create a journal</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Journals are created as drafts. Review the profile before publishing.
        </p>
      </div>
      <input name="organizationId" type="hidden" value={organizationId} />
      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="journal-title">
          Journal title
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id="journal-title"
          maxLength={160}
          name="title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="journal-slug">
          URL slug
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id="journal-slug"
          maxLength={63}
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="journal-description">
          Description (optional)
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id="journal-description"
          maxLength={2000}
          name="description"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="journal-reason">
          Audit reason
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id="journal-reason"
          maxLength={500}
          minLength={10}
          name="reason"
          required
          rows={3}
        />
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Create journal draft"}
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
