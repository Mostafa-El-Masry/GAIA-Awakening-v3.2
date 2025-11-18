"use client";

import React from "react";
import styles from "./ProgressBarAnimated.module.css";

interface Props {
  percent: number; // 0..100
  isComplete?: boolean;
  className?: string;
}

export default function ProgressBarAnimated({
  percent,
  isComplete = false,
  className,
}: Props) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div
      className={`${
        styles.root
      } h-2 bg-secondary rounded-full overflow-hidden ${className ?? ""}`}
    >
      <div
        className={`${styles.fill} ${
          isComplete ? "bg-green-500" : "bg-primary"
        }`}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      {!isComplete && pct < 100 && (
        <div
          className={styles.stripes}
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}
