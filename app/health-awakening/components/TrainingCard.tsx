import type { FC, FormEvent } from "react";
import { useState, useEffect } from "react";
import DaySnapshotCard from "./DaySnapshotCard";

interface TrainingCardProps {
  completion: number | null;
  todayPlanned: number;
  todayActual: number;
  onSave: (planned: number, actual: number) => void;
}

const TrainingCard: FC<TrainingCardProps> = ({
  completion,
  todayPlanned,
  todayActual,
  onSave,
}) => {
  const [planned, setPlanned] = useState<string>(
    todayPlanned ? String(todayPlanned) : ""
  );
  const [actual, setActual] = useState<string>(
    todayActual ? String(todayActual) : ""
  );

  useEffect(() => {
    setPlanned(todayPlanned ? String(todayPlanned) : "");
    setActual(todayActual ? String(todayActual) : "");
  }, [todayPlanned, todayActual]);

  const value =
    completion == null ? "--" : `${Math.round(completion).toString()}%`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(planned || "0");
    const a = Number.parseFloat(actual || "0");
    if (!Number.isFinite(p) || p < 0) return;
    if (!Number.isFinite(a) || a < 0) return;
    onSave(p, a);
  };

  return (
    <DaySnapshotCard
      title="Training"
      value={value}
      subtitle="Planned vs actual volume for today."
      footer={
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Plan</label>
            <input
              type="number"
              min={0}
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              className="input input-xs w-24 rounded-lg border-base-300 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-xs text-muted-foreground">units</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Actual</label>
            <input
              type="number"
              min={0}
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="input input-xs w-24 rounded-lg border-base-300 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-xs text-muted-foreground">units</span>
          </div>
          <button
            type="submit"
            className="btn btn-sm md:btn-md w-full md:w-auto btn-primary rounded-full px-5 font-semibold normal-case shadow-xl shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200"
          >
            Save training
          </button>
        </form>
      }
    />
  );
};

export default TrainingCard;
