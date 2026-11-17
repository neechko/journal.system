export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-16 text-ink sm:px-8"
      id="main-content"
    >
      <p className="text-base" role="status">
        Loading page content…
      </p>
    </main>
  );
}
