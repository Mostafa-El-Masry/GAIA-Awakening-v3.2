"use client";

import dynamic from "next/dynamic";

const SubjectsClient = dynamic(() => import("./SubjectsClient"), {
  ssr: false,
});

export default function SubjectsWrapper() {
  return <SubjectsClient />;
}
