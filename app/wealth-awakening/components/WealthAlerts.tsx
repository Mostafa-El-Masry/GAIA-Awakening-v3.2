"use client";

import type { WealthOverview } from "../lib/types";
import { buildLevelsSnapshot } from "../lib/levels";

type Props = {
  overview: WealthOverview;
};

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "–";
  return `${value.toFixed(1)}%`;
}

export default function WealthAlerts({ overview }: Props) {
  const levelsSnapshot = buildLevelsSnapshot(overview);
  const alerts: string[] = [];

  const primaryCurrency = overview.primaryCurrency;

  const monthsSaved = levelsSnapshot.monthsOfExpensesSaved;
  const coverage = levelsSnapshot.coveragePercent;
  const expenses = levelsSnapshot.estimatedMonthlyExpenses;
  const passive = levelsSnapshot.monthlyPassiveIncome ?? 0;

  // 1) Runway signal
  if (monthsSaved == null || !Number.isFinite(monthsSaved)) {
    alerts.push(
      "GAIA does not yet see a full month of expenses. Once you log at least one month, it will estimate your runway and place you more precisely on the ladder."
    );
  } else if (monthsSaved < 1) {
    alerts.push(
      "Your buffer in the primary currency is still thin — less than one month of typical expenses. A gentle next step is to build towards a full month of runway."
    );
  } else if (monthsSaved >= 1 && monthsSaved < 3) {
    alerts.push(
      "You have roughly one to three months of expenses saved in your primary currency. The next checkpoint on the ladder is a 3‑month runway."
    );
  } else if (monthsSaved >= 3 && monthsSaved < 6) {
    alerts.push(
      "You have around three months of expenses saved. That is a solid base. From here, a calm next target is a 6‑month runway."
    );
  } else if (monthsSaved >= 6 && monthsSaved < 12) {
    alerts.push(
      "You have about six months or more of expenses saved. This is a strong stability zone. The next milestone is reaching roughly one year of runway."
    );
  } else if (monthsSaved >= 12) {
    alerts.push(
      "You have roughly a year or more of expenses saved in your primary currency. This is firmly in the Stable territory."
    );
  }

  // 2) Interest coverage signal
  if (expenses && expenses > 0 && coverage != null && Number.isFinite(coverage)) {
    if (coverage >= 100) {
      alerts.push(
        "Based on the current month, interest alone could roughly cover your typical expenses. This does not have to be permanent, but it is an important milestone."
      );
    } else if (coverage >= 50) {
      alerts.push(
        `Interest is currently covering around ${formatPercent(
          coverage
        )} of your estimated monthly expenses. You are well on the way towards Interest cover.`
      );
    } else if (coverage > 0) {
      alerts.push(
        `Interest is beginning to help, covering about ${formatPercent(
          coverage
        )} of your estimated monthly expenses.`
      );
    }
  } else if (!expenses || expenses === 0) {
    alerts.push(
      "GAIA cannot yet estimate your monthly expenses from the flows it sees. Once you log grouped expense flows for at least one month, coverage and runway will become clearer."
    );
  }

  // 3) Monthly story direction (net positive / negative)
  const story = overview.monthStory;
  if (story.netChange < 0) {
    alerts.push(
      "This month your net stash is slightly down. That is okay — some months are for spending. GAIA is simply marking that more went out than came in."
    );
  } else if (story.netChange > 0) {
    alerts.push(
      "This month your net stash is up. Even small positive moves accumulate over time."
    );
  }

  // 4) Gentle nudge for using interest in the primary currency
  if (passive > 0 && primaryCurrency) {
    alerts.push(
      `GAIA sees about ${formatCurrency(
        passive,
        primaryCurrency
      )} of interest this month in your primary currency. Over time, these calm, repeated interest events are what build your safety net.`
    );
  }

  // De‑duplicate messages if any overlap
  const uniqueAlerts = Array.from(new Set(alerts));

  if (uniqueAlerts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
      <h2 className="text-sm font-semibold text-base-content">
        Wealth voice & guardrails
      </h2>
      <p className="mt-1 text-xs text-base-content/70">
        A calm mirror of where you stand right now. No blame, no pressure —
        just soft signals about your buffer and how much interest is helping.
      </p>
      <ul className="mt-3 space-y-2 text-xs text-base-content/80">
        {uniqueAlerts.map((msg, idx) => (
          <li
            key={idx}
            className="flex gap-2 rounded-xl bg-base-200/70 px-3 py-2 text-left"
          >
            <span className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-semibold text-primary">
              {idx + 1}
            </span>
            <span>{msg}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
