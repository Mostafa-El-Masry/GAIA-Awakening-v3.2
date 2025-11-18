import PermissionGate from "@/components/permissions/PermissionGate";
import EleuthiaClient from "./components/EleuthiaClient";

export default function EleuthiaPage() {
  return (
    <PermissionGate permission="eleuthia">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <EleuthiaClient />
      </main>
    </PermissionGate>
  );
}

