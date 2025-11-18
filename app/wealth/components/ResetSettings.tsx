"use client";

"use client";

import { removeItem } from "@/lib/user-storage";

export default function ResetSettings() {
  const handleReset = () => {
    const key = "gaia_wealth_settings_v2";
    removeItem(key);
    window.location.reload();
  };

  return (
    <button
      onClick={handleReset}
      className="px-3 py-1 rounded text-sm bg-destructive text-destructive-foreground"
    >
      Reset Settings
    </button>
  );
}
