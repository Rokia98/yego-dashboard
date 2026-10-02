'use client';

import Button from './Button';

type LoadMoreProps = {
  aSuite: boolean;
  chargement: boolean;
  onClick: () => void;
  nbCharges: number;
};

export default function LoadMore({ aSuite, chargement, onClick, nbCharges }: LoadMoreProps) {
  if (!aSuite && nbCharges === 0) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-t border-line-soft px-5 py-4">
      {aSuite ? (
        <Button variant="secondary" onClick={onClick} disabled={chargement} className="!py-1.5 !text-xs">
          {chargement ? 'Chargement…' : 'Charger plus'}
        </Button>
      ) : (
        <span className="text-xs text-ink-faint">{nbCharges} élément{nbCharges > 1 ? 's' : ''} — fin de liste</span>
      )}
    </div>
  );
}
