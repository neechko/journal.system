import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/modules/shared/app-error";
import {
  listPublicJournals,
  PUBLIC_JOURNAL_PAGE_SIZE,
} from "@/modules/tenancy/application/use-cases";
import {
  publicJournalPageSchema,
  publicJournalSearchSchema,
} from "@/modules/tenancy/application/validation";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal directory | Scholarly Publishing Platform",
  description: "Find journals that have been published on this platform.",
};

export default async function PublicJournalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
}) {
  const query = await searchParams;
  let page = 1;
  let searchTerm = "";

  if (query.page !== undefined) {
    if (typeof query.page !== "string") {
      notFound();
    }

    const parsedPage = publicJournalPageSchema.safeParse(query.page);
    if (!parsedPage.success) {
      notFound();
    }
    page = parsedPage.data;
  }

  if (query.q !== undefined) {
    if (typeof query.q !== "string") {
      notFound();
    }

    const parsedSearchTerm = publicJournalSearchSchema.safeParse(query.q);
    if (!parsedSearchTerm.success) {
      notFound();
    }
    searchTerm = parsedSearchTerm.data;
  }

  let catalog;
  try {
    catalog = await listPublicJournals(
      createPostgresTenancyRepository(getDatabase()),
      page,
      searchTerm,
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "DATABASE_NOT_CONFIGURED") {
      return (
        <main id="main-content" className="min-h-screen bg-paper text-ink">
          <PublicSiteHeader />
          <div className="mx-auto min-h-[50vh] max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Public directory
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Journal directory
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-muted">
              The journal directory is unavailable because application storage
              has not been configured.
            </p>
          </div>
          <PublicSiteFooter />
        </main>
      );
    }
    throw error;
  }

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams({ page: String(targetPage) });
    if (searchTerm) {
      params.set("q", searchTerm);
    }
    return `/journals?${params.toString()}`;
  };

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">Journals</span>
        </nav>

        <header className="mt-8 grid gap-6 border-b border-line pb-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
              Journal directory
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Find journals by title, publishing organization, or description.
              This directory only includes journal pages that have been
              published.
            </p>
          </div>
        </header>

        <form
          action="/journals"
          className="mt-8 max-w-3xl rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-4"
          method="get"
        >
          <label
            className="mb-2 block text-sm font-semibold text-ink"
            htmlFor="journal-search"
          >
            Search journals
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-paper px-3 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15">
              <svg
                aria-hidden="true"
                className="size-5 shrink-0 text-muted"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m16 16 4.2 4.2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.7"
                />
              </svg>
              <input
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/75"
                defaultValue={searchTerm}
                id="journal-search"
                maxLength={100}
                name="q"
                placeholder="Journal title, organization, or description"
                type="search"
              />
            </div>
            <button
              className="min-h-12 rounded-xl bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              type="submit"
            >
              Search journals
            </button>
          </div>
          {searchTerm ? (
            <p className="mt-3 text-sm text-muted">
              Results for <strong className="text-ink">{searchTerm}</strong>.{" "}
              <Link
                className="font-semibold text-forest underline underline-offset-4"
                href="/journals"
              >
                Clear search
              </Link>
            </p>
          ) : null}
        </form>

        <section aria-labelledby="results-heading" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Results
              </p>
              <h2
                className="mt-1 font-display text-2xl text-ink"
                id="results-heading"
              >
                Public journals
              </h2>
            </div>
            <p className="text-sm text-muted">
              Up to {PUBLIC_JOURNAL_PAGE_SIZE} journals per page
            </p>
          </div>

          {catalog.journals.length > 0 ? (
            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {catalog.journals.map((journal) => (
                <li key={`${journal.organizationSlug}/${journal.slug}`}>
                  <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-forest/5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                        {journal.organizationName}
                      </p>
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-forest transition-colors group-hover:bg-lime"
                      >
                        ↗
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-2xl leading-tight text-ink sm:text-3xl">
                      <Link
                        className="decoration-coral decoration-2 underline-offset-4 group-hover:underline"
                        href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                      >
                        {journal.title}
                      </Link>
                    </h3>
                    {journal.description ? (
                      <p className="mt-4 flex-1 text-sm leading-7 text-muted">
                        {journal.description}
                      </p>
                    ) : (
                      <p className="mt-4 flex-1 text-sm leading-7 text-muted">
                        Open the journal profile to view information provided
                        by its publisher.
                      </p>
                    )}
                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                      <span className="text-xs font-medium text-muted">
                        Journal profile
                      </span>
                      <Link
                        className="text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                        href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                      >
                        View journal
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="mt-6 rounded-2xl border border-dashed border-line bg-white/70 px-6 py-12 text-center"
              role="status"
            >
              <span
                aria-hidden="true"
                className="mx-auto grid size-12 place-items-center rounded-full bg-paper-deep text-xl text-forest"
              >
                {searchTerm ? "⌕" : "＋"}
              </span>
              <h3 className="mt-4 font-display text-2xl text-ink">
                {searchTerm
                  ? "No matching journals found"
                  : "No public journals yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                {searchTerm
                  ? "Try another search, such as a journal title or publishing organization."
                  : "Journals appear here after their publishers make the profile public."}
              </p>
            </div>
          )}
        </section>

        {catalog.page > 1 || catalog.hasNextPage ? (
          <nav
            aria-label="Journal directory pagination"
            className="mt-10 flex items-center justify-between border-t border-line pt-5"
          >
            {catalog.page > 1 ? (
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-line bg-paper px-4 text-sm font-semibold text-forest hover:border-forest"
                href={pageHref(catalog.page - 1)}
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm font-medium text-muted">
              Page {catalog.page}
            </span>
            {catalog.hasNextPage ? (
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-line bg-paper px-4 text-sm font-semibold text-forest hover:border-forest"
                href={pageHref(catalog.page + 1)}
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
      <PublicSiteFooter />
    </main>
  );
}
