import SubjectsWrapper from "./components/SubjectsWrapper";

export default function ArchivesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Archives</h1>
        <p className="text-sm gaia-muted">
          Eight starter subjects. Mark lessons as “teachable” and push them to
          Academy.
        </p>
      </header>
      <SubjectsWrapper />
    </main>
  );
}
