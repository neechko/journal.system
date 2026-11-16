import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getOrganizationWorkspace } from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { JournalForm } from "@/modules/tenancy/presentation/journal-form";
import { JournalProfileForm } from "@/modules/tenancy/presentation/journal-profile-form";
import { JournalProfilePreview } from "@/modules/tenancy/presentation/journal-profile-preview";
import { PublishJournalForm } from "@/modules/tenancy/presentation/publish-journal-form";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { WorkspaceHeader } from "@/components/workspace-header";

export const dynamic = "force-dynamic";

export default async function OrganizationWorkspacePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  if (!z.uuid().safeParse(organizationId).success) {
    notFound();
  }

  if (!isOidcConfigured) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const workspace = await getOrganizationWorkspace(
    createPostgresTenancyRepository(getDatabase()),
    userId,
    organizationId,
  );
  if (!workspace) {
    notFound();
  }

  const publishedJournalCount = workspace.journals.filter(
    (journal) => journal.publishedAt !== null,
  ).length;
  const draftJournalCount = workspace.journals.length - publishedJournalCount;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <WorkspaceHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/admin/organizations">
            Organizations
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">{workspace.organization.name}</span>
        </nav>

        <header className="mt-8 rounded-[1.75rem] bg-forest px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">
            Organization workspace
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                {workspace.organization.name}
              </h1>
              <p className="mt-3 text-sm text-white/70">
                /{workspace.organization.slug}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:w-fit">
              <div className="min-w-32 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  Total journals
                </dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {workspace.journals.length}
                </dd>
              </div>
              <div className="min-w-32 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  Published
                </dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  {publishedJournalCount}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start xl:gap-10">
          <section aria-labelledby="journals-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Organization portfolio
                </p>
                <h2
                  className="mt-1 font-display text-3xl text-ink"
                  id="journals-heading"
                >
                  Journals
                </h2>
              </div>
              <p className="text-sm text-muted">
                {draftJournalCount} drafts · {publishedJournalCount} published
              </p>
            </div>

            {workspace.journals.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {workspace.journals.map((journal) => {
                  const isPublished = journal.publishedAt !== null;

                  return (
                    <li key={journal.id}>
                      <article className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                              /{workspace.organization.slug}/{journal.slug}
                            </p>
                            <h3 className="mt-3 break-words font-display text-2xl leading-tight text-ink sm:text-3xl">
                              {journal.title}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isPublished
                                ? "bg-forest/10 text-forest"
                                : "bg-paper-deep text-muted"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isPublished ? "bg-forest" : "bg-coral"
                              }`}
                            />
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        {journal.description ? (
                          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
                            {journal.description}
                          </p>
                        ) : null}

                        {!isPublished ? (
                          <JournalProfilePreview
                            journal={journal}
                            organizationName={workspace.organization.name}
                          />
                        ) : null}

                        {isPublished ? (
                          <Link
                            className="mt-5 inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-forest transition-colors hover:border-forest"
                            href={`/journals/${workspace.organization.slug}/${journal.slug}`}
                          >
                            View public page
                            <span aria-hidden="true" className="ml-2">
                              ↗
                            </span>
                          </Link>
                        ) : (
                          <PublishJournalForm
                            journalId={journal.id}
                            organizationId={workspace.organization.id}
                          />
                        )}

                        <details className="mt-6 border-t border-line pt-5">
                          <summary className="w-fit cursor-pointer text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest">
                            Manage public profile
                          </summary>
                          <JournalProfileForm
                            description={journal.description}
                            aimsScope={journal.aimsScope}
                            authorGuidelines={journal.authorGuidelines}
                            isPublished={isPublished}
                            journalId={journal.id}
                            organizationId={workspace.organization.id}
                          />
                        </details>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p
                className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 px-6 py-10 text-sm leading-6 text-muted"
                role="status"
              >
                There are no journals in this organization yet. Create a draft
                journal to begin setting up its public profile.
              </p>
            )}
          </section>

          <aside className="space-y-5">
            <JournalForm organizationId={workspace.organization.id} />
            <section className="rounded-2xl bg-paper-deep p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Development status
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink">
                Current scope
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                This workspace manages organization and journal profiles.
                Member invitations, editorial boards, submissions, reviews,
                and article archives are not available yet.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
