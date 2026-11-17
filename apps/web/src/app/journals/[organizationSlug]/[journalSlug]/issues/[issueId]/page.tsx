import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getPublishedIssue } from "@/modules/publications/application/use-cases";
import { createPostgresPublicationsRepository } from "@/modules/publications/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    organizationSlug: string;
    journalSlug: string;
    issueId: string;
  }>;
}

async function loadIssue(params: PageProps["params"]) {
  const { organizationSlug, journalSlug, issueId } = await params;

  if (!z.uuid().safeParse(issueId).success) {
    return null;
  }

  return getPublishedIssue(createPostgresPublicationsRepository(getDatabase()), {
    organizationSlug,
    journalSlug,
    issueId,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const issue = await loadIssue(params);

  if (!issue) {
    return { title: "Issue not found", robots: { index: false, follow: false } };
  }

  const path = `/journals/${issue.journal.organizationSlug}/${issue.journal.slug}/issues/${issue.id}`;
  const title = issue.label
    ? `${issue.label}: ${issue.journal.title}`
    : `Issue ${issue.number} (${issue.year}): ${issue.journal.title}`;

  return {
    title,
    description: issue.description ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: issue.description ?? undefined,
      type: "website",
      url: path,
      siteName: issue.journal.title,
    },
  };
}

export default async function IssuePage({ params }: PageProps) {
  const issue = await loadIssue(params);

  if (!issue) {
    notFound();
  }

  const journalPath = `/journals/${issue.journal.organizationSlug}/${issue.journal.slug}`;

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink" data-journal={issue.journal.slug}>
      <PublicSiteHeader />
      <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <Link className="hover:text-forest" href="/journals">
            Journals
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <Link className="hover:text-forest" href={journalPath}>
            {issue.journal.title}
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <span aria-current="page">Issue {issue.number}</span>
        </nav>

        <header className="mt-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            {issue.journal.title}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {issue.label ? `Issue: ${issue.label}` : `Issue ${issue.number}`}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>
              {issue.volume ? `Volume ${issue.volume.number}, ` : ""}
              {issue.year}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={issue.publishedAt.toISOString()}>
              Published{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(issue.publishedAt)}
            </time>
          </div>

          {issue.description && (
            <div className="mt-6 max-w-2xl text-sm leading-6 text-muted">
              {issue.description}
            </div>
          )}
        </header>

        {issue.articles.length > 0 ? (
          <section aria-labelledby="articles-heading" className="mt-12 max-w-3xl">
            <h2 id="articles-heading" className="font-display text-3xl text-ink">
              Articles in this issue
            </h2>
            <ul className="mt-6 space-y-6" role="list">
              {issue.articles.map((article) => (
                <li key={article.id} className="border-t border-line pt-6 first:border-0">
                  <article>
                    <header>
                      {article.articleType && (
                        <span className="inline-flex items-center rounded-full bg-paper-deep px-2.5 py-0.5 text-xs font-medium text-muted">
                          {article.articleType}
                        </span>
                      )}
                      <h3 className="mt-3 font-display text-2xl leading-tight text-ink">
                        <Link
                          className="transition-colors hover:text-forest"
                          href={`${journalPath}/articles/${article.id}`}
                        >
                          {article.title}
                        </Link>
                      </h3>
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                        {article.authors.map((author, index) => (
                          <span key={`${author.name}-${index}`} className="flex items-center gap-1">
                            {author.name}
                            {author.isCorresponding && (
                              <span className="text-forest" aria-label="Corresponding author">
                                ✉
                              </span>
                            )}
                            {index < article.authors.length - 1 && <span aria-hidden="true">,</span>}
                          </span>
                        ))}
                        {article.pageStart && article.pageEnd && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              pp. {article.pageStart}–{article.pageEnd}
                            </span>
                          </>
                        )}
                        {article.doi && (
                          <>
                            <span aria-hidden="true">·</span>
                            <a
                              className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
                              href={`https://doi.org/${article.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              DOI: {article.doi}
                            </a>
                          </>
                        )}
                      </p>
                    </header>

                    {article.abstract && (
                      <div className="mt-4 max-w-2xl text-sm text-muted">
                        <p>{article.abstract}</p>
                      </div>
                    )}

                    <footer className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                        href={`${journalPath}/articles/${article.id}`}
                      >
                        Read article
                        <span aria-hidden="true">→</span>
                      </Link>
                      {article.hasPdf && (
                        <a
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
                          href={`/api/public/articles/${article.id}/pdf`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          PDF
                        </a>
                      )}
                    </footer>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="mt-12 max-w-3xl rounded-2xl border border-dashed border-line bg-white/70 px-6 py-10 text-center">
            <p className="text-sm leading-6 text-muted">
              No articles published in this issue yet.
            </p>
          </section>
        )}

        <footer className="mt-12 max-w-3xl border-t border-line pt-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            href={journalPath}
          >
            <span aria-hidden="true">←</span>
            Back to journal
          </Link>
        </footer>
      </article>
      <PublicSiteFooter />
    </main>
  );
}
