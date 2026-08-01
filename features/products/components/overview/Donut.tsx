"use client";

type Segment = {
  value: number;
  color: string;
};

export default function Donut({
  segments,
  size = 172,
  strokeWidth = 16,
  gap = 2,
  children,
}: {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments.reduce<
    { color: string; dash: number; offset: number }[]
  >((acc, s) => {
    const length = total > 0 ? (s.value / total) * circumference : 0;
    const dash = Math.max(length - gap, 0);
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].dash + gap;
    return [...acc, { color: s.color, dash, offset }];
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-surface-container-highest"
          strokeWidth={strokeWidth}
        />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${a.dash} ${circumference - a.dash}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
