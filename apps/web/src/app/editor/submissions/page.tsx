import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import {
  listEditorialJournalsForUser,
  listSubmissionsForEditor,
} from "@/modules/editorial/application/use-cases";
import { createPostgresEditorialRepository } from "@/modules/editorial/infrastructure/postgres-repository";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editor workspace",
  robots: { index: false, follow: false },
};

const journalIdSchema = z.uuid();

export default async function EditorSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ journalId?: string | string[] }>;
}) {
  const session = isOidcConfigured ? await auth() : null;
  const userId = session?.user?.id;
  const database = userId ? getDatabase() : null;
  const tenancy = database ? createPostgresTenancyRepository(database) : null;
  const journals = tenancy && userId
    ? await listEditorialJournalsForUser(tenancy, userId)
    : [];
  const requestedJournalId = (await searchParams).journalId;
  const parsedJournalId = requestedJournalId === undefined
    ? null
    : journalIdSchema.safeParse(requestedJournalId);
  const selectedJournal = requestedJournalId === undefined
    ? journals[0]
    : parsedJournalId?.success
      ? journals.find((journal) => journal.journalId === parsedJournalId.data)
      : undefined;
  const submissions = selectedJournal && tenancy && database && userId
    ? await listSubmissionsForEditor(
        createPostgresEditorialRepository(database),
        tenancy,
        userId,
        selectedJournal.journalId,
      )
    : [];

  return (
    <>
      <PublicSiteHeader />
      <main id="main-content" className="min-h-[60vh] bg-paper text-ink">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link className="inline-flex min-h-11 items-center hover:text-forest" href="/">Home</Link>
            <span aria-hidden="true" className="mx-2 text-line">/</span>
            <span aria-current="page">Editor workspace</span>
          </nav>
          <header className="mt-7 max-w-3xl border-b border-line pb-7">
            <p className="text-sm font-semibold text-forest">Editor workspace</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Submissions to handle
            </h1>
            <p className="mt-4 leading-7 text-muted">
              Select a journal to review its submitted manuscripts and editorial status.
            </p>
          </header>

          {!isOidcConfigured ? (
            <p className="mt-8 max-w-2xl rounded-xl border border-line bg-white p-6 leading-7">
              This workspace requires an institutional sign-in provider. It is not enabled in this environment.
            </p>
          ) : !userId ? (
            <div className="mt-8 rounded-xl border border-line bg-white p-6">
              <p className="leading-7">Sign in to view your assigned journals.</p>
              <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-4" href="/api/auth/signin">
                Sign in
              </Link>
            </div>
          ) : journals.length === 0 ? (
            <p className="mt-8 rounded-xl border border-line bg-white p-6 leading-7">
              No editorial journals are assigned to your account.
            </p>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <nav aria-label="Editorial journals" className="min-w-0">
                <h2 className="text-sm font-semibold text-ink">Your journals</h2>
                <ul className="mt-3 space-y-2">
                  {journals.map((journal) => (
                    <li key={journal.journalId}>
                      <Link
                        href={`/editor/submissions?journalId=${journal.journalId}`}
                        aria-current={selectedJournal?.journalId === journal.journalId ? "page" : undefined}
                        className={`flex min-h-11 min-w-0 items-center rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${selectedJournal?.journalId === journal.journalId ? "border-forest bg-white text-forest" : "border-line bg-white text-ink hover:border-forest"}`}
                      >
                        <span className="min-w-0 break-words">{journal.journalTitle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <section aria-label="Journal submissions" className="min-w-0">
                {!selectedJournal ? (
                  <p className="rounded-xl border border-line bg-white p-6 leading-7">
                    This journal is not available to your account. Select one of your assigned journals.
                  </p>
                ) : (
                  <>
                    <div className="border-b border-line pb-4">
                      <p className="text-sm text-muted">{selectedJournal.organizationName}</p>
                      <h2 className="mt-1 font-display text-2xl text-ink">{selectedJournal.journalTitle}</h2>
                    </div>
                    {submissions.length === 0 ? (
                      <p className="mt-5 rounded-xl border border-line bg-white p-6 leading-7">
                        No submitted manuscripts are in this journal’s editorial queue.
                      </p>
                    ) : (
                      <ul className="mt-5 space-y-3">
                        {submissions.map((submission) => (
                          <li key={submission.id} className="min-w-0 rounded-xl border border-line bg-white p-5">
                            <Link
                              href={`/editor/submissions/${submission.id}`}
                              className="inline-flex min-h-11 items-center break-words font-semibold text-forest underline-offset-4 hover:underline"
                            >
                              {submission.title}
                            </Link>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                              <span className="capitalize">{submission.status.replaceAll("_", " ")}</span>
                              {submission.submittedAt && <time dateTime={submission.submittedAt.toISOString()}>
                                Submitted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(submission.submittedAt)}
                              </time>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
