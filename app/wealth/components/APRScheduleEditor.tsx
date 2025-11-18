import React from "react";
import { AppSettings } from "../lib/persistence";

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

export default function APRScheduleEditor({ settings, setSettings }: Props) {
  const updateApr = (index: number, value: number) => {
    const next = { ...settings };
    // Ensure APR is at least 0.1%
    const validValue = Math.max(0.1, value);
    next.aprSchedule = next.aprSchedule.map((row, i) =>
      i === index ? { ...row, aprPercent: validValue } : row
    );
    setSettings(next);
  };

  const addRow = () => {
    const next = { ...settings };
    const nextIndex = next.aprSchedule.length;
    next.aprSchedule = [
      ...next.aprSchedule,
      { monthIndex: nextIndex, aprPercent: 17 },
    ];
    setSettings(next);
  };

  const removeRow = (index: number) => {
    const next = { ...settings };
    next.aprSchedule = next.aprSchedule
      .filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, monthIndex: i }));
    setSettings(next);
  };

  return (
    <div className="p-4 rounded-md border gaia-border bg-card">
      <h3 className="font-semibold mb-2">Certificate APR Schedule</h3>
      <div className="space-y-2">
        {settings.aprSchedule.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="text-sm w-24">Month +{row.monthIndex}</div>
            <input
              type="number"
              step="0.1"
              value={row.aprPercent}
              onChange={(e) => updateApr(idx, Number(e.target.value))}
              className="w-28 p-1 rounded border gaia-border"
            />
            <div className="text-sm">% APR</div>
            <button
              onClick={() => removeRow(idx)}
              className="ml-auto text-sm text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        <div>
          <button
            onClick={addRow}
            className="px-3 py-1 rounded bg-primary text-white text-sm"
          >
            Add month
          </button>
        </div>
      </div>
    </div>
  );
}
