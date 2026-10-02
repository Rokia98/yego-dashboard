'use client';

import { useId } from 'react';
import { scale, monotonePath } from './utils';

type SparklineProps = {
  values: number[];
  /** hauteur en px ; la largeur s'adapte au conteneur. */
  height?: number;
  couleur?: 'accent' | 'chart-1' | 'chart-3';
};

const VW = 240;

export default function Sparkline({ values, height = 32, couleur = 'accent' }: SparklineProps) {
  const uid = useId().replace(/[:]/g, '');
  if (values.length < 2) return <div style={{ height }} />;

  const stroke = `rgb(var(--${couleur}))`;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const sx = scale(0, values.length - 1, 1, VW - 1);
  const sy = scale(min, max === min ? min + 1 : max, height - 3, 3);
  const pts = values.map((v, i) => ({ x: sx(i), y: sy(v) }));
  const line = monotonePath(pts);
  const area = `${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${height}`}
      preserveAspectRatio="none"
      height={height}
      className="w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
