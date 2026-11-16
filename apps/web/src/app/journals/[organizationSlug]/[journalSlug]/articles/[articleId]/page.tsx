import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getArticleWithIssueUseCase } from "@/modules/production/application/use-cases";
import { createPostgresProductionRepository } from "@/modules/production/infrastructure/postgres-repository";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    organizationSlug: string;
    journalSlug: string;
    articleId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { organizationSlug, journalSlug, articleId } = await params;
  
  if (!z.uuid().safeParse(articleId).success) {
    return { title: "Article not found" };
  }

  const repository = createPostgresProductionRepository(getDatabase());
  const result = await getArticleWithIssueUseCase(repository, articleId);
  
  if (!result || !result.article.publishedAt) {
    return { title: "Article not found" };
  }

  const article = result.article;
  const authors = article.authors as Array<{ name: string }>;
  const authorNames = authors.map((a) => a.name).join(", ");

  return {
    title: `${article.title} | ${journalSlug}`,
    description: article.abstract ?? undefined,
    authors: authors.map((a) => ({ name: a.name })),
    openGraph: {
      title: article.title,
      description: article.abstract ?? undefined,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: authorNames,
    },
    other: {
      "citation_title": article.title,
      "citation_author": authors.map((a) => a.name).join("; "),
      "citation_journal_title": journalSlug,
      "citation_publication_date": article.publishedAt ? article.publishedAt.toISOString().split("T")[0] : "",
      "citation_doi": article.doi ?? "",
      "citation_pdf_url": article.pdfFileId ? `/api/public/articles/${articleId}/pdf` : "",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { organizationSlug, journalSlug, articleId } = await params;

  if (!z.uuid().safeParse(articleId).success) {
    notFound();
  }

  const repository = createPostgresProductionRepository(getDatabase());
  const result = await getArticleWithIssueUseCase(repository, articleId);

  if (!result || !result.article.publishedAt) {
    notFound();
  }

  const article = result.article;
  const authors = article.authors as Array<{
    name: string;
    affiliation: string | null;
    orcid: string | null;
    email: string | null;
    isCorresponding: boolean;
    order: number;
  }>;
  const keywords = article.keywords as string[];
  const publishedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(article.publishedAt!);

  return (
    <main className="min-h-screen bg-paper text-ink" data-journal={journalSlug}>
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
          <Link className="hover:text-forest" href={`/journals/${organizationSlug}/${journalSlug}`}>
            {journalSlug}
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <span aria-current="page">Article</span>
        </nav>

        <header className="mt-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            {result.issue ? `Vol. ${result.volume?.number} No. ${result.issue.number} (${result.issue.year})` : "Published online"}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
            <time dateTime={article.publishedAt!.toISOString()}>
              Published: {publishedDate}
            </time>
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
          </div>
        </header>

        <section aria-labelledby="authors-heading" className="mt-10 max-w-3xl border-t border-line pt-8">
          <h2 id="authors-heading" className="sr-only">
            Authors
          </h2>
          <ul className="flex flex-wrap items-center gap-3">
            {authors.map((author) => (
              <li key={author.name} className="flex items-center gap-2">
                <span className="font-semibold text-ink">{author.name}</span>
                {author.isCorresponding && (
                  <span className="rounded-full bg-lime/50 px-2 py-0.5 text-xs font-medium text-forest-deep" title="Corresponding author">
                    ✉
                  </span>
                )}
                {author.orcid && (
                  <a
                    className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
                    href={`https://orcid.org/${author.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`ORCID: ${author.orcid}`}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12s12-5.37 12-12C24 5.37 18.63 0 12 0zm5.52 20.28c-.24.36-.6.48-.96.24-2.76-1.8-5.4-3.84-7.56-5.52-.48-.36-.48-1.08 0-1.44 2.28-1.8 5.04-3.72 7.56-5.52.36-.36.72-.24.96.24C18.96 15.24 17.4 18.24 14.28 21c1.56.36 3.12.48 4.68.48 1.44 0 2.88-.12 4.2-.48z" />
                    </svg>
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-start gap-4 text-sm text-muted">
            {authors
              .filter((a) => a.affiliation)
              .map((author) => (
                <p key={author.name} className="whitespace-nowrap">
                  {author.affiliation}
                </p>
              ))}
          </div>

          {authors.some((a) => a.email) && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
              {authors
                .filter((a) => a.email && a.isCorresponding)
                .map((author) => (
                  <a
                    key={author.name}
                    className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
                    href={`mailto:${author.email}`}
                  >
                    ✉ {author.email}
                  </a>
                ))}
            </div>
          )}
        </section>

        {article.abstract && (
          <section aria-labelledby="abstract-heading" className="mt-10 max-w-3xl border-t border-line pt-8">
            <h2 id="abstract-heading" className="font-display text-2xl text-ink">
              Abstract
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-muted">
              {article.abstract}
            </p>
          </section>
        )}

        {keywords.length > 0 && (
          <section aria-labelledby="keywords-heading" className="mt-10 max-w-3xl border-t border-line pt-8">
            <h2 id="keywords-heading" className="font-display text-2xl text-ink">
              Keywords
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <li key={`${keyword}-${index}`} className="rounded-full bg-paper px-3 py-1 text-sm text-muted">
                  {keyword}
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.htmlContent && (
          <section aria-labelledby="fulltext-heading" className="mt-10 max-w-3xl border-t border-line pt-8">
            <h2 id="fulltext-heading" className="font-display text-2xl text-ink">
              Full Text
            </h2>
            <div className="mt-6 prose prose-forest max-w-none" dangerouslySetInnerHTML={{ __html: article.htmlContent }} />
          </section>
        )}

        <footer className="mt-12 max-w-3xl border-t border-line pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {article.doi && (
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-forest hover:bg-forest/5 transition-colors"
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View DOI
                </a>
              )}
              {article.pdfFileId && (
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-forest hover:bg-forest/5 transition-colors"
                  href={`/api/public/articles/${articleId}/pdf`}
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Download PDF
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Published in</span>
              <Link className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest" href={`/journals/${organizationSlug}/${journalSlug}`}>
                {journalSlug}
              </Link>
              {result.issue && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link className="text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest" href={`/journals/${organizationSlug}/${journalSlug}/issues/${result.issue.id}`}>
                    {result.volume ? `Vol. ${result.volume.number}` : ""} {result.issue.label ? `(${result.issue.label})` : `No. ${result.issue.number}`}
                  </Link>
                </>
              )}
            </div>
          </div>

          {article.doi && (
            <p className="mt-6 text-xs text-muted">
              <strong>Cite this article:</strong> {authors.map((a) => a.name).join(", ")}. {article.title}. <em>{journalSlug}</em>. {article.publishedAt?.getFullYear()}{article.doi ? `; doi: ${article.doi}` : ""}.
            </p>
          )}
        </footer>
      </article>
      <PublicSiteFooter />
    </main>
  );
}