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

const TAB_BUTTON = "px-4 py-2 text-sm font-medium transition-colors";
const ACTIVE_TAB = `${TAB_BUTTON} bg-primary text-primary-foreground rounded-lg shadow-sm`;
const INACTIVE_TAB = `${TAB_BUTTON} text-muted-foreground hover:text-foreground`;

export function LevelsViewWithTabs({ metrics }: LevelsViewProps) {
  const currentStage = determineWealthLevel(metrics);
  const [selectedLevel, setSelectedLevel] = useState<WealthLevel>(
    currentStage.level
  );

  const selectedThreshold = WEALTH_LEVEL_THRESHOLDS.find(
    (t) => t.level === selectedLevel
  )!;
  const targetAmount = selectedThreshold.meMultiplier * metrics.monthlyExpenses;
  const isPastLevel = metrics.monthsOfBuffer >= selectedThreshold.meMultiplier;
  const isCurrentLevel = selectedThreshold.level === currentStage.level;

  return (
    <div className="space-y-6">
      {/* Level selection tabs */}
      <div className="flex items-center gap-2 bg-muted/10 p-1 rounded-lg w-fit">
        {WEALTH_LEVEL_THRESHOLDS.map((threshold) => (
          <button
            key={threshold.level}
            className={
              selectedLevel === threshold.level ? ACTIVE_TAB : INACTIVE_TAB
            }
            onClick={() => setSelectedLevel(threshold.level)}
          >
            {threshold.level.replace(/L\d-/, "")}{" "}
            {/* Remove L# prefix for cleaner display */}
          </button>
        ))}
      </div>

      {/* Selected level display */}
      <div
        className={`p-6 rounded-lg border transition-transform duration-200 ${
          isCurrentLevel
            ? "border-primary bg-primary/5 scale-105 ring-2 ring-primary/20 shadow-lg"
            : isPastLevel
            ? "border-green-200 bg-green-50"
            : "border-muted bg-card"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            {selectedLevel}
            {isCurrentLevel && (
              <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full shadow-sm">
                Current level
              </span>
            )}
          </h3>
          <div className="text-sm text-muted-foreground">
            Target savings: {targetAmount.toLocaleString("en-EG")} EGP
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

        {/* Additional level-specific details */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-card border gaia-border">
              <div className="text-sm text-muted-foreground">
                Required Monthly Buffer
              </div>
              <div className="font-medium mt-1">
                {selectedThreshold.meMultiplier}× monthly expenses
              </div>
            </div>
            <div className="p-4 rounded-md bg-card border gaia-border">
              <div className="text-sm text-muted-foreground">
                Current Buffer
              </div>
              <div className="font-medium mt-1">
                {metrics.monthsOfBuffer.toFixed(1)}× monthly expenses
              </div>
            </div>
          </div>

          {selectedThreshold.checkNetWorth && (
            <div className="p-4 rounded-md bg-card border gaia-border">
              <div className="text-sm text-muted-foreground">
                Net Worth Requirement
              </div>
              <div className="mt-1">
                <div className="font-medium">
                  Target: {targetAmount.toLocaleString("en-EG")} EGP
                </div>
                <div className="text-sm mt-1">
                  Current: {metrics.netWorth.toLocaleString("en-EG")} EGP
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
            </div>
          )}

          {/* Level description */}
          <div className="p-4 rounded-md bg-card border gaia-border">
            <div className="text-sm text-muted-foreground mb-2">
              Level Details
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                • Buffer requirement: {selectedThreshold.meMultiplier}× monthly
                expenses (
                {(
                  selectedThreshold.meMultiplier * metrics.monthlyExpenses
                ).toLocaleString("en-EG")}{" "}
                EGP)
              </li>
              {selectedThreshold.checkNetWorth && (
                <li>• Net worth must match or exceed the buffer requirement</li>
              )}
              <li>
                • Current progress:{" "}
                {Math.round((metrics.liquidSavings / targetAmount) * 100)}% of
                target
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
