"use client";

type Series = { values: number[]; stroke: string; fill: string; label: string };

/**
 * Dependency-free radar/spider chart. `axes` are labels (length N); each series
 * has N values on a 0–`max` scale. Pure SVG polar math, no chart library.
 */
export default function RadarChart({
  axes,
  series,
  max = 10,
  size = 340,
}: {
  axes: string[];
  series: Series[];
  max?: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 54;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, value: number) => {
    const rad = (Math.max(0, Math.min(max, value)) / max) * r;
    return [cx + rad * Math.cos(angle(i)), cy + rad * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[360px] mx-auto" role="img" aria-label="Your evaluation fingerprint radar">
      {/* grid rings */}
      {rings.map((f, ri) => (
        <polygon
          key={ri}
          points={axes.map((_, i) => point(i, max * f).join(",")).join(" ")}
          fill="none"
          stroke="#333333"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#333333" strokeWidth={1} />;
      })}
      {/* series */}
      {series.map((s, si) => (
        <polygon
          key={si}
          points={s.values.map((v, i) => point(i, v).join(",")).join(" ")}
          fill={s.fill}
          stroke={s.stroke}
          strokeWidth={2}
        />
      ))}
      {/* axis labels */}
      {axes.map((label, i) => {
        const [x, y] = point(i, max + 1.6);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize={9}
            fill="#FFFFFF"
            textAnchor={Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end"}
            dominantBaseline="middle"
            className="uppercase tracking-wide"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
