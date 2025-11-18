'use client';

type Datum = { label: string; value: number };

function expScale(value: number, min: number, max: number, k = 1.6) {
  if (max <= min) return 50;
  const t = (value - min) / (max - min);
  const s = Math.pow(t, k);
  return Math.round(10 + s * 80);
}

export default function WealthBars({ title = "Wealth trend", data, k = 1.8 }: { title?: string; data: Datum[]; k?: number }) {
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {data.map((d) => {
          const h = expScale(d.value, min, max, k);
          return (
            <div key={d.label} className="flex flex-col items-center gap-2">
              <div className="flex h-40 w-8 items-end justify-center rounded border gaia-panel-soft">
                <div
                  className="w-6 rounded-t transition-[height]"
                  style={{
                    height: `${h}%`,
                    backgroundColor: "var(--gaia-contrast-bg)",
                  }}
                  title={`${d.label}: ${d.value}`}
                />
              </div>
              <div className="w-10 truncate text-center gaia-muted text-xs">{d.label}</div>
            </div>
          );
        })}
      </div>
      <p className="gaia-muted text-xs">Exponential height mapping emphasizes growth without changing your data.</p>
    </section>
  );
}
