'use client';

type Point = { latitude: number; longitude: number };

type TraceGpsProps = {
  points: Point[];
  position: Point | null;
  destination: Point | null;
};

// Carte légère sans dépendance ni tuiles réseau : projette lat/lng sur une
// boîte englobante et trace le parcours. Suffisant pour un back-office guichet
// sur connexion 3G/4G (le fond de carte détaillé est côté app voyageur).
export default function TraceGps({ points, position, destination }: TraceGpsProps) {
  const tous = [...points];
  if (position) tous.push(position);
  if (destination) tous.push(destination);

  if (tous.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-line bg-paper text-sm text-ink-faint">
        En attente des premières positions GPS du chauffeur…
      </div>
    );
  }

  const lats = tous.map((p) => p.latitude);
  const lngs = tous.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const W = 600;
  const H = 320;
  const pad = 24;
  const spanLat = maxLat - minLat || 1e-4;
  const spanLng = maxLng - minLng || 1e-4;

  const proj = (p: Point): [number, number] => [
    pad + ((p.longitude - minLng) / spanLng) * (W - 2 * pad),
    // latitude vers le haut
    H - pad - ((p.latitude - minLat) / spanLat) * (H - 2 * pad),
  ];

  const trace = points.map(proj);
  const d = trace.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const pos = position ? proj(position) : null;
  const dest = destination ? proj(destination) : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-paper">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Trace GPS du véhicule">
        {d && <path d={d} fill="none" stroke="#E67E22" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {dest && (
          <g>
            <circle cx={dest[0]} cy={dest[1]} r={6} fill="none" stroke="#12141A" strokeWidth={2} />
            <text x={dest[0] + 10} y={dest[1] + 4} fontSize={11} fill="#5B6270">Arrivée</text>
          </g>
        )}
        {pos && (
          <g>
            <circle cx={pos[0]} cy={pos[1]} r={9} fill="#E67E22" opacity={0.25} />
            <circle cx={pos[0]} cy={pos[1]} r={4.5} fill="#E67E22" stroke="#fff" strokeWidth={1.5} />
          </g>
        )}
      </svg>
    </div>
  );
}
