import type { FC } from "react";
import type { HealthDaySnapshot } from "../lib/types";

interface HistoryListProps {
  days: HealthDaySnapshot[];
  todayKey: string;
}

function formatDayLabel(day: string) {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function computeInactiveStreak(days: HealthDaySnapshot[], todayKey: string) {
  const index = days.findIndex((d) => d.day === todayKey);
  if (index === -1) return 0;

  let streak = 0;
  for (let i = index; i < days.length; i++) {
    const d = days[i];
    if (d.walkMinutes === 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

const HistoryList: FC<HistoryListProps> = ({ days, todayKey }) => {
  const inactiveStreak = computeInactiveStreak(days, todayKey);

  return (
    <section className="rounded-3xl border border-base-300 bg-base-100/90 p-5 md:p-7 shadow-xl shadow-primary/5">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight">
            Recent days
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Vertical timeline with a quick health snapshot for each day.
          </p>
        </div>
        {inactiveStreak > 1 ? (
          <p className="text-xs md:text-sm rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-warning">
            Inactive streak: {inactiveStreak} days without walking
          </p>
        ) : null}
      </header>
      <ol className="relative mt-3 space-y-3 pl-1">
        <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border/60" />
        {days.map((day) => {
          const isToday = day.day === todayKey;
          const sleep = `${Math.floor(day.sleepMinutes / 60)}h ${
            day.sleepMinutes % 60
          }m`;
          const water = `${(day.waterMl / 1000).toFixed(1)}L`;
          const walkText =
            day.walkMinutes === 0 ? "No walking" : `${day.walkMinutes} min`;
          const training =
            day.trainingCompletionPercent == null
              ? "--"
              : `${Math.round(day.trainingCompletionPercent)}%`;
          const mood =
            day.moodRating == null ? "--/5" : `${day.moodRating}/5`;

          return (
            <li key={day.day} className="relative flex items-start gap-3 pl-4">
              <div className="flex flex-col items-center pt-1">
                <div
                  className={`h-3 w-3 rounded-full border ${
                    isToday
                      ? "border-secondary bg-secondary/90"
                      : day.walkMinutes === 0
                      ? "border-warning bg-warning/80"
                      : "border-base-300 bg-base-300/70"
                  }`}
                />
              </div>
              <div className="flex-1 rounded-2xl border border-base-300 bg-base-200/80 px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span
                    className={`font-semibold ${
                      isToday ? "text-primary" : "text-base-content"
                    }`}
                  >
                    {isToday ? "Today" : formatDayLabel(day.day)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Sleep {sleep} | Water {water} | Walk {walkText} | Train {training} | Mood {mood}
                  </span>
                </div>
                {day.moodNote ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {day.moodNote}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default HistoryList;
