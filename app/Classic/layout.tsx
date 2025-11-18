"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";

export default function ClassicLayout({ children }: { children: ReactNode }) {
  return <PermissionGate permission="classic">{children}</PermissionGate>;
}

