'use client';

import { useEffect } from "react";

import Button from "@/app/DesignSystem/components/Button";
import SearchInput from "@/app/DesignSystem/components/SearchInput";
import { setItem } from "@/lib/user-storage";

/**
 * Baseline primitives (single default for each)
 * - We still persist keys so future variants can reuse the same storage.
 */
export default function PrimitivesPicker() {
  useEffect(() => {
    setItem("gaia.buttonStyle", "default");
    setItem("gaia.searchStyle", "default");
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Default Button</h3>
        <div className="mt-2">
          <Button>Primary Action</Button>
        </div>
        <p className="mt-1 text-xs gaia-muted">One default style for Phase 5 baseline.</p>
      </div>

      <div>
        <h3 className="text-sm font-medium">Default Search Bar</h3>
        <div className="mt-2 max-w-xl">
          <SearchInput />
        </div>
        <p className="mt-1 text-xs gaia-muted">Single global style, used in the App Bar.</p>
      </div>
    </div>
  );
}
