"use client";

import dynamic from "next/dynamic";

const VerticalTimeline = dynamic(() => import("./VerticalTimeline"), {
  ssr: false,
});

export default function TimelineWrapper() {
  return <VerticalTimeline />;
}
