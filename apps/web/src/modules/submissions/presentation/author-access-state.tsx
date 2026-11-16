import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export function AuthorAccessState({
  heading,
  message,
  signInHref,
}: {
  heading: string;
  message: string;
  signInHref?: string;
}) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <PublicSiteHeader />
      <section className="mx-auto min-h-[55vh] max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
          Author workspace
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          {heading}
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-muted">{message}</p>
        {signInHref ? (
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
            href={signInHref}
          >
            Sign in with OIDC
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        ) : null}
      </section>
      <PublicSiteFooter />
    </main>
  );
}
