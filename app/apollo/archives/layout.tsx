"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";

export default function ArchivesLayout({ children }: { children: ReactNode }) {
  return <PermissionGate permission="archives">{children}</PermissionGate>;
}

