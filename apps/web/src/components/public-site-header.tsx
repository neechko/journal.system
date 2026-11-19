import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-3 px-5 py-2 sm:gap-5 sm:px-8">
        <Link
          aria-label="Scholarly Publishing Platform home"
          className="flex min-h-11 min-w-0 items-center"
          href="/"
        >
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-sm font-semibold leading-tight text-ink sm:text-lg">
              Scholarly Publishing Platform
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Journal index
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 text-sm font-medium text-ink md:flex"
        >
          <Link className="inline-flex min-h-11 items-center transition-colors hover:text-forest" href="/journals">
            Journals
          </Link>
          <Link
            className="inline-flex min-h-11 items-center transition-colors hover:text-forest"
            href="/#platform"
          >
            About the platform
          </Link>
          <Link
            className="inline-flex min-h-11 items-center transition-colors hover:text-forest"
            href="/admin/organizations"
          >
            For publishers
          </Link>
        </nav>

        <ThemeSwitcher />

        <details className="relative md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 border border-line-strong bg-paper px-3 text-sm font-semibold text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-4 [&::-webkit-details-marker]:hidden">
            Menu
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </summary>
          <nav
            aria-label="Main navigation"
            className="absolute right-0 top-full z-40 mt-2 w-56 border border-line-strong bg-paper p-2 shadow-lg"
          >
            <Link
              className="block px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-deep hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/journals"
            >
              Journals
            </Link>
            <Link
              className="block px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-deep hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/#platform"
            >
              About the platform
            </Link>
            <Link
              className="block px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-deep hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/admin/organizations"
            >
              For publishers
            </Link>
          </nav>
        </details>

        <Link
          className="hidden min-h-11 shrink-0 items-center justify-center bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:inline-flex"
          href="/journals"
        >
          Browse journals
        </Link>
      </div>
    </header>
  );
}
