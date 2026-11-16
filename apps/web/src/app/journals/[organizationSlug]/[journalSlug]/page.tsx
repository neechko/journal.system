import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { AppError } from "@/modules/shared/app-error";
import { getPublicJournal } from "@/modules/tenancy/application/use-cases";
import type { PublishedJournal } from "@/modules/tenancy/application/ports";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { getDatabase } from "@/server/db/client";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

type PublicJournalPageProps = {
  params: Promise<{ organizationSlug: string; journalSlug: string }>;
};

const loadPublishedJournal = cache(
  async (
    organizationSlug: string,
    journalSlug: string,
  ): Promise<PublishedJournal | null> =>
    getPublicJournal(
      createPostgresTenancyRepository(getDatabase()),
      organizationSlug,
      journalSlug,
    ),
);

function createMetaDescription(journal: PublishedJournal): string {
  const description = journal.description?.replace(/\s+/g, " ").trim();
  if (!description) {
    return `Public profile for ${journal.title}, published by ${journal.organizationName}.`;
  }
  if (description.length <= 160) {
    return description;
  }

  const truncated = description.slice(0, 157);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 157).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: PublicJournalPageProps): Promise<Metadata> {
  const { organizationSlug, journalSlug } = await params;
  if (
    !slugSchema.safeParse(organizationSlug).success ||
    !slugSchema.safeParse(journalSlug).success
  ) {
    notFound();
  }

  try {
    const journal = await loadPublishedJournal(organizationSlug, journalSlug);
    if (!journal) {
      notFound();
    }

    const title = `${journal.title} | ${journal.organizationName}`;
    const description = createMetaDescription(journal);
    return {
      title,
      description,
      openGraph: {
        type: "website",
        title,
        description,
      },
    };
  } catch (error) {
    if (error instanceof AppError && error.code === "DATABASE_NOT_CONFIGURED") {
      return {
        title: "Journal page unavailable",
        description: "The journal page is not configured.",
      };
    }
    throw error;
  }
}

export default async function PublicJournalPage({
  params,
}: PublicJournalPageProps) {
  const { organizationSlug, journalSlug } = await params;
  if (
    !slugSchema.safeParse(organizationSlug).success ||
    !slugSchema.safeParse(journalSlug).success
  ) {
    notFound();
  }

  let journal: PublishedJournal | null;
  try {
    journal = await loadPublishedJournal(organizationSlug, journalSlug);
  } catch (error) {
    if (error instanceof AppError && error.code === "DATABASE_NOT_CONFIGURED") {
      return (
        <main className="min-h-screen bg-paper text-ink">
          <PublicSiteHeader />
          <div className="mx-auto min-h-[50vh] max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Journal profile
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Journal page unavailable
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-muted">
              Application storage has not been configured for this environment.
            </p>
          </div>
          <PublicSiteFooter />
        </main>
      );
    }
    throw error;
  }

  if (!journal) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-7xl px-5 pt-8 text-xs font-medium text-muted sm:px-8"
      >
        <Link className="hover:text-forest" href="/">
          Home
        </Link>
        <span aria-hidden="true" className="mx-2 text-line">
          /
        </span>
        <Link className="hover:text-forest" href="/journals">
          Journals
        </Link>
        <span aria-hidden="true" className="mx-2 text-line">
          /
        </span>
        <span aria-current="page">{journal.title}</span>
      </nav>

      <header className="relative mt-7 overflow-hidden bg-forest text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-56 size-[34rem] rounded-full border border-white/10"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lime">
            <span className="size-1.5 rounded-full bg-coral" />
            Public journal profile
          </p>
          <p className="mt-6 text-sm font-medium text-white/70">
            {journal.organizationName}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {journal.title}
          </h1>
          {journal.description ? (
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              {journal.description}
            </p>
          ) : null}
          <Link
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/35 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/journals"
          >
            <span aria-hidden="true">←</span>
            Back to journal directory
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div className="space-y-12">
          <section aria-labelledby="aims-scope-heading">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
              About this journal
            </p>
            <h2
              className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl"
              id="aims-scope-heading"
            >
              Aims and scope
            </h2>
            {journal.aimsScope ? (
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted">
                {journal.aimsScope}
              </p>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
                The journal publisher has not provided aims and scope
                information yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="author-guidelines-heading"
            className="border-t border-line pt-10"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
              For authors
            </p>
            <h2
              className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl"
              id="author-guidelines-heading"
            >
              Author guidelines
            </h2>
            {journal.authorGuidelines ? (
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted">
                {journal.authorGuidelines}
              </p>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
                Author guidelines have not been provided by the journal
                publisher yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section
            aria-labelledby="journal-information-heading"
            className="rounded-2xl border border-line bg-white p-6"
          >
            <h2
              className="font-display text-2xl text-ink"
              id="journal-information-heading"
            >
              Journal information
            </h2>
            <dl className="mt-5 divide-y divide-line">
              <div className="py-4 first:pt-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Publishing organization
                </dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-ink">
                  {journal.organizationName}
                </dd>
              </div>
              <div className="py-4 last:pb-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Availability
                </dt>
                <dd className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest">
                  <span className="size-1.5 rounded-full bg-forest" />
                  Profile published
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="article-workflow-heading"
            className="rounded-2xl bg-paper-deep p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Author workspace
            </p>
            <h2
              className="mt-3 font-display text-2xl leading-tight text-ink"
              id="article-workflow-heading"
            >
              Author submissions
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              The development prototype supports drafts, versioned PDF uploads,
              and submission. Institutional sign-in and development-only
              private storage must be configured. Do not use real or
              confidential manuscripts; editorial review, production, and
              publication are not available yet.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
              href={`/journals/${organizationSlug}/${journalSlug}/submit`}
            >
              Start a submission draft
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        </aside>
      </div>

      <PublicSiteFooter />
    </main>
  );
}
