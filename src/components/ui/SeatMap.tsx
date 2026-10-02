'use client';

type SeatMapProps = {
  placesTotales: number;
  occupes: string[];
  selection: string[];
  max: number;
  onChange: (sieges: string[]) => void;
  parRangee?: number;
};

// Plan de salle simple : sièges numérotés 1..N, occupés grisés, sélection
// limitée à `max`. Le couloir central est un espace visuel tous les 2 sièges.
export default function SeatMap({
  placesTotales,
  occupes,
  selection,
  max,
  onChange,
  parRangee = 4,
}: SeatMapProps) {
  const occ = new Set(occupes);
  const sel = new Set(selection);
  const sieges = Array.from({ length: placesTotales }, (_, i) => String(i + 1));

  function toggle(s: string) {
    if (occ.has(s)) return;
    if (sel.has(s)) {
      onChange(selection.filter((x) => x !== s));
    } else {
      if (selection.length >= max) {
        // remplace le plus ancien pour rester à `max`
        onChange([...selection.slice(1), s]);
      } else {
        onChange([...selection, s]);
      }
    }
  }

  return (
    <div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${parRangee}, minmax(0, 1fr))`, maxWidth: parRangee * 52 }}
      >
        {sieges.map((s, i) => {
          const estOcc = occ.has(s);
          const estSel = sel.has(s);
          const couloir = parRangee === 4 && i % 4 === 1;
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              disabled={estOcc}
              aria-pressed={estSel}
              className={`h-9 rounded-lg border text-xs font-medium tabular-nums transition-colors ${
                couloir ? 'mr-3' : ''
              } ${
                estOcc
                  ? 'cursor-not-allowed border-line bg-line-soft text-ink-faint line-through'
                  : estSel
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-surface text-ink-soft hover:border-accent hover:text-ink'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-line bg-surface" /> Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-accent bg-accent" /> Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-line bg-line-soft" /> Occupé
        </span>
      </div>
    </div>
  );
}
