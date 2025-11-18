"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";

export default function TimelineLayout({ children }: { children: ReactNode }) {
  return <PermissionGate permission="timeline">{children}</PermissionGate>;
}

