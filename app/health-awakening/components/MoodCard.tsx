import type { FC, FormEvent } from "react";
import { useState, useEffect } from "react";
import DaySnapshotCard from "./DaySnapshotCard";

interface MoodCardProps {
  rating: number | null;
  note?: string;
  onSave: (rating: number, note: string) => void;
}

const MoodCard: FC<MoodCardProps> = ({ rating, note, onSave }) => {
  const [selected, setSelected] = useState<number>(rating ?? 0);
  const [draftNote, setDraftNote] = useState<string>(note ?? "");

  useEffect(() => {
    setSelected(rating ?? 0);
  }, [rating]);

  useEffect(() => {
    setDraftNote(note ?? "");
  }, [note]);

  const value = rating == null ? "--/5" : `${rating}/5`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected || selected < 1 || selected > 5) return;
    onSave(selected, draftNote.trim());
  };

  return (
    <DaySnapshotCard
      title="Mood"
      value={value}
      subtitle="Simple daily mood + short note."
      footer={
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSelected(n)}
                className={`h-9 w-9 rounded-full text-sm flex items-center justify-center border transition-colors ${
                  selected === n
                    ? "border-primary bg-primary/15 text-primary-content"
                    : "border-base-300 bg-base-200 text-base-content"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Short mood note"
            className="input input-sm w-full rounded-lg border-base-300 bg-base-200/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="btn btn-sm md:btn-md w-full md:w-auto btn-primary rounded-full px-5 font-semibold normal-case shadow-xl shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-base-300 text-base-content border-base-300 dark:bg-base-200 dark:border-base-200"
          >
            Save mood
          </button>
        </form>
      }
    />
  );
};

export default MoodCard;
