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
  title: "Journal directory",
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
        <>
          <PublicSiteHeader />
          <main id="main-content" className="min-h-screen bg-paper text-ink">
            <div className="border-b border-line bg-paper-deep">
              <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">Public index</p>
                <h1 className="mt-4 font-display text-[clamp(3rem,5vw,5rem)] leading-[1.05] tracking-[-0.035em] text-ink">
                  Journal directory
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
                  Find journals and read the profiles their publishers have made public.
                </p>
              </div>
            </div>
            <div className="mx-auto grid min-h-[38vh] max-w-7xl gap-6 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <h2 className="border-t-2 border-ink pt-6 font-display text-3xl text-ink">Directory unavailable</h2>
              <div className="border-t-2 border-ink pt-6">
                <p className="max-w-xl leading-7 text-muted" role="status">
                  Journal data is not configured in this preview environment.
                  Published profiles will appear here when the catalog is connected.
                </p>
                <Link className="mt-5 inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-4" href="/">
                  Return to the platform home
                </Link>
              </div>
            </div>
          </main>
          <PublicSiteFooter />
        </>
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
    <>
      <PublicSiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <div className="border-b border-line bg-paper-deep">
          <div className="mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pt-10">
          <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
            <Link className="hover:text-forest" href="/">
              Home
            </Link>
            <span aria-hidden="true" className="mx-2 text-line">
              /
            </span>
            <span aria-current="page">Journals</span>
          </nav>

          <header className="mt-10 grid gap-8 pb-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] lg:items-end lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">Public index</p>
              <h1 className="mt-4 font-display text-[clamp(3rem,5vw,5rem)] leading-[1.05] tracking-[-0.035em] text-ink">
                Journal directory
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
                Find a journal by title or publisher, then read the profile its
                organization has made public.
              </p>
            </div>
            <p className="max-w-sm border-l-2 border-forest pl-5 text-sm leading-7 text-muted">
              Scope, author guidance, and archives appear when the journal has
              published that information.
            </p>
          </header>

          <form
            action="/journals"
            className="max-w-4xl border-t-2 border-ink pt-6"
            method="get"
          >
            <label
              className="mb-3 block text-sm font-semibold text-ink"
              htmlFor="journal-search"
            >
              Search journals
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 border border-line-strong bg-paper px-3 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15">
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
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                  defaultValue={searchTerm}
                  id="journal-search"
                  maxLength={100}
                  name="q"
                  placeholder="Journal title, organization, or description"
                  type="search"
                />
              </div>
              <button
                className="min-h-12 bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
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
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">

          <section aria-labelledby="results-heading">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                  Directory results
                </p>
                <h2
                  className="mt-2 font-display text-3xl text-ink"
                  id="results-heading"
                >
                  Public journals
                </h2>
              </div>
              <p className="text-sm text-muted">
                {catalog.journals.length} of up to {PUBLIC_JOURNAL_PAGE_SIZE} on this page
              </p>
            </div>

            {catalog.journals.length > 0 ? (
              <ul className="divide-y divide-line border-t-2 border-ink">
                {catalog.journals.map((journal) => (
                  <li className="grid gap-4 py-8 sm:py-10 lg:grid-cols-[minmax(11rem,0.5fr)_minmax(0,1.5fr)_auto] lg:gap-8" key={`${journal.organizationSlug}/${journal.slug}`}>
                    <p className="pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {journal.organizationName}
                    </p>
                    <div>
                      <h3 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
                        <Link
                          className="underline decoration-line underline-offset-4 hover:decoration-forest"
                          href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                        >
                          {journal.title}
                        </Link>
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                        {journal.description || "Open the profile for information supplied by its publisher."}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-11 items-center justify-self-start text-sm font-semibold text-forest underline decoration-forest/40 underline-offset-4 hover:decoration-forest"
                      href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                    >
                      View profile
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="grid gap-4 border-t-2 border-ink py-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-12"
                role="status"
              >
                <h3 className="font-display text-2xl text-ink sm:text-3xl">
                  {searchTerm
                    ? "No matching journals found"
                    : "No public journals yet"}
                </h3>
                <p className="max-w-md text-sm leading-7 text-muted">
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
                  className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-paper px-4 text-sm font-semibold text-forest hover:border-forest"
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
                  className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-paper px-4 text-sm font-semibold text-forest hover:border-forest"
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
      </main>
      <PublicSiteFooter />
    </>
  );
}
