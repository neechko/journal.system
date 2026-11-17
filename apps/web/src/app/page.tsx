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
        <section className="mx-auto max-w-7xl border-b border-line px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="max-w-4xl">
            <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight text-ink sm:text-6xl">
              Find a journal. Follow the work behind its publications.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Browse journal profiles that have been made public. Submission,
              editorial review, and production tools are still being developed.
            </p>
          </div>

          <form action="/journals" className="mt-10 max-w-2xl" method="get" role="search">
            <label className="block text-sm font-semibold text-ink" htmlFor="homepage-journal-search">
              Search journal profiles
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                autoComplete="off"
                className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-paper px-4 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                id="homepage-journal-search"
                maxLength={100}
                name="q"
                placeholder="Title, publisher, or subject"
                type="search"
              />
              <button
                className="min-h-12 rounded-lg bg-forest px-6 text-sm font-semibold text-white hover:bg-forest-deep active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                type="submit"
              >
                Search journals
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="recent-journals-heading"
          className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16"
        >
          <div>
            <h2 className="font-display text-3xl text-ink" id="recent-journals-heading">
              Recently published journals
            </h2>
            <p className="mt-4 max-w-sm leading-7 text-muted">
              Only profiles published by their organization appear here.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-4 hover:text-forest-deep"
              href="/journals"
            >
              Browse the journal directory
            </Link>
          </div>

          {catalogUnavailable ? (
            <p className="border-t border-line pt-6 text-muted" role="status">
              Journal profiles are unavailable because the database is not configured in this environment.
            </p>
          ) : recentJournals.length === 0 ? (
            <p className="border-t border-line pt-6 text-muted" role="status">
              No journal profiles have been published yet.
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {recentJournals.map((journal) => (
                <li className="py-6 first:pt-6" key={`${journal.organizationSlug}/${journal.slug}`}>
                  <p className="text-sm text-muted">{journal.organizationName}</p>
                  <h3 className="mt-2 font-display text-2xl leading-snug text-ink">
                    <Link
                      className="inline-block min-h-11 text-ink underline decoration-line underline-offset-4 hover:decoration-forest"
                      href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                    >
                      {journal.title}
                    </Link>
                  </h3>
                  {journal.description ? (
                    <p className="mt-2 max-w-2xl leading-7 text-muted">{journal.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-line bg-paper-deep" id="platform">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <h2 className="font-display text-3xl text-ink">About the platform</h2>
            <div className="max-w-2xl space-y-4 leading-7 text-muted">
              <p>
                The platform is being built for organizations that manage more than one
                journal. Each journal needs its own public profile, editorial policy,
                submission process, and publication archive.
              </p>
              <p>
                Public journal profiles are available now. The author submission
                prototype requires institutional sign-in and storage enabled only for
                local development. Editorial and production workflows are not yet
                ready for live manuscripts.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </>
  );
}
