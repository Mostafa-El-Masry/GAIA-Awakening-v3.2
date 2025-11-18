import React from "react";
import { AppSettings } from "../lib/persistence";

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

export default function SettingsBar({ settings, setSettings }: Props) {
  const updateField = (k: keyof AppSettings, v: any) => {
    const next = { ...settings, [k]: v } as AppSettings;
    setSettings(next);
  };

  const updateExpense = (id: string, amount: number) => {
    const next = { ...settings };
    next.expenses = next.expenses.map((e) =>
      e.id === id ? { ...e, amountKD: amount } : e
    );
    setSettings(next);
  };

  const updateApr = (v: number) => {
    const next = { ...settings } as typeof settings;
    const valid = Math.max(0.1, v);
    // If schedule is empty initialize a single entry. Otherwise update all entries
    if (!next.aprSchedule || next.aprSchedule.length === 0) {
      next.aprSchedule = [{ monthIndex: 0, aprPercent: valid }];
    } else {
      next.aprSchedule = next.aprSchedule.map((r) => ({
        ...r,
        aprPercent: valid,
      }));
    }
    setSettings(next);
  };

  return (
    <div className="p-4 rounded-md border gaia-border bg-card space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-muted-foreground block">
            Monthly income (KD)
          </label>
          <input
            className="w-full p-2 rounded border gaia-border"
            type="number"
            value={settings.monthlyIncomeKD}
            onChange={(e) =>
              updateField("monthlyIncomeKD", Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block">
            FX (EGP per KD)
          </label>
          <input
            className="w-full p-2 rounded border gaia-border"
            type="number"
            value={settings.fxEgpPerKd}
            onChange={(e) => updateField("fxEgpPerKd", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block">
            Live APR (%)
          </label>
          <input
            className="w-full p-2 rounded border gaia-border"
            type="number"
            step="0.1"
            value={settings.aprSchedule?.[0]?.aprPercent ?? ""}
            onChange={(e) => updateApr(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <div className="text-sm text-muted-foreground">Monthly expenses</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {settings.expenses.map((exp) => (
            <div key={exp.id} className="flex items-center gap-2">
              <div className="w-28 text-sm">{exp.name}</div>
              <input
                type="number"
                value={exp.amountKD}
                onChange={(e) => updateExpense(exp.id, Number(e.target.value))}
                className="p-1 rounded border gaia-border w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.reinvest}
            onChange={(e) => updateField("reinvest", e.target.checked)}
          />
          <span className="text-sm">Reinvest interest (ON)</span>
        </label>
        <div className="ml-auto space-y-2">
          <div>
            <label className="text-sm text-muted-foreground">
              Plan D target (EGP/month)
            </label>
            <input
              className="p-1 rounded border gaia-border w-32"
              type="number"
              value={settings.planDTargetMonthlyEgp}
              onChange={(e) =>
                updateField("planDTargetMonthlyEgp", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Plan C target (EGP/month)
            </label>
            <input
              className="p-1 rounded border gaia-border w-32"
              type="number"
              value={settings.planCTargetMonthlyEgp}
              onChange={(e) =>
                updateField("planCTargetMonthlyEgp", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Starting principal (EGP)
            </label>
            <input
              className="p-1 rounded border gaia-border w-32"
              type="number"
              value={settings.startingPrincipalEgp}
              onChange={(e) =>
                updateField("startingPrincipalEgp", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Reinvest %</label>
            <input
              className="p-1 rounded border gaia-border w-32"
              type="number"
              min={0}
              max={100}
              value={settings.reinvestPercent}
              onChange={(e) =>
                updateField("reinvestPercent", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
