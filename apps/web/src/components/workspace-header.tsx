import Link from "next/link";

export function WorkspaceHeader() {
  return (
    <header className="border-b border-white/10 bg-forest-deep text-white">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          aria-label="Return to platform home"
          className="flex items-center gap-3"
          href="/"
        >
          <span
            aria-hidden="true"
            className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-white/20"
          >
            <span className="absolute left-2 top-2 size-3.5 rounded-sm border border-lime" />
            <span className="absolute bottom-2 right-2 size-3.5 rounded-sm bg-coral" />
          </span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-lime">
              Workspace
            </span>
            <span className="block text-sm font-semibold text-white">
              Scholarly Publishing
            </span>
          </span>
        </Link>
        <Link
          className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:text-sm"
          href="/journals"
        >
          View public site
          <span aria-hidden="true" className="ml-2">
            ↗
          </span>
        </Link>
      </div>
    </header>
  );
}
