import Link from "next/link";

export function PublicSiteFooter() {
  return (
    <footer className="bg-brand text-brand-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div>
          <Link
            className="inline-flex items-center gap-3"
            href="/"
            aria-label="Scholarly Publishing Platform home"
          >
            <span className="text-sm font-semibold tracking-wide">
              Scholarly Publishing Platform
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-brand-muted">
            A shared home for journals from different publishing organizations.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-brand-ink">
            Journal pages
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-brand-muted">
            <li>
              <Link className="inline-flex min-h-11 items-center underline decoration-brand-ink/50 underline-offset-4 hover:decoration-brand-ink" href="/journals">
                Journal directory
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center underline decoration-brand-ink/50 underline-offset-4 hover:decoration-brand-ink" href="/">
                Platform home
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-brand-ink">
            Product status
          </h2>
          <p className="mt-4 text-sm leading-6 text-brand-muted">
            Journal profiles are public. Author drafts require institutional
            sign-in and storage enabled only for local development. Do not upload
            real manuscripts. Editorial and production workflows are in progress.
          </p>
        </div>
      </div>
      <div className="border-t border-brand-ink/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-brand-muted sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>Scholarly Publishing Platform</p>
          <p>Product identity and policies are still being defined.</p>
        </div>
      </div>
    </footer>
  );
}
