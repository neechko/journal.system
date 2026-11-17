import type { Metadata } from "next";
import Link from "next/link";
import { AppError } from "@/modules/shared/app-error";
import type { PublishedJournalCatalogItem } from "@/modules/tenancy/application/ports";
import { listPublicJournals } from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarly journals and publishing",
  description:
    "Explore public journal profiles and the development of a multi-tenant scholarly publishing platform.",
};

const platformCapabilities = [
  {
    label: "Available",
    labelClassName: "bg-forest/10 text-forest",
    title: "Journal discovery",
    description:
      "Browse published journals and read the information provided in their profiles.",
  },
  {
    label: "Foundation",
    labelClassName: "bg-lime text-forest-deep",
    title: "Publisher management",
    description:
      "Organization and journal management is being built around tenant boundaries and audit trails.",
  },
  {
    label: "Prototype",
    labelClassName: "bg-lime text-forest-deep",
    title: "Author submission",
    description:
      "Draft metadata, versioned PDF upload, and author submission are implemented in a development prototype. Institutional sign-in and development-only private storage must be configured; editorial screening, peer review, production, and publication are not available yet.",
  },
];

export default async function HomePage() {
  let catalogUnavailable = false;
  let featuredJournals: PublishedJournalCatalogItem[] = [];

  try {
    const catalog = await listPublicJournals(
      createPostgresTenancyRepository(getDatabase()),
      1,
    );
    featuredJournals = catalog.journals.slice(0, 3);
  } catch (error) {
    if (error instanceof AppError && error.code === "DATABASE_NOT_CONFIGURED") {
      catalogUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />

      <section className="relative isolate overflow-hidden bg-forest text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-56 -top-64 size-[42rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 size-[30rem] rounded-full border border-white/10"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[620px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 lg:py-24">
          <div className="min-w-0 max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">
              <span className="size-1.5 rounded-full bg-coral" />
              For publishers, institutions, and journals
            </p>
            <h1 className="mt-7 font-display text-5xl leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A home for scholarly journals and the work behind every publication.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              Explore public journal profiles. Editorial workflows, production,
              and article publishing are being built in deliberate, accountable
              stages.
            </p>

            <form
              action="/journals"
              className="mt-8 max-w-xl rounded-2xl bg-white p-2 text-ink shadow-2xl shadow-black/15 focus-within:ring-2 focus-within:ring-lime"
              method="get"
            >
              <label className="sr-only" htmlFor="homepage-journal-search">
                Search journals by title, publisher, or description
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3">
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
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80 focus-visible:ring-0"
                    id="homepage-journal-search"
                    maxLength={100}
                    name="q"
                    placeholder="Journal title, publisher, or description"
                    type="search"
                  />
                </div>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral px-6 text-sm font-semibold text-forest-deep transition-colors hover:bg-[#ef9a7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                  type="submit"
                >
                  Search journals
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M4.5 10h10m-4-4 4 4-4 4"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65">
              <Link
                className="font-semibold text-lime underline decoration-white/30 underline-offset-4 hover:decoration-lime"
                href="/journals"
              >
                Browse the journal directory
              </Link>
              <span aria-hidden="true" className="hidden size-1 rounded-full bg-white/35 sm:block" />
              <span>Only published journal profiles appear in the directory.</span>
            </div>
          </div>

          <aside
            aria-labelledby="latest-journals-heading"
            className="relative mx-auto min-w-0 w-full max-w-xl lg:justify-self-end"
          >
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 size-24 rounded-full bg-coral/90"
            />
            <div className="relative overflow-hidden rounded-[1.75rem] bg-paper p-6 text-ink shadow-2xl shadow-black/25 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                    Discovery
                  </p>
                  <h2
                    className="mt-1 text-lg font-semibold text-ink"
                    id="latest-journals-heading"
                  >
                    Latest journals
                  </h2>
                </div>
                <span className="rounded-full bg-forest/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-forest">
                  Public directory
                </span>
              </div>

              {catalogUnavailable ? (
                <p className="mt-6 rounded-xl border border-line bg-white p-5 text-sm leading-6 text-muted">
                  The journal directory is unavailable because a database has
                  not been configured for this environment.
                </p>
              ) : featuredJournals.length > 0 ? (
                <div className="mt-6">
                  <article>
                    <p className="text-xs font-medium text-muted">
                      {featuredJournals[0].organizationName}
                    </p>
                    <h3 className="mt-2 break-words font-display text-3xl leading-tight tracking-tight text-forest-deep sm:text-4xl">
                      <Link
                        className="decoration-coral decoration-2 underline-offset-4 hover:underline"
                        href={`/journals/${featuredJournals[0].organizationSlug}/${featuredJournals[0].slug}`}
                      >
                        {featuredJournals[0].title}
                      </Link>
                    </h3>
                    {featuredJournals[0].description ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                        {featuredJournals[0].description}
                      </p>
                    ) : null}
                    <Link
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                      href={`/journals/${featuredJournals[0].organizationSlug}/${featuredJournals[0].slug}`}
                    >
                      View journal profile
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>

                  {featuredJournals.length > 1 ? (
                    <ul className="mt-6 divide-y divide-line border-t border-line">
                      {featuredJournals.slice(1).map((journal) => (
                        <li
                          className="py-4 last:pb-0"
                          key={`${journal.organizationSlug}/${journal.slug}`}
                        >
                          <p className="text-xs text-muted">
                            {journal.organizationName}
                          </p>
                          <Link
                            className="mt-1 inline-block font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-forest"
                            href={`/journals/${journal.organizationSlug}/${journal.slug}`}
                          >
                            {journal.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p
                  className="mt-6 rounded-xl border border-dashed border-line bg-white/60 p-5 text-sm leading-6 text-muted"
                  role="status"
                >
                  There are no public journals yet. A journal will appear here
                  after its profile is published.
                </p>
              )}

              <div className="mt-7 border-t border-line pt-5">
                <Link
                  className="inline-flex items-center gap-2 text-sm font-bold text-forest hover:text-forest-deep"
                  href="/journals"
                >
                  Browse the journal directory
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="platform-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
        id="platform"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest">
              Our mission
            </p>
            <h2
              className="mt-4 max-w-lg font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl"
              id="platform-heading"
            >
              From journal discovery to responsible publishing.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              This platform is being built as multi-tenant scholarly publishing
              infrastructure. Editorial decisions remain with authorized
              people, and each stage is designed to be traceable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {platformCapabilities.map((capability, index) => (
              <article
                className="flex min-h-60 flex-col rounded-2xl border border-line bg-white p-5 sm:p-6"
                key={capability.title}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">
                    0{index + 1}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${capability.labelClassName}`}
                  >
                    {capability.label}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-2xl leading-tight text-ink">
                  {capability.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-deep">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between md:py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              For scholarly communities
            </p>
            <p className="mt-2 max-w-2xl text-lg leading-7 text-ink">
              Designed for publishers, universities, research institutions,
              associations, and journals—with distinct needs and policies.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-forest px-5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            href="/admin/organizations"
          >
            Publisher workspace
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
