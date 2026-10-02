'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useElementWidth } from './useElementWidth';
import { scale, monotonePath, niceTicks, compact } from './utils';

export type SeriePoint = { label: string; value: number };

type AreaChartProps = {
  data: SeriePoint[];
  height?: number;
  /** Rôle couleur : 'accent' (marque) ou 'chart-1' (bleu séquentiel). */
  couleur?: 'accent' | 'chart-1' | 'chart-3';
  valueFormat?: (n: number) => string;
  ariaLabel?: string;
};

const PAD = { top: 12, right: 14, bottom: 24, left: 40 };

export default function AreaChart({
  data,
  height = 220,
  couleur = 'accent',
  valueFormat = (n) => n.toLocaleString('fr-FR'),
  ariaLabel = 'Courbe de tendance',
}: AreaChartProps) {
  const uid = useId().replace(/[:]/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef, 640);
  const [hover, setHover] = useState<number | null>(null);
  const stroke = `rgb(var(--${couleur}))`;

  const geo = useMemo(() => {
    const w = Math.max(width, 240);
    const innerW = w - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const maxV = Math.max(1, ...data.map((d) => d.value));
    const ticks = niceTicks(0, maxV, 4);
    const top = Math.max(maxV, ticks[ticks.length - 1] || maxV);
    const sx = scale(0, Math.max(1, data.length - 1), PAD.left, PAD.left + innerW);
    const sy = scale(0, top, PAD.top + innerH, PAD.top);
    const pts = data.map((d, i) => ({ x: sx(i), y: sy(d.value) }));
    const line = monotonePath(pts);
    const base = PAD.top + innerH;
    const area = pts.length
      ? `${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`
      : '';
    return { w, innerW, innerH, base, ticks, top, sx, sy, pts, line, area };
  }, [data, width, height]);

  if (!data.length) {
    return (
      <div
        ref={wrapRef}
        className="flex items-center justify-center rounded-xl border border-line bg-surface-2 text-sm text-ink-faint"
        style={{ height }}
      >
        Pas encore de données sur la période.
      </div>
    );
  }

  const hi = hover != null ? data[hover] : null;
  const hp = hover != null ? geo.pts[hover] : null;
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg
        width={geo.w}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="block overflow-visible"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          let best = 0;
          let bd = Infinity;
          geo.pts.forEach((p, idx) => {
            const dd = Math.abs(p.x - x);
            if (dd < bd) {
              bd = dd;
              best = idx;
            }
          });
          setHover(best);
        }}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grille + graduations Y */}
        {geo.ticks.map((t) => {
          const y = geo.sy(t);
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={geo.w - PAD.right}
                y1={y}
                y2={y}
                stroke="rgb(var(--chart-grid))"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill="rgb(var(--ink-faint))">
                {compact(t)}
              </text>
            </g>
          );
        })}

        {/* graduations X */}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={i}
              x={geo.sx(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill="rgb(var(--ink-faint))"
            >
              {d.label}
            </text>
          ) : null,
        )}

        <path d={geo.area} fill={`url(#fill-${uid})`} />
        <path
          d={geo.line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* survol */}
        {hp && (
          <g>
            <line
              x1={hp.x}
              x2={hp.x}
              y1={PAD.top}
              y2={geo.base}
              stroke="rgb(var(--chart-axis))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={hp.x} cy={hp.y} r={4.5} fill={stroke} stroke="rgb(var(--surface))" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hi && hp && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-pop"
          style={{ left: Math.min(Math.max(hp.x, 60), geo.w - 60), top: hp.y - 8 }}
        >
          <div className="font-semibold text-ink">{valueFormat(hi.value)}</div>
          <div className="text-ink-faint">{hi.label}</div>
        </div>
      )}
    </div>
  );
}
