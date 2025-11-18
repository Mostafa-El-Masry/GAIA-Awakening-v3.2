import DashboardWrapper from "./components/DashboardWrapper";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--gaia-text-strong)]">
          Dashboard
        </h1>
        <p className="mt-2 text-sm gaia-muted">
          Quick overview of your learning, builds, and safety.
        </p>
      </header>
      <DashboardWrapper />
    </main>
  );
}
