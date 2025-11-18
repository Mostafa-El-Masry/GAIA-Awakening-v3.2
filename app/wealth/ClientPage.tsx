"use client";

import WealthLevels from "./components/WealthLevels";

export default function WealthPage() {
  return (
    <main className="min-h-screen gaia-surface-soft">
      <div className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="gaia-strong text-3xl m-8 font-extrabold tracking-wide">
            Wealth
          </h1>
        </div>

        <WealthLevels />
      </div>
    </main>
  );
}
