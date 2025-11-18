import type { FC } from "react";
import type { WealthOverview } from "../lib/types";

interface WealthSnapshotProps {
  overview: WealthOverview;
}

const formatCurrency = (value: number, currency: string) => {
  if (!Number.isFinite(value)) return "-";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

const formatPercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}%`;
};

const WealthSnapshot: FC<WealthSnapshotProps> = ({ overview }) => {
  const c = overview.primaryCurrency;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100/95 p-5 shadow-xl shadow-primary/10 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-10 top-4 h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-6 bottom-2 h-20 w-20 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-24 w-24 -translate-x-1/2 rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-base-content/80">
          Today / This Month
        </div>
        <div className="text-[11px] text-base-content/60">
          Cash + certificates + investments, plus this month’s inflow/outflow story.
        </div>
      </div>

      <div className="relative mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-md shadow-primary/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
              Net Stash
            </h2>
            <p className="mt-1 text-2xl font-semibold text-base-content md:text-3xl">
              {formatCurrency(overview.totalNetWorth, c)}
            </p>
            <p className="mt-1 text-xs text-base-content/70">
              Cash, certificates, and investments combined.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-base-content/70">
              <span>
                This month change:{" "}
                <span className="font-semibold">
                  {formatCurrency(overview.monthStory.netChange, c)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-200/60 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {formatPercent(overview.monthStory.netChangePercent)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-md shadow-primary/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
                Money Map
              </h2>
              <span className="text-[11px] text-base-content/60">
                {overview.accounts.length} accounts • {overview.instruments.length} instruments
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-base-content/70 sm:grid-cols-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-base-content/60">
                  Cash
                </div>
                <div className="font-semibold">
                  {formatCurrency(overview.totalCash, c)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-base-content/60">
                  Certificates
                </div>
                <div className="font-semibold">
                  {formatCurrency(overview.totalCertificates, c)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-base-content/60">
                  Investments
                </div>
                <div className="font-semibold">
                  {formatCurrency(overview.totalInvestments, c)}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-base-content/60">
              This is the map. Driving logic evolves as you add flows, levels, and projections.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
            Monthly Story
          </h2>
          <p className="mt-2 text-sm text-base-content/75">{overview.monthStory.story}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-base-content/70">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-base-content/60">
                Deposits + income
              </div>
              <div className="font-semibold">
                {formatCurrency(
                  overview.monthStory.totalDeposits +
                    overview.monthStory.totalIncome +
                    overview.monthStory.totalInterest,
                  c,
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-base-content/60">
                Withdrawals + expenses
              </div>
              <div className="font-semibold">
                {formatCurrency(
                  overview.monthStory.totalWithdrawals + overview.monthStory.totalExpenses,
                  c,
                )}
              </div>
            </div>
          </div>
          <footer className="mt-4 text-[11px] text-base-content/60">
            Later, Wall Street Drive will send this summary into the Daily Thread as your Money Pulse.
          </footer>
        </div>
      </div>
    </article>
  );
};

export default WealthSnapshot;
