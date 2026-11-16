import type { JournalSummary } from "../application/ports";

type JournalProfilePreviewProps = {
  organizationName: string;
  journal: Pick<
    JournalSummary,
    "id" | "title" | "description" | "aimsScope" | "authorGuidelines"
  >;
};

export function JournalProfilePreview({
  organizationName,
  journal,
}: JournalProfilePreviewProps) {
  return (
    <details className="mt-5 border-t border-line pt-5">
      <summary className="w-fit cursor-pointer text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest">
        Preview saved profile
      </summary>
      <section
        aria-labelledby={`preview-title-${journal.id}`}
        className="mt-4 overflow-hidden rounded-2xl border border-line bg-white"
      >
        <header className="bg-forest p-5 text-white sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime">
            Private draft preview
          </p>
          <p className="mt-4 text-sm font-medium text-white/70">
            {organizationName}
          </p>
          <h4
            className="mt-2 font-display text-2xl leading-tight sm:text-3xl"
            id={`preview-title-${journal.id}`}
          >
            {journal.title}
          </h4>
          <p className="mt-3 text-sm leading-6 text-white/75">
            {journal.description || "No journal description has been saved yet."}
          </p>
        </header>
        <div className="space-y-6 p-5 sm:p-6">
          <section aria-labelledby={`preview-aims-${journal.id}`}>
            <h5
              className="font-display text-xl text-ink"
              id={`preview-aims-${journal.id}`}
            >
              Aims and scope
            </h5>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
              {journal.aimsScope ||
                "Aims and scope information has not been provided yet."}
            </p>
          </section>
          <section
            aria-labelledby={`preview-guidelines-${journal.id}`}
            className="border-t border-line pt-5"
          >
            <h5
              className="font-display text-xl text-ink"
              id={`preview-guidelines-${journal.id}`}
            >
              Author guidelines
            </h5>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
              {journal.authorGuidelines ||
                "Author guidelines have not been provided yet."}
            </p>
          </section>
          <p className="border-t border-line pt-4 text-xs leading-5 text-muted">
            This preview is private to your organization workspace. Publishing
            the journal remains a separate action.
          </p>
        </div>
      </section>
    </details>
  );
}
