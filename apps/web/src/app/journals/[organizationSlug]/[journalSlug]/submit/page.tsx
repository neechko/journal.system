import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getPublicJournal } from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { AuthorAccessState } from "@/modules/submissions/presentation/author-access-state";
import { DraftSubmissionForm } from "@/modules/submissions/presentation/draft-submission-form";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start a submission draft",
  robots: { index: false, follow: false },
};

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export default async function StartSubmissionDraftPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; journalSlug: string }>;
}) {
  const { organizationSlug, journalSlug } = await params;
  if (
    !slugSchema.safeParse(organizationSlug).success ||
    !slugSchema.safeParse(journalSlug).success
  ) {
    notFound();
  }

  const journal = await getPublicJournal(
    createPostgresTenancyRepository(getDatabase()),
    organizationSlug,
    journalSlug,
  );
  if (!journal) {
    notFound();
  }

  const callbackUrl = `/journals/${organizationSlug}/${journalSlug}/submit`;
  if (!isOidcConfigured) {
    return (
      <AuthorAccessState
        heading="Draft submissions are not enabled in this environment."
        message="Configure the institutional OIDC provider before creating author accounts or saving private submission metadata. Demo accounts and authentication shortcuts are not available."
      />
    );
  }

  const actorUserId = (await auth())?.user?.id;
  if (!actorUserId) {
    return (
      <AuthorAccessState
        heading="Sign in to start a submission draft."
        message="Draft metadata is private to the authenticated author. Signing in uses this journal platform's configured institutional identity provider."
        signInHref={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      />
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink" data-journal={journalSlug}>
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <Link
            className="hover:text-forest"
            href={`/journals/${organizationSlug}/${journalSlug}`}
          >
            {journal.title}
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">New draft</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            Author workspace
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Start a submission draft
          </h1>
          <p className="mt-4 leading-7 text-muted">
            {journal.title} · {journal.organizationName}
          </p>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Save a working title, abstract, and optional keywords before
            preparing your manuscript. This draft is visible only to you and
            does not enter editorial review.
          </p>
        </header>

        <section className="mt-8 max-w-3xl">
          <DraftSubmissionForm
            mode="create"
            journalSlug={journalSlug}
            organizationSlug={organizationSlug}
          />
        </section>
      </div>
      <PublicSiteFooter />
    </main>
  );
}
