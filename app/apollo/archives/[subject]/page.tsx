import { notFound } from "next/navigation";
import ClientWrapper from "./components/ClientWrapper";

export default function SubjectPage({
  params,
}: {
  params: { subject: string };
}) {
  const { subject } = params;
  // Client will validate and render errors; page shell stays light.
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <ClientWrapper subjectId={subject} />
    </main>
  );
}
