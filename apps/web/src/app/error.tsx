"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16 text-ink sm:px-8"
      id="main-content"
    >
      <h1 className="font-display text-3xl">This page could not be loaded.</h1>
      <p className="mt-4 max-w-xl text-muted">
        Please try loading it again.
      </p>
      <button
        className="mt-6 min-h-11 w-fit rounded-lg bg-forest px-5 font-semibold text-white hover:bg-forest-deep active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        onClick={reset}
        type="button"
      >
        Retry loading
      </button>
    </main>
  );
}
