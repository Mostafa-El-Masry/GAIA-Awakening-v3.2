import type { FC, ReactNode } from "react";

interface DaySnapshotCardProps {
  title: string;
  value: string;
  subtitle?: string;
  footer?: ReactNode;
}

const DaySnapshotCard: FC<DaySnapshotCardProps> = ({
  title,
  value,
  subtitle,
  footer,
}) => {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100/90 px-4 py-3 md:px-5 md:py-4 flex flex-col justify-between min-h-[148px] shadow-lg shadow-primary/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-6 top-4 h-16 w-16 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-6 bottom-0 h-14 w-14 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200/60 px-3 py-1 text-base-content/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h2 className="text-xs md:text-sm font-medium">{title}</h2>
        </div>
        <div className="mt-2 text-2xl md:text-3xl font-semibold tabular-nums text-base-content">
          {value}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {footer ? (
        <div className="relative mt-3 text-sm md:text-base border-t border-base-200 pt-3 text-base-content/90 flex justify-center">
          {footer}
        </div>
      ) : null}
    </article>
  );
};

export default DaySnapshotCard;
