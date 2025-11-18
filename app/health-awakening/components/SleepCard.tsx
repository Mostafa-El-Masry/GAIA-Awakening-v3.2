import type { FC } from "react";
import DaySnapshotCard from "./DaySnapshotCard";

interface SleepCardProps {
  minutes: number;
  isSleeping: boolean;
  onSleepStart: () => void;
  onWake: () => void;
}

const SleepCard: FC<SleepCardProps> = ({
  minutes,
  isSleeping,
  onSleepStart,
  onWake,
}) => {
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  const value = `${hours}h ${remMinutes}m`;

  const handleClick = () => {
    if (isSleeping) {
      onWake();
    } else {
      onSleepStart();
    }
  };

  return (
    <DaySnapshotCard
      title="Sleep"
      value={value}
      subtitle="Use Sleep / Wake to track rest."
      footer={
        <button
          type="button"
          onClick={handleClick}
          className="btn btn-sm md:btn-md w-full md:w-auto rounded-full px-5 font-semibold normal-case btn-primary shadow-xl shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200"
        >
          {isSleeping ? "Wake" : "Sleep"}
        </button>
      }
    />
  );
};

export default SleepCard;
