import type { FC } from "react";
import type {
  HealthDaySnapshot,
  WaterContainer,
} from "../lib/types";
import SleepCard from "./SleepCard";
import WaterCard from "./WaterCard";
import WalkingCard from "./WalkingCard";
import TrainingCard from "./TrainingCard";
import MoodCard from "./MoodCard";

function formatDayLabel(day: string) {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface TodayViewProps {
  today: HealthDaySnapshot;
  isSleeping: boolean;
  onSleepStart: () => void;
  onWake: () => void;
  waterContainers: WaterContainer[];
  onAddWaterByContainer: (containerId: string, quantity: number) => void;
  onAddWaterMl: (ml: number) => void;
  onAddCustomWaterContainer: (name: string, sizeMl: number) => void;
  isWalking: boolean;
  onWalkStart: () => void;
  onWalkStop: () => void;
  todayTrainingPlanned: number;
  todayTrainingActual: number;
  onSaveTraining: (planned: number, actual: number) => void;
  onSaveMood: (rating: number, note: string) => void;
}

const TodayView: FC<TodayViewProps> = ({
  today,
  isSleeping,
  onSleepStart,
  onWake,
  waterContainers,
  onAddWaterByContainer,
  onAddWaterMl,
  onAddCustomWaterContainer,
  isWalking,
  onWalkStart,
  onWalkStop,
  todayTrainingPlanned,
  todayTrainingActual,
  onSaveTraining,
  onSaveMood,
}) => {
  return (
    <section className="rounded-3xl border border-base-300 bg-base-100/90 p-5 md:p-7 shadow-xl shadow-primary/5 space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs md:text-sm uppercase tracking-[0.18em] text-primary/80">
            Today
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-base-content">
              Health Pulse
            </h1>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary-content border border-primary/40">
              Live snapshot
            </span>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Lightweight controls for sleep, water, walking, training, and mood. Everything stays synced and remains offline-first.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <span className="rounded-full border border-base-300 bg-base-200/80 px-3 py-1 text-base-content min-w-[96px] text-center text-sm font-semibold">
            {formatDayLabel(today.day)}
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:gap-5">
        <SleepCard
          minutes={today.sleepMinutes}
          isSleeping={isSleeping}
          onSleepStart={onSleepStart}
          onWake={onWake}
        />
        <WaterCard
          ml={today.waterMl}
          containers={waterContainers}
          onAddByContainer={onAddWaterByContainer}
          onAddMl={onAddWaterMl}
          onAddCustomContainer={onAddCustomWaterContainer}
        />
        <WalkingCard
          minutes={today.walkMinutes}
          isWalking={isWalking}
          onStart={onWalkStart}
          onStop={onWalkStop}
        />
        <TrainingCard
          completion={today.trainingCompletionPercent}
          todayPlanned={todayTrainingPlanned}
          todayActual={todayTrainingActual}
          onSave={onSaveTraining}
        />
        <MoodCard
          rating={today.moodRating}
          note={today.moodNote}
          onSave={onSaveMood}
        />
      </div>
    </section>
  );
};

export default TodayView;
