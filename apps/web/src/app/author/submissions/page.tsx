import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { AuthorAccessState } from "@/modules/submissions/presentation/author-access-state";
import { listSubmissionsForAuthor } from "@/modules/submissions/application/use-cases";
import { createPostgresSubmissionRepository } from "@/modules/submissions/infrastructure/postgres-repository";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My submissions",
  robots: { index: false, follow: false },
};

export default async function AuthorSubmissionsPage() {
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
    return (
      <AuthorAccessState
        heading="Sign in to view your submissions."
        message="Only the authenticated author can view their private submissions."
        signInHref={`/api/auth/signin?callbackUrl=${encodeURIComponent("/author/submissions")}`}
      />
    );
  }

  const submissions = await listSubmissionsForAuthor(
    createPostgresSubmissionRepository(getDatabase()),
    actorUserId,
  );
  const updatedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">My submissions</span>
        </nav>

        <header className="mt-8 max-w-3xl border-b border-line pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            Author workspace
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            My submissions
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Private submission records are visible only to your account.
            Submitted records are read-only; editorial screening and review
            workflows are not available yet.
          </p>
        </header>

        {submissions.length > 0 ? (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <article className="h-full rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {submission.organizationName} · {submission.journalTitle}
                  </p>
                  <h2 className="mt-3 break-words font-display text-2xl leading-tight text-ink">
                    {submission.title}
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        submission.status === "submitted"
                          ? "bg-forest/10 text-forest-deep"
                          : "bg-lime/50 text-forest-deep"
                      }`}
                    >
                      {submission.status === "submitted"
                        ? "Submitted"
                        : "Draft"}
                    </span>
                    <time
                      className="text-xs text-muted"
                      dateTime={(submission.submittedAt ?? submission.updatedAt).toISOString()}
                    >
                      {submission.status === "submitted" ? "Submitted" : "Updated"}{" "}
                      {updatedDate.format(submission.submittedAt ?? submission.updatedAt)}
                    </time>
                  </div>
                  <Link
                    className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                    href={`/author/submissions/${submission.id}`}
                  >
                    {submission.status === "submitted"
                      ? "View submission"
                      : "Continue draft"}
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-line bg-white/70 px-6 py-10">
            <h2 className="font-display text-2xl text-ink">
              No submissions yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Start from a journal&apos;s public profile to create a private
              draft. You can submit it after attaching a manuscript PDF in
              explicitly enabled local development.
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
              href="/journals"
            >
              Explore journals
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
          </section>
        )}
      </div>
      <PublicSiteFooter />
    </main>
  );
}
