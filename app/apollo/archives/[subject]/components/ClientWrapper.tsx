"use client";

import dynamic from "next/dynamic";

const SubjectClient = dynamic(() => import("./SubjectClient"), { ssr: false });

export default function ClientWrapper({ subjectId }: { subjectId: string }) {
  return <SubjectClient subjectId={subjectId} />;
}
