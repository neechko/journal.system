import Link from "next/link";

export function PublicSiteFooter() {
  return (
    <footer className="bg-forest-deep text-white">
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
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/90">
            A shared home for journals from different publishing organizations.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-white">
            Journal pages
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
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
          <h2 className="text-xs font-semibold text-white">
            Product status
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/90">
            Journal profiles are public. Author drafts require institutional
            sign-in and storage enabled only for local development. Do not upload
            real manuscripts. Editorial and production workflows are in progress.
          </p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/90 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>Scholarly Publishing Platform</p>
          <p>Product identity and policies are still being defined.</p>
        </div>
      </div>
    </footer>
  );
}
