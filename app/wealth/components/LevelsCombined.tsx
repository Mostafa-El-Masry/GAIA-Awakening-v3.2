"use client";

import { useState } from "react";
import {
  WealthLevel,
  FinancialMetrics,
  WEALTH_LEVEL_THRESHOLDS,
} from "../lib/wealthLevels";
import { determineWealthLevel } from "../lib/wealthCalculations";

interface LevelsViewProps {
  metrics: FinancialMetrics;
}

export function LevelsView({ metrics }: LevelsViewProps) {
  const currentStage = determineWealthLevel(metrics);
  const [selectedLevel, setSelectedLevel] = useState<WealthLevel>(
    currentStage.level
  );

  const selectedThreshold = WEALTH_LEVEL_THRESHOLDS.find(
    (t) => t.level === selectedLevel
  )!;
  const isCurrentLevel = selectedLevel === currentStage.level;
  const isPastLevel = metrics.monthsOfBuffer >= selectedThreshold.meMultiplier;
  const targetAmount = selectedThreshold.meMultiplier * metrics.monthlyExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {WEALTH_LEVEL_THRESHOLDS.map((threshold) => (
          <button
            key={threshold.level}
            onClick={() => setSelectedLevel(threshold.level)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              selectedLevel === threshold.level &&
              threshold.level === currentStage.level
                ? "bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary/30"
                : selectedLevel === threshold.level
                ? "bg-primary text-primary-foreground shadow-sm"
                : metrics.monthsOfBuffer >= threshold.meMultiplier
                ? "bg-green-100 text-green-800 border border-green-300 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {threshold.level.replace(/L\d-/, "")}
          </button>
        ))}
      </div>

      <div
        className={`p-6 rounded-lg border transition-all duration-300 ${
          isCurrentLevel
            ? "border-primary bg-primary/8 scale-[1.03] ring-2 ring-primary/30 shadow-lg hover:shadow-xl hover:scale-[1.04]"
            : isPastLevel
            ? "border-green-300 bg-green-50/70 shadow-sm hover:shadow hover:scale-[1.01]"
            : "border-muted bg-card hover:border-muted/80 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              {selectedLevel}
              {isCurrentLevel && (
                <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full shadow-sm">
                  Current level
                </span>
              )}
            </h3>
            <div className="text-sm text-muted-foreground mt-1">
              Target savings: {targetAmount.toLocaleString("en-EG")} EGP
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-sm font-medium">
              {Math.round((metrics.liquidSavings / targetAmount) * 100)}%
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isPastLevel
                  ? "bg-green-500"
                  : isCurrentLevel
                  ? "bg-primary"
                  : "bg-muted"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (metrics.liquidSavings / targetAmount) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md bg-card border gaia-border">
            <div className="text-sm text-muted-foreground">Required Buffer</div>
            <div className="font-medium mt-1">
              {selectedThreshold.meMultiplier}× monthly expenses
              <div className="text-sm text-muted-foreground mt-1">
                (
                {(
                  selectedThreshold.meMultiplier * metrics.monthlyExpenses
                ).toLocaleString("en-EG")}{" "}
                EGP)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-card border gaia-border">
            <div className="text-sm text-muted-foreground">Current Status</div>
            <div className="font-medium mt-1">
              {metrics.monthsOfBuffer.toFixed(1)}× monthly expenses
              <div className="text-sm text-muted-foreground mt-1">
                ({metrics.liquidSavings.toLocaleString("en-EG")} EGP liquid)
              </div>
            </div>
          </div>
        </div>

        {selectedThreshold.checkNetWorth && (
          <div className="mt-4 p-4 rounded-md bg-card border gaia-border">
            <div className="text-sm text-muted-foreground">Net Worth Check</div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-sm text-muted-foreground">Required</div>
                <div className="font-medium">
                  {targetAmount.toLocaleString("en-EG")} EGP
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current</div>
                <div className="font-medium">
                  {metrics.netWorth.toLocaleString("en-EG")} EGP
                </div>
              </div>
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.netWorth >= targetAmount
                    ? "bg-green-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (metrics.netWorth / targetAmount) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LevelsViewWithTabs({ metrics }: LevelsViewProps) {
  // reuse the same logic but expose a variation with tab styles if needed
  return <LevelsView metrics={metrics} />;
}

export default LevelsView;
