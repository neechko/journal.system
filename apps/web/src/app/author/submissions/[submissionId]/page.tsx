import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { AuthorAccessState } from "@/modules/submissions/presentation/author-access-state";
import { DraftSubmissionForm } from "@/modules/submissions/presentation/draft-submission-form";
import { ManuscriptUploadForm } from "@/modules/submissions/presentation/manuscript-upload-form";
import { SubmitDraftForm } from "@/modules/submissions/presentation/submit-draft-form";
import {
  getSubmissionForAuthor,
  listManuscriptsForAuthor,
} from "@/modules/submissions/application/use-cases";
import { createPostgresSubmissionRepository } from "@/modules/submissions/infrastructure/postgres-repository";
import { isLocalPrivateSubmissionStorageEnabled } from "@/modules/submissions/infrastructure/local-private-storage";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submission details",
  robots: { index: false, follow: false },
};

export default async function EditSubmissionDraftPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  if (!z.uuid().safeParse(submissionId).success) {
    notFound();
  }

  if (!isOidcConfigured) {
    return (
      <AuthorAccessState
        heading="The author workspace is not enabled yet."
        message="Configure the institutional OIDC provider before viewing private submission metadata. Demo accounts and authentication shortcuts are not available."
      />
    );
  }

  const actorUserId = (await auth())?.user?.id;
  if (!actorUserId) {
    const callbackUrl = `/author/submissions/${submissionId}`;
    return (
      <AuthorAccessState
        heading="Sign in to view this submission draft."
        message="Only the authenticated author can view or edit private draft metadata."
        signInHref={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      />
    );
  }

  const repository = createPostgresSubmissionRepository(getDatabase());
  const submission = await getSubmissionForAuthor(
    repository,
    actorUserId,
    submissionId,
  );
  if (!submission) {
    notFound();
  }

  const manuscripts = await listManuscriptsForAuthor(
    repository,
    actorUserId,
    submission.id,
  );
  const localStorageEnabled = isLocalPrivateSubmissionStorageEnabled();
  const uploadedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <Link className="hover:text-forest" href="/author/submissions">
            My submissions
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">
            {submission.status === "submitted"
              ? "Submission details"
              : "Edit draft"}
          </span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            {submission.organizationName} · {submission.journalTitle}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {submission.status === "submitted"
              ? "Submission details"
              : "Edit submission draft"}
          </h1>
          <p className="mt-4 leading-7 text-muted">
            {submission.status === "submitted"
              ? `Submitted for editorial consideration${
                  submission.submittedAt
                    ? ` on ${uploadedDate.format(submission.submittedAt)}`
                    : ""
                }. Editorial screening and review are not available yet.`
              : "This record is private to your account and has not been submitted for editorial consideration."}
          </p>
        </header>

        {submission.status === "draft" ? (
          <section className="mt-8 max-w-3xl">
            <DraftSubmissionForm
              abstract={submission.abstract}
              keywords={submission.keywords}
              mode="edit"
              submissionId={submission.id}
              title={submission.title}
            />
          </section>
        ) : (
          <section className="mt-8 max-w-3xl space-y-3 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl text-ink">
              Submitted manuscript
            </h2>
            <p className="text-sm font-semibold text-ink">
              {submission.title}
            </p>
            {submission.keywords.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-ink">Keywords</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {submission.keywords.map((keyword, index) => (
                    <li
                      className="rounded-full bg-paper px-3 py-1 text-xs text-muted"
                      key={`${keyword}-${index}`}
                    >
                      {keyword}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted">No keywords were provided.</p>
            )}
            <p className="text-sm text-muted">
              {submission.submittedManuscriptVersion
                ? `Manuscript version ${submission.submittedManuscriptVersion} was submitted.`
                : "Submitted manuscript version is unavailable."}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
              {submission.abstract ?? "No abstract was provided."}
            </p>
            <p className="text-sm leading-6 text-muted">
              Submitted records are read-only. Contact the journal through its
              published author guidelines for questions about next steps.
            </p>
          </section>
        )}

        <section
          aria-labelledby="manuscript-files-heading"
          className="mt-10 max-w-3xl space-y-5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Draft files
            </p>
            <h2
              className="mt-2 font-display text-3xl leading-tight text-ink"
              id="manuscript-files-heading"
            >
              Manuscript PDF
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {submission.status === "submitted"
                ? "The submitted manuscript files remain private and available to your account."
                : "Adding a file keeps this record in draft. It does not submit the manuscript or start editorial review."}
            </p>
          </div>

          {manuscripts.length > 0 ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-5 shadow-sm">
              {manuscripts.map((manuscript) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                  key={manuscript.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Manuscript version {manuscript.version}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      PDF · {Math.ceil(manuscript.byteSize / 1024)} KB ·
                      {" "}Uploaded {uploadedDate.format(manuscript.uploadedAt)}
                    </p>
                  </div>
                  {localStorageEnabled ? (
                    <Link
                      className="inline-flex min-h-10 items-center text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                      href={`/api/author/submissions/${submission.id}/manuscripts/${manuscript.id}`}
                    >
                      Download
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">
                      Private storage is disabled
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-5 text-sm leading-6 text-muted">
              No manuscript files have been added to this submission.
            </p>
          )}

          {submission.status === "draft" && localStorageEnabled ? (
            <>
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-6 text-ink">
                Local development storage is unencrypted and does not scan for
                malware. Use synthetic test PDFs only; do not upload real or
                confidential manuscripts.
              </p>
              <ManuscriptUploadForm submissionId={submission.id} />
            </>
          ) : submission.status === "draft" ? (
            <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
              Upload is disabled. For local synthetic-data testing only, set
              {" "}<code>LOCAL_PRIVATE_STORAGE_ENABLED=true</code> before
              starting the development server. Production remains disabled.
            </p>
          ) : (
            <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
              Submitted records cannot be changed in this author workspace.
            </p>
          )}

          {submission.status === "draft" &&
          localStorageEnabled &&
          manuscripts.length > 0 ? (
            <section aria-labelledby="submit-draft-heading" className="space-y-3">
              <h2
                className="font-display text-2xl text-ink"
                id="submit-draft-heading"
              >
                Ready to submit?
              </h2>
              <p className="text-sm leading-6 text-muted">
                Submission locks this draft and its attached files. You can
                review the current manuscript version above before continuing.
              </p>
              <SubmitDraftForm submissionId={submission.id} />
            </section>
          ) : null}

          {submission.status === "draft" && manuscripts.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Upload a manuscript PDF before submitting this draft.
            </p>
          ) : null}
        </section>
      </div>
      <PublicSiteFooter />
    </main>
  );
}
