'use client';

import {
  useDesign,
  type Theme,
} from "@/app/DesignSystem/context/DesignProvider";
import { THEMES } from "@/app/DesignSystem/theme";

export default function ThemePicker() {
  const { theme, setTheme } = useDesign();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Theme</label>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className="gaia-input w-full max-w-xs rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus"
      >
        {THEMES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <p className="gaia-muted text-xs">
        Phase 5 baseline: themes apply globally via <code>data-theme</code>.
      </p>
    </div>
  );
}
