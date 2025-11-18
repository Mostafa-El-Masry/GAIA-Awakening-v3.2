export function GMonogram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden="true" {...props}>
      <rect
        x="8"
        y="8"
        width="112"
        height="112"
        rx="28"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M64 24c-22.09 0-40 17.91-40 40s17.91 40 40 40c17.76 0 32.84-11.63 38.11-27.72h-18.3 c-4.2 7.18-12.03 11.99-21 11.99-13.25 0-24-10.75-24-24s10.75-24 24-24c10.5 0 19.43 6.74 22.73 16.13H104 C98.7 37.6 82.92 24 64 24z"
        fill="currentColor"
      />
      <path d="M96 72h-24v-12h36v36h-12V72z" fill="currentColor" />
    </svg>
  );
}
export function GaiaWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ letterSpacing: "0.08em", fontWeight: 800 }}
      aria-hidden
    >
      GAIA
    </span>
  );
}
