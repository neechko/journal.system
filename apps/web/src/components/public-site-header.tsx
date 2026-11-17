import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          aria-label="Scholarly Publishing Platform — home"
          className="flex min-w-0 items-center gap-3"
          href="/"
        >
          <span
            aria-hidden="true"
            className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-forest"
          >
            <span className="absolute left-2.5 top-2.5 size-4 rounded-sm border border-lime" />
            <span className="absolute bottom-2.5 right-2.5 size-4 rounded-sm bg-coral" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              PLATFORM
            </span>
            <span className="block truncate text-sm font-semibold text-ink sm:text-base">
              Scholarly Publishing
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 text-sm font-medium text-ink md:flex"
        >
          <Link className="transition-colors hover:text-forest" href="/journals">
            Journals
          </Link>
          <Link
            className="transition-colors hover:text-forest"
            href="/#platform"
          >
            About the platform
          </Link>
          <Link
            className="transition-colors hover:text-forest"
            href="/admin/organizations"
          >
            For publishers
          </Link>
        </nav>

        <ThemeSwitcher />

        <details className="relative md:hidden">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest [&::-webkit-details-marker]:hidden">
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
            className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-line bg-paper p-2 shadow-xl"
          >
            <Link
              className="block rounded-xl px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/journals"
            >
              Journals
            </Link>
            <Link
              className="block rounded-xl px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/#platform"
            >
              About the platform
            </Link>
            <Link
              className="block rounded-xl px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
              href="/admin/organizations"
            >
              For publishers
            </Link>
          </nav>
        </details>

        <Link
          className="hidden min-h-10 shrink-0 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:inline-flex"
          href="/journals"
        >
          Explore journals
          <svg
            aria-hidden="true"
            className="ml-2 size-4"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              d="M4.5 10h10m-4-4 4 4-4 4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
