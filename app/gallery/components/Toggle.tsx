"use client";

import styles from "./Toggle.module.css";

interface ToggleProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export default function Toggle({ value, options, onChange }: ToggleProps) {
  return (
    <div className={styles.toggle}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.button} ${
            value === option.value ? styles.active : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
