"use client";

import { useActionState } from "react";
import {
  createDraftSubmissionAction,
  updateDraftSubmissionAction,
} from "./actions";
import { initialDraftSubmissionActionState } from "./action-state";

type DraftSubmissionFormProps =
  | {
      mode: "create";
      organizationSlug: string;
      journalSlug: string;
    }
  | {
      mode: "edit";
      submissionId: string;
      title: string;
      abstract: string | null;
      keywords: string[];
    };

export function DraftSubmissionForm(props: DraftSubmissionFormProps) {
  const action = props.mode === "edit"
    ? updateDraftSubmissionAction
    : createDraftSubmissionAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialDraftSubmissionActionState,
  );
  const titleId =
    props.mode === "edit"
      ? `submission-title-${props.submissionId}`
      : "submission-title";
  const abstractId =
    props.mode === "edit"
      ? `submission-abstract-${props.submissionId}`
      : "submission-abstract";
  const keywordsId =
    props.mode === "edit"
      ? `submission-keywords-${props.submissionId}`
      : "submission-keywords";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
    >
      {props.mode === "edit" ? (
        <input
          name="submissionId"
          type="hidden"
          value={props.submissionId}
        />
      ) : (
        <>
          <input
            name="organizationSlug"
            type="hidden"
            value={props.organizationSlug}
          />
          <input name="journalSlug" type="hidden" value={props.journalSlug} />
        </>
      )}
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={titleId}
        >
          Working title
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id={titleId}
          maxLength={300}
          minLength={5}
          name="title"
          required
          defaultValue={props.mode === "edit" ? props.title : ""}
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={abstractId}
        >
          Abstract <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id={abstractId}
          maxLength={10_000}
          name="abstract"
          rows={8}
          defaultValue={
            props.mode === "edit" ? (props.abstract ?? "") : ""
          }
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={keywordsId}
        >
          Keywords{" "}
          <span className="font-normal text-muted">
            (optional, one per line)
          </span>
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
          id={keywordsId}
          maxLength={2048}
          name="keywords"
          rows={4}
          defaultValue={props.mode === "edit" ? props.keywords.join("\n") : ""}
        />
        <p className="mt-1 text-xs leading-5 text-muted">
          Up to 20 keywords, with a maximum of 100 characters each.
        </p>
      </div>
      <p className="text-sm leading-6 text-muted">
        This saves private draft metadata only. It does not submit a manuscript
        for editorial consideration.
      </p>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save draft"}
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
