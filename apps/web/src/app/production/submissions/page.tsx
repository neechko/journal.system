import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { listAcceptedSubmissionsUseCase } from "@/modules/production/application/use-cases";
import { createPostgresProductionRepository } from "@/modules/production/infrastructure/postgres-repository";
import { createPostgresTenancyRepository } from "@/modules/tenancy/infrastructure/postgres-repository";
import { auth, isOidcConfigured } from "@/server/auth";
import { getDatabase } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Production workspace",
  robots: { index: false, follow: false },
};

export default async function ProductionSubmissionsPage() {
  if (!isOidcConfigured) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <PublicSiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
            <Link className="hover:text-forest" href="/">
              Home
            </Link>
            <span aria-hidden="true" className="mx-2 text-line">/</span>
            <span aria-current="page">Production workspace</span>
          </nav>
          <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">Production workspace</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              The production workspace is not enabled yet.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              This area requires an institutional OIDC identity provider and database
              configuration. The platform does not provide demo accounts or authentication
              shortcuts.
            </p>
          </div>
        </div>
        <PublicSiteFooter />
      </main>
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <PublicSiteHeader />
        <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            Production workspace
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            Sign in to manage production.
          </h1>
        </section>
        <PublicSiteFooter />
      </main>
    );
  }

  // TODO: Implement proper production access check
  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted">
          <Link className="hover:text-forest" href="/">
            Home
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">/</span>
          <span aria-current="page">Production workspace</span>
        </nav>
        <header className="mt-8 max-w-3xl border-b border-line pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
            Production workspace
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Accepted submissions ready for production
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Your production dashboard will appear here once production roles are implemented.
          </p>
        </header>
      </div>
      <PublicSiteFooter />
    </main>
  );
}