/** Pastille ronde avec les initiales d'un nom (identité visuelle d'une ligne). */
export default function Initiales({ nom, className = '' }: { nom: string; className?: string }) {
  const ini = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-ink ${className}`}
    >
      {ini || '?'}
    </span>
  );
}
