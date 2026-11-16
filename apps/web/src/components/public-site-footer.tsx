import Link from "next/link";

export function PublicSiteFooter() {
  return (
    <footer className="bg-forest-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div>
          <Link
            className="inline-flex items-center gap-3"
            href="/"
            aria-label="Scholarly Publishing Platform — home"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-lg border border-white/25 text-sm font-semibold text-lime"
            >
              P
            </span>
            <span className="text-sm font-semibold tracking-wide">
              Scholarly Publishing Platform
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
            Multi-tenant scholarly publishing infrastructure for organizations,
            institutions, and journals.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-lime">
            Explore
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li>
              <Link className="hover:text-white" href="/journals">
                Journal directory
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/">
                Platform home
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-lime">
            Product status
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Journal discovery and public profiles are available. The author
            submission prototype supports draft metadata, versioned PDF upload,
            and submission, but requires institutional sign-in and
            development-only private storage. Do not use real or confidential
            manuscripts; editorial review, production, and publication remain
            in development.
          </p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/55 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>Scholarly Publishing Platform</p>
          <p>Product identity and policies are still being defined.</p>
        </div>
      </div>
    </footer>
  );
}
