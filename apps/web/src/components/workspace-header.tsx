import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function WorkspaceHeader() {
  return (
    <header className="border-b border-white/10 bg-forest-deep text-white">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          aria-label="Return to platform home"
          className="flex min-h-11 items-center"
          href="/"
        >
          <span className="font-display text-base font-semibold text-white">
            Scholarly Publishing Platform
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher variant="workspace" />
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-white/25 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:text-sm"
            href="/journals"
          >
            View public site
            <span aria-hidden="true" className="ml-2">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
