"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";

export default function LockedLayout({ children }: { children: ReactNode }) {
  return <PermissionGate permission="locked">{children}</PermissionGate>;
}

