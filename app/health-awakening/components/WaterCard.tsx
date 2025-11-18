import type { FC, FormEvent } from "react";
import { useState } from "react";
import DaySnapshotCard from "./DaySnapshotCard";
import type { WaterContainer } from "../lib/types";

interface WaterCardProps {
  ml: number;
  containers: WaterContainer[];
  onAddByContainer: (containerId: string, quantity: number) => void;
  onAddMl: (ml: number) => void;
  onAddCustomContainer: (name: string, sizeMl: number) => void;
}

const WaterCard: FC<WaterCardProps> = ({
  ml,
  containers,
  onAddByContainer,
  onAddMl,
  onAddCustomContainer,
}) => {
  const liters = ml / 1000;
  const value = `${liters.toFixed(1)} L`;

  const [freeMl, setFreeMl] = useState("");
  const [customName, setCustomName] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const defaultContainers = containers.filter(
    (c) => c.isDefault && c.isActive
  );
  const customContainers = containers.filter(
    (c) => !c.isDefault && c.isActive
  );

  const handleAddFree = () => {
    const parsed = Number.parseInt(freeMl, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onAddMl(parsed);
    setFreeMl("");
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const size = Number.parseInt(customSize, 10);
    if (!name || !Number.isFinite(size) || size <= 0) return;
    onAddCustomContainer(name, size);
    setCustomName("");
    setCustomSize("");
    setShowCustom(true);
  };

  return (
    <DaySnapshotCard
      title="Water"
      value={value}
      subtitle="Track water via cups, bottles, and custom containers."
      footer={
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-1.5">
            {defaultContainers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAddByContainer(c.id, 1)}
                className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-content hover:bg-primary/20"
              >
                {c.name} | {c.sizeMl} ml
              </button>
            ))}
            {customContainers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAddByContainer(c.id, 1)}
                className="inline-flex items-center rounded-full border border-base-300 bg-base-200 px-3 py-1 text-xs font-semibold hover:bg-base-300/60"
              >
                {c.name} | {c.sizeMl} ml
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={0}
              value={freeMl}
              onChange={(e) => setFreeMl(e.target.value)}
              placeholder="e.g. 250"
              className="input input-sm w-28 rounded-lg border-base-300 bg-base-200/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-xs text-muted-foreground">ml</span>
            <button
              type="button"
              onClick={handleAddFree}
              className="btn btn-sm md:btn-md w-full md:w-auto btn-primary rounded-full px-4 font-semibold normal-case shadow-xl shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200"
            >
              Add ml
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {showCustom ? "Hide custom containers" : "Add custom container"}
          </button>
          {showCustom && (
            <form
              onSubmit={handleCustomSubmit}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-200/60 p-2"
            >
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name"
                className="input input-sm min-w-[120px] flex-1 rounded-lg border-base-300 bg-base-100 px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="number"
                min={0}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="1500"
                className="input input-sm w-24 rounded-lg border-base-300 bg-base-100 px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <span className="text-xs text-muted-foreground">ml</span>
              <button
                type="submit"
                className="btn btn-ghost btn-xs w-full sm:w-auto rounded-full border-base-300 px-3 font-semibold normal-case hover:border-primary/60 hover:bg-primary/10 bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200 shadow-xl shadow-primary/20"
              >
                Save
              </button>
            </form>
          )}
        </div>
      }
    />
  );
};

export default WaterCard;
