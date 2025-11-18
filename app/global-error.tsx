"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};


export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen gaia-surface">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-sm opacity-70">
            We could not render this page. You can try again or head back to the intro screen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="gaia-border rounded-lg border px-4 py-2 text-sm font-semibold"
              onClick={reset}
            >
              Try again
            </button>
            <a
              href="/"
              className="gaia-border rounded-lg border px-4 py-2 text-sm font-semibold"
            >
              Go home
            </a>
          </div>
          {error?.digest && (
            <p className="text-xs opacity-40">Error id: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
