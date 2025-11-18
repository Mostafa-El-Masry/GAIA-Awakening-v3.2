import type { FC } from "react";
import type { WealthOverview, WealthAccountType } from "../lib/types";

interface WealthMapProps {
  overview: WealthOverview;
}

const typeLabels: Record<WealthAccountType, string> = {
  cash: "Cash & buffers",
  certificate: "Certificates / CDs",
  investment: "Investments",
  other: "Other",
};

const order: WealthAccountType[] = ["cash", "certificate", "investment", "other"];

const WealthMap: FC<WealthMapProps> = ({ overview }) => {
  const grouped = new Map<WealthAccountType, typeof overview.accounts>();

  for (const t of order) {
    grouped.set(t, []);
  }
  for (const acc of overview.accounts) {
    const bucket = grouped.get(acc.type) ?? [];
    bucket.push(acc);
    grouped.set(acc.type, bucket);
  }

  return (
    <section className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-lg shadow-primary/5 md:p-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-20 w-20 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <header className="relative flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
            Wealth Map
          </h2>
          <p className="mt-1 text-xs text-base-content/70">
            A simple map of where your money actually lives right now.
          </p>
        </div>
      </header>

      <div className="relative mt-3 flex flex-col gap-3">
        {order.map((typeKey) => {
          const accounts = grouped.get(typeKey) ?? [];
          if (accounts.length === 0) return null;

          return (
            <div
              key={typeKey}
              className="rounded-xl border border-base-300/80 bg-base-200/60 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  {typeLabels[typeKey]}
                </div>
                <div className="text-[11px] text-base-content/60">
                  {accounts.length} account{accounts.length > 1 ? "s" : ""}
                </div>
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {accounts.map((acc) => (
                  <li
                    key={acc.id}
                    className="flex items-baseline justify-between gap-3 text-xs text-base-content/80"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{acc.name}</span>
                      {acc.note ? (
                        <span className="text-[11px] text-base-content/60">
                          {acc.note}
                        </span>
                      ) : null}
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-semibold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: acc.currency,
                        maximumFractionDigits: 0,
                      }).format(acc.currentBalance)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WealthMap;
