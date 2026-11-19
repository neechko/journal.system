import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { AppError } from "@/modules/shared/app-error";
import type { PublishedJournalCatalogItem } from "@/modules/tenancy/application/ports";
import { listPublicJournals } from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarly journals and publishing",
  description:
    "Find published journal profiles and follow the development of a scholarly publishing platform.",
};

export default async function HomePage() {
  let catalogUnavailable = false;
  let recentJournals: PublishedJournalCatalogItem[] = [];

  try {
    const catalog = await listPublicJournals(
      createPostgresTenancyRepository(getDatabase()),
      1,
    );
    recentJournals = catalog.journals.slice(0, 3);
  } catch (error) {
    if (error instanceof AppError && error.code === "DATABASE_NOT_CONFIGURED") {
      catalogUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <>
      <PublicSiteHeader />
      <main className="min-h-screen bg-paper text-ink" id="main-content">
        <section className="bg-brand text-brand-ink">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-center lg:gap-20 lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
                Public journal index
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(3rem,6vw,5.75rem)] leading-[1.03] tracking-[-0.045em]">
                Find a journal.
                <span className="block font-normal italic text-brand-muted">Know its context.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-brand-muted sm:text-lg">
                Browse public journal profiles and the information their publishers
                have shared. Submission, review, and production tools are still in development.
              </p>

              <form action="/journals" className="mt-9 max-w-xl" method="get" role="search">
                <label className="block text-sm font-semibold" htmlFor="homepage-journal-search">
                  Search journal profiles
                </label>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    autoComplete="off"
                    className="min-h-12 min-w-0 flex-1 border border-line-strong bg-paper px-4 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                    id="homepage-journal-search"
                    maxLength={100}
                    name="q"
                    placeholder="Title, publisher, or subject"
                    type="search"
                  />
                  <button
                    className="min-h-12 bg-brand-accent px-6 text-sm font-semibold text-brand-accent-ink transition-colors hover:bg-brand-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                    type="submit"
                  >
                    Search journals
                  </button>
                </div>
              </form>
            </div>

            <aside aria-label="What a journal profile may contain" className="border border-brand-line bg-brand-raised p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-brand-line pb-5">
                <p className="font-display text-xl">Inside a journal profile</p>
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">Index</span>
              </div>
              <dl className="divide-y divide-brand-line">
                <div className="grid gap-2 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                  <dt className="text-sm font-semibold text-brand-accent">Scope</dt>
                  <dd className="text-sm leading-6 text-brand-muted">The subjects and work a journal accepts.</dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                  <dt className="text-sm font-semibold text-brand-accent">Guidance</dt>
                  <dd className="text-sm leading-6 text-brand-muted">Instructions provided to prospective authors.</dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                  <dt className="text-sm font-semibold text-brand-accent">Archive</dt>
                  <dd className="text-sm leading-6 text-brand-muted">Issues and articles after publication.</dd>
                </div>
              </dl>
              <p className="border-t border-brand-line pt-5 text-xs leading-5 text-brand-muted">
                Each profile shows only the information its publisher has made public.
              </p>
            </aside>
          </div>
        </section>

        <section
          aria-labelledby="recent-journals-heading"
          className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] lg:gap-20"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">From the index</p>
            <h2 className="mt-4 max-w-sm font-display text-3xl leading-tight text-ink sm:text-4xl" id="recent-journals-heading">
              Public journal profiles
            </h2>
            <p className="mt-5 max-w-sm leading-7 text-muted">
              Publishers decide when their journal pages are ready to appear here.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center font-semibold text-forest underline decoration-forest/45 underline-offset-4 hover:decoration-forest"
              href="/journals"
            >
              View the full directory
            </Link>
          </div>

          {catalogUnavailable ? (
            <p className="border-t-2 border-ink py-8 leading-7 text-muted" role="status">
              Journal profiles are unavailable because the database is not configured in this environment.
            </p>
          ) : recentJournals.length === 0 ? (
            <p className="border-t-2 border-ink py-8 leading-7 text-muted" role="status">
              No journal profiles have been published yet.
            </p>
          ) : (
            <ul className="divide-y divide-line border-t-2 border-ink">
              {recentJournals.map((journal, index) => (
                <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 py-7 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6" key={`${journal.organizationSlug}/${journal.slug}`}>
                  <span aria-hidden="true" className="font-display text-2xl text-muted/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{journal.organizationName}</p>
                    <h3 className="mt-3 font-display text-2xl leading-snug text-ink sm:text-3xl">
                      <Link
                        className="inline-block min-h-11 underline decoration-line underline-offset-4 hover:decoration-forest"
                        href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                      >
                        {journal.title}
                      </Link>
                    </h3>
                    {journal.description ? (
                      <p className="mt-2 max-w-2xl leading-7 text-muted">{journal.description}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-y border-line bg-paper-deep" id="platform">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">About the platform</p>
              <h2 className="mt-4 max-w-md font-display text-3xl leading-tight text-ink sm:text-4xl">
                One record from journal page to published article.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-muted">
                We are building the publishing workflow for organizations that
                manage journals. The public index is the first part available to readers.
              </p>
            </div>
            <div>
              <dl className="divide-y divide-line border-y-2 border-ink">
              <div className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start sm:gap-6">
                <dt className="font-semibold text-ink">Public journal profiles</dt>
                <dd className="text-sm text-muted sm:text-right">Available</dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start sm:gap-6">
                <dt className="font-semibold text-ink">Author submissions</dt>
                <dd className="text-sm text-muted sm:text-right">Local prototype</dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start sm:gap-6">
                <dt className="font-semibold text-ink">Editorial review and production</dt>
                <dd className="text-sm text-muted sm:text-right">In development</dd>
              </div>
              </dl>
              <p className="pt-5 text-sm leading-6 text-muted">
                The prototype is not ready for live manuscripts or confidential files.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </>
  );
}
