import Link from "next/link";
import {
  listOrganizations,
} from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { OrganizationForm } from "@/modules/tenancy/presentation/organization-form";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { WorkspaceHeader } from "@/components/workspace-header";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  if (!isOidcConfigured) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <WorkspaceHeader />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
            <Link className="hover:text-forest" href="/">
              Home
            </Link>
            <span aria-hidden="true" className="mx-2 text-line">
              /
            </span>
            <span aria-current="page">Publisher workspace</span>
          </nav>
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-start lg:gap-16">
            <section aria-labelledby="workspace-locked-heading">
              <span className="inline-flex items-center gap-2 rounded-full bg-coral/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-forest">
                <span className="size-1.5 rounded-full bg-coral" />
                Publisher access
              </span>
              <h1
                className="mt-6 max-w-2xl font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl"
                id="workspace-locked-heading"
              >
                The publisher workspace is not enabled yet.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                This area can only be opened after an institutional OIDC
                identity provider and database have been configured. The
                platform does not provide demo accounts or authentication
                shortcuts.
              </p>
              <Link
                className="mt-8 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                href="/journals"
              >
                View public journal directory
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </section>

            <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
                Secure setup
              </p>
              <h2 className="mt-3 font-display text-2xl text-ink">
                Before enabling the workspace
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  "Choose and configure an OIDC identity provider.",
                  "Prepare the database and an audited platform-operator bootstrap.",
                  "Verify roles and tenant access before managing journals.",
                ].map((requirement, index) => (
                  <li className="flex gap-3 text-sm leading-6 text-muted" key={requirement}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-paper-deep text-xs font-bold text-forest">
                      {index + 1}
                    </span>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-line pt-5 text-xs leading-5 text-muted">
                Never share OIDC secret values in chat or source code.
              </p>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <WorkspaceHeader />
        <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            Publisher workspace
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            Sign in to manage organizations.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-muted">
            Authentication is handled by the configured institutional identity
            provider.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
            href="/api/auth/signin"
          >
            Sign in with OIDC
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </section>
      </main>
    );
  }

  const repository = createPostgresTenancyRepository(getDatabase());
  const [organizations, isPlatformOperator] = await Promise.all([
    listOrganizations(repository, userId),
    repository.isPlatformOperator(userId),
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <WorkspaceHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
          <span aria-current="page">Organizations</span>
        </nav>

        <header className="mt-8 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Publisher workspace
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Organizations you manage
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Manage journals within your access scope. Important actions are
              recorded in the organization audit trail.
            </p>
          </div>
          {isPlatformOperator ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-forest/10 px-3 py-2 text-xs font-semibold text-forest">
              <span className="size-1.5 rounded-full bg-forest" />
              Platform operator
            </span>
          ) : null}
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start xl:gap-10">
          <section aria-labelledby="organizations-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Access scope
                </p>
                <h2
                  className="mt-1 font-display text-2xl text-ink"
                  id="organizations-heading"
                >
                  Organizations
                </h2>
              </div>
              <p className="text-sm text-muted">
                {organizations.length} organizations
              </p>
            </div>

            {organizations.length > 0 ? (
              <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {organizations.map((organization) => (
                  <li key={organization.id}>
                    <Link
                      className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-forest/5 sm:p-6"
                      href={`/admin/organizations/${organization.id}`}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          aria-hidden="true"
                          className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper-deep text-lg font-semibold text-forest"
                        >
                          {organization.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">
                            {organization.name}
                          </span>
                          <span className="mt-1 block truncate text-sm text-muted">
                            /{organization.slug}
                          </span>
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-forest transition-colors group-hover:bg-lime"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 px-6 py-10 text-sm leading-6 text-muted"
                role="status"
              >
                You do not have any organizations to manage yet.
              </p>
            )}
          </section>

          <aside>
            {isPlatformOperator ? (
              <OrganizationForm />
            ) : (
              <section className="rounded-2xl border border-line bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest">
                  Platform access
                </p>
                <h2 className="mt-2 font-display text-2xl text-ink">
                  Need a new organization?
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Organizations are provisioned by a platform operator. Contact
                  your institutional administrator through the approved
                  operational channel.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
