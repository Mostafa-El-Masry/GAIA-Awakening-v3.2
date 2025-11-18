'use client';

import PermissionGate from "@/components/permissions/PermissionGate";
import GalleryClient from "./GalleryClient";
import PasswordProtection from "./components/PasswordProtection";

export default function GalleryPageClient() {
  return (
    <PermissionGate permission="gallery">
      <PasswordProtection>
        <GalleryClient />
      </PasswordProtection>
    </PermissionGate>
  );
}

