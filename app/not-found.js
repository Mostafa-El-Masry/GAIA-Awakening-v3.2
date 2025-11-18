// app/not-found.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 opacity-80">
          We couldn’t find what you’re looking for.
        </p>
        <Link href="/" className="mt-6 inline-block underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
