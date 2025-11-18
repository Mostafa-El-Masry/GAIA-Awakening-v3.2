"use client";

import { useState } from "react";

export type FilterState = {
  q: string;
  type: "All" | "income" | "expense" | "transfer";
  category: string;
  from?: string; // YYYY-MM-DD
  to?: string;
};

const PANEL = "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const INPUT = "gaia-input rounded-lg px-3 py-1.5";
const BUTTON =
  "gaia-border gaia-surface rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm";

export default function Filters({
  onChange,
}: {
  onChange: (f: FilterState) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<FilterState["type"]>("All");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);

  function emit() {
    onChange({ q, type, category, from, to });
  }

  return (
    <div className={PANEL}>
      <div className="grid grid-cols-3 gap-2">
        <input
          className={INPUT}
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={emit}
        />
        <select
          className={INPUT}
          value={type}
          onChange={(e) => {
            setType(e.target.value as FilterState["type"]);
            setTimeout(emit, 0);
          }}
        >
          <option value="All">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <input
          className={INPUT}
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onBlur={emit}
        />
      </div>
    </div>
  );
}
