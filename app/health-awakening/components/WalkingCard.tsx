import type { FC } from "react";
import DaySnapshotCard from "./DaySnapshotCard";

interface WalkingCardProps {
  minutes: number;
  isWalking: boolean;
  onStart: () => void;
  onStop: () => void;
}

const WalkingCard: FC<WalkingCardProps> = ({
  minutes,
  isWalking,
  onStart,
  onStop,
}) => {
  const value = minutes === 0 ? "No walking" : `${minutes} min`;

  const handleClick = () => {
    if (isWalking) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <DaySnapshotCard
      title="Walking"
      value={value}
      subtitle="Use Start / Stop walking to track activity."
      footer={
        <button
          type="button"
          onClick={handleClick}
          className="btn btn-sm md:btn-md w-full md:w-auto rounded-full px-5 font-semibold normal-case btn-info shadow-xl shadow-info/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200"
        >
          {isWalking ? "Stop walking" : "Start walking"}
        </button>
      }
    />
  );
};

export default WalkingCard;
