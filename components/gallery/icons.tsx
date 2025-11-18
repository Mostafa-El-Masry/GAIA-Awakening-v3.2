import type { SVGProps, ReactNode } from "react";

function makeIcon(
  paths: (props: { strokeWidth: number }) => ReactNode,
  viewBox = "0 0 20 20"
) {
  return function Icon({
    className,
    strokeWidth = 1.4,
    ...rest
  }: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        className={className}
        aria-hidden
        {...rest}
      >
        {paths({ strokeWidth: Number(strokeWidth) })}
      </svg>
    );
  };
}

export const PhotoGlyph = makeIcon(({ strokeWidth }) => (
  <>
    <path
      d="M2.5 6.2 6 3h8l3.5 3.2"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="2.5"
      y="6.5"
      width="15"
      height="10.5"
      rx="2.2"
      strokeWidth={strokeWidth}
    />
    <circle cx="10" cy="11.2" r="3" strokeWidth={strokeWidth} />
    <path
      d="M4.7 13.5 7.8 9.8a1 1 0 0 1 1.5-.07l1.4 1.4"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </>
));

export const VideoGlyph = makeIcon(({ strokeWidth }) => (
  <>
    <rect
      x="2.5"
      y="5"
      width="10.5"
      height="10"
      rx="2.2"
      strokeWidth={strokeWidth}
    />
    <path
      d="M13.5 7.1 18 4.8v10.4l-4.5-2.3"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <path
      d="M4.7 7.5h2.8M4.7 9.8h3.6M4.7 12h2.2"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </>
));

export const SearchGlyph = makeIcon(({ strokeWidth }) => (
  <>
    <path
      d="M4 9.2C4 6 6.6 3.4 9.8 3.4S15.6 6 15.6 9.2c0 3.2-2.6 5.8-5.8 5.8S4 12.4 4 9.2Z"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M6.3 7.7c.8-1.2 2.2-2 3.9-2 1.7 0 3.1.8 3.9 2"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <line
      x1="15"
      y1="15"
      x2="18.5"
      y2="18.5"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <line
      x1="7.3"
      y1="9.2"
      x2="11.5"
      y2="9.2"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <line
      x1="7.3"
      y1="11"
      x2="10.2"
      y2="11"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </>
));

export const CaretGlyph = makeIcon(
  () => <path d="M2 4l4 4 4-4H2z" />,
  "0 0 12 12"
);

export const EyeGlyph = makeIcon(({ strokeWidth }) => (
  <>
    <path
      d="M2.5 10c2-4 4.9-6.4 7.5-6.4 2.6 0 5.5 2.4 7.5 6.4-2 4-4.9 6.4-7.5 6.4-2.6 0-5.5-2.4-7.5-6.4Z"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="10" r="2.8" strokeWidth={strokeWidth} />
    <circle cx="10" cy="10" r="1.1" fill="currentColor" />
  </>
));

export const PlayBadgeGlyph = makeIcon(({ strokeWidth }) => (
  <>
    {/* simplified filled play triangle (no circular background) */}
    <path d="M8.2 7.6v4.8l4-2.4-4-2.4Z" fill="currentColor" />
  </>
));

export const HeartGlyph = makeIcon(
  ({ strokeWidth }) => (
    <path
      d="M12 19.2 5.4 13.1a4.6 4.6 0 0 1 0-6.7 4.8 4.8 0 0 1 6.6-.2l.1.1.2-.2a4.8 4.8 0 0 1 6.6.2 4.6 4.6 0 0 1 0 6.7L12 19.2Z"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "0 0 24 24"
);

export function HeartFilledGlyph({
  className,
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M12 19.35 5.4 13.3a4.75 4.75 0 0 1 0-6.88 5.1 5.1 0 0 1 7.07 0l.53.53.53-.53a5.1 5.1 0 0 1 7.07 0 4.75 4.75 0 0 1 0 6.88L12 19.35Z" />
    </svg>
  );
}

export const DownloadGlyph = makeIcon(
  ({ strokeWidth }) => (
    <>
      <path
        d="M12 3v10.5"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="m7.5 10.8 4.5 4.7 4.5-4.7"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18.2h14"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>
  ),
  "0 0 24 24"
);

export const ClockGlyph = makeIcon(({ strokeWidth }) => (
  <>
    <circle cx="10" cy="10" r="7" strokeWidth={strokeWidth} />
    <path
      d="M10 6.5v3.5l2.5 2.5"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
));
