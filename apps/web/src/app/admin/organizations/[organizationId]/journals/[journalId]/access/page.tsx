import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { WorkspaceHeader } from "@/components/workspace-header";
import { getOrganizationWorkspace, listJournalStaff } from "@/modules/tenancy/application/use-cases";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import {
  GrantJournalRoleForm,
  RevokeJournalRoleForm,
} from "@/modules/tenancy/presentation/journal-access-forms";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

const scopeSchema = z.object({ organizationId: z.uuid(), journalId: z.uuid() });

export default async function JournalAccessPage({
  params,
}: {
  params: Promise<{ organizationId: string; journalId: string }>;
}) {
  const parsed = scopeSchema.safeParse(await params);
  if (!parsed.success || !isOidcConfigured) notFound();

  const userId = (await auth())?.user?.id;
  if (!userId) notFound();

  const { organizationId, journalId } = parsed.data;
  const tenancy = createPostgresTenancyRepository(getDatabase());
  const workspace = await getOrganizationWorkspace(tenancy, userId, organizationId);
  const journal = workspace?.journals.find((item) => item.id === journalId);
  if (!workspace || !journal) notFound();

  const staff = await listJournalStaff(tenancy, userId, organizationId, journalId);

  return (
    <>
      <WorkspaceHeader />
      <main className="min-h-[70vh] bg-paper text-ink" id="main-content">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link className="inline-flex min-h-11 items-center text-forest underline underline-offset-4" href="/admin/organizations">Organizations</Link>
            <span aria-hidden="true">/</span>
            <Link className="inline-flex min-h-11 items-center text-forest underline underline-offset-4" href={`/admin/organizations/${organizationId}`}>{workspace.organization.name}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Journal access</span>
          </nav>

          <header className="mt-7 border-b border-line pb-7">
            <p className="text-sm font-semibold text-forest">Journal access</p>
            <h1 className="mt-2 max-w-3xl break-words font-display text-4xl leading-tight sm:text-5xl">{journal.title}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Manage roles for this journal. Each change records who made it and why.
            </p>
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)] lg:items-start">
            <section aria-labelledby="staff-heading" className="min-w-0">
              <h2 className="font-display text-2xl" id="staff-heading">Active journal roles</h2>
              {staff.length === 0 ? (
                <p className="mt-4 rounded-xl border border-line bg-white p-5 leading-7 text-muted" role="status">
                  No journal roles have been assigned. Organization admins retain access through their organization membership.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {staff.map((member) => (
                    <li className="min-w-0 rounded-xl border border-line bg-white p-5" key={member.id}>
                      <p className="break-words font-semibold text-ink">{member.name || member.email || "Signed-in account"}</p>
                      {member.name && member.email ? <p className="mt-1 break-all text-sm text-muted">{member.email}</p> : null}
                      <p className="mt-2 text-sm text-muted">
                        <span className="capitalize">{member.role.replaceAll("_", " ")}</span>
                        <span aria-hidden="true"> · </span>
                        <time dateTime={member.createdAt.toISOString()}>
                          Granted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(member.createdAt)}
                        </time>
                      </p>
                      <RevokeJournalRoleForm
                        journalId={journalId}
                        membershipId={member.id}
                        organizationId={organizationId}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <GrantJournalRoleForm journalId={journalId} organizationId={organizationId} />
          </div>
        </div>
      </main>
    </>
  );
}
