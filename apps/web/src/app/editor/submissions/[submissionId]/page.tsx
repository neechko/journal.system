import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getSubmissionDetailForEditor } from "@/modules/editorial/application/use-cases";
import { createPostgresEditorialRepository } from "@/modules/editorial/infrastructure/postgres-repository";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export const metadata: Metadata = {
  title: "Editor submission detail",
  robots: { index: false, follow: false },
};

export default async function EditorSubmissionDetailPage({ params }: PageProps) {
  const { submissionId } = await params;
  if (!z.uuid().safeParse(submissionId).success) {
    notFound();
  }

  if (!isOidcConfigured) {
    return (
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <PublicSiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">Editor workspace</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            The editor workspace is not enabled yet.
          </h1>
        </div>
        <PublicSiteFooter />
      </main>
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const editorialRepo = createPostgresEditorialRepository(getDatabase());
  const tenancyRepo = createPostgresTenancyRepository(getDatabase());

  const detail = await getSubmissionDetailForEditor(editorialRepo, tenancyRepo, userId, submissionId);
  if (!detail) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-lime/50 text-forest-deep",
    submitted: "bg-lime/50 text-forest-deep",
    under_review: "bg-info/15 text-info-deep",
    revision_requested: "bg-warning/15 text-warning-deep",
    accepted: "bg-forest/10 text-forest",
    rejected: "bg-coral/10 text-coral",
    withdrawn: "bg-line text-muted",
  };

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    revision_requested: "Revision Requested",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <Link className="hover:text-forest" href="/editor/submissions">
            Editor workspace
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <span aria-current="page">{detail.title}</span>
        </nav>

        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            {detail.organizationName} · {detail.journalTitle}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              {detail.title}
            </h1>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusColors[detail.status]}`}>
              {statusLabels[detail.status]}
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            Submission ID: {detail.id}
          </p>
        </header>

        <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)] xl:items-start xl:gap-10">
          <section aria-labelledby="manuscript-heading" className="max-w-5xl space-y-6">
            <header className="border-b border-line pb-4">
              <h2 id="manuscript-heading" className="font-display text-2xl text-ink">
                Manuscript
              </h2>
            </header>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Submitted manuscript version</dt>
                  <dd className="mt-1 font-semibold text-ink">{detail.submittedManuscriptVersion ?? "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Current manuscript version</dt>
                  <dd className="mt-1 font-semibold text-ink">{detail.currentManuscriptVersion ?? "Not available"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Abstract</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{detail.abstract ?? "No abstract provided."}</dd>
                </div>
                {detail.keywords.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Keywords</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {detail.keywords.map((keyword, index) => (
                        <span key={`${keyword}-${index}`} className="rounded-full bg-paper px-3 py-1 text-xs text-muted">
                          {keyword}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {detail.manuscripts.length > 0 && (
              <section aria-labelledby="manuscript-files-heading" className="space-y-3">
                <h3 id="manuscript-files-heading" className="font-display text-xl text-ink">
                  Manuscript files
                </h3>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-white overflow-hidden">
                  {detail.manuscripts.map((manuscript) => (
                    <li key={manuscript.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">Manuscript version {manuscript.version}</p>
                        <p className="mt-1 text-xs text-muted">
                          PDF · {Math.ceil(manuscript.byteSize / 1024)} KB · Uploaded {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(manuscript.uploadedAt)}
                        </p>
                      </div>
                      <a
                        className="inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-forest transition-colors hover:bg-forest/5"
                        href={`/api/author/submissions/${detail.id}/manuscripts/${manuscript.id}`}
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>

          <aside className="space-y-6">
            <section aria-labelledby="authors-heading" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 id="authors-heading" className="font-display text-xl text-ink">Authors</h2>
              <ul className="mt-4 space-y-3" role="list">
                {detail.authors.map((author) => (
                  <li key={author.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-ink">{author.name}</span>
                      {author.isCorresponding && (
                        <span className="rounded-full bg-lime/50 px-2 py-0.5 text-xs font-medium text-forest-deep" title="Corresponding author">
                          ✉
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted">
                      {author.affiliation && <span>{author.affiliation}</span>}
                      {author.orcid && (
                        <a className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest" href={`https://orcid.org/${author.orcid}`} target="_blank" rel="noopener noreferrer">
                          ORCID
                        </a>
                      )}
                      {author.email && author.isCorresponding && (
                        <a className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest" href={`mailto:${author.email}`}>
                          {author.email}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="reviewers-heading" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 id="reviewers-heading" className="font-display text-xl text-ink">Reviewers</h2>
                {detail.status === "under_review" && (
                  <a className="inline-flex min-h-11 items-center rounded-lg bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-deep" href="#assign-reviewer">
                    Assign reviewer
                  </a>
                )}
              </div>
              {detail.assignments.length > 0 ? (
                <ul className="mt-4 space-y-3" role="list">
                  {detail.assignments.map((assignment) => (
                    <li key={assignment.id} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">Reviewer {assignment.reviewerUserId.slice(0, 8)}</p>
                          <p className="mt-1 text-xs text-muted capitalize">{assignment.role}</p>
                          <p className="mt-1 text-xs text-muted">
                            Assigned {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(assignment.assignedAt)}
                            {assignment.dueAt && (
                              <> · Due {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(assignment.dueAt)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.completedAt && (
                            <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">Completed</span>
                          )}
                          {!assignment.completedAt && !assignment.unassignedAt && (
                            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning-deep">Pending</span>
                          )}
                          {assignment.unassignedAt && (
                            <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No reviewers assigned yet.</p>
              )}
            </section>

            <section aria-labelledby="reviews-heading" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 id="reviews-heading" className="font-display text-xl text-ink">Reviews</h2>
              {detail.reviews.length > 0 ? (
                <ul className="mt-4 space-y-4" role="list">
                  {detail.reviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold text-muted capitalize">{review.recommendation.replace("_", " ")}</span>
                          <span className="text-xs text-muted">v{review.version} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(review.submittedAt)}</span>
                        </div>
                        {review.acknowledgedAt && (
                          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">Acknowledged</span>
                        )}
                      </div>
                      <div className="mt-4 space-y-3">
                        {review.commentsToAuthor && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Comments to author</p>
                            <p className="mt-1 text-sm leading-6 text-muted">{review.commentsToAuthor}</p>
                          </div>
                        )}
                        {review.commentsToEditor && (
                          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-warning-deep">Comments to editor (confidential)</p>
                            <p className="mt-1 text-sm leading-6 text-ink">{review.commentsToEditor}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No reviews submitted yet.</p>
              )}
            </section>

            <section aria-labelledby="decisions-heading" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 id="decisions-heading" className="font-display text-xl text-ink">Editorial Decisions</h2>
              {detail.decisions.length > 0 ? (
                <ul className="mt-4 space-y-3" role="list">
                  {detail.decisions.map((decision) => (
                    <li key={decision.id} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          decision.outcome === "accept" ? "bg-forest/10 text-forest" :
                          decision.outcome === "reject" ? "bg-coral/10 text-coral" :
                          "bg-warning/15 text-warning-deep"
                        }`}>
                          {decision.outcome.replace("_", " ")}
                        </span>
                        <time className="text-xs text-muted" dateTime={decision.createdAt.toISOString()}>
                          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(decision.createdAt)}
                        </time>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">{decision.rationale}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">No decisions recorded yet.</p>
              )}
            </section>

            <section aria-labelledby="audit-heading" className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 id="audit-heading" className="font-display text-xl text-ink">Audit Trail</h2>
              <ul className="mt-4 divide-y divide-line" role="list">
                {detail.auditEvents.map((event) => (
                  <li key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{event.action}</p>
                        <p className="text-xs text-muted">
                          {event.actorLabel ?? event.actorUserId ?? "System"} · {event.reason}
                        </p>
                        {event.stateBefore && event.stateAfter && (
                          <p className="mt-1 text-xs text-muted">
                            Status: {event.stateBefore} → {event.stateAfter}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-muted" dateTime={event.occurredAt.toISOString()}>
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(event.occurredAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
      <PublicSiteFooter />
    </main>
  );
}
