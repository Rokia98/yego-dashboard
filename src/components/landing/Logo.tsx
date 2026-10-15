// Épingle Yègo : même tracé que l'icône de l'app mobile (cf. components/ui/TicketQr).
export function EpingleYego({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 118" className={className} aria-hidden>
      <path d="M55 0C25 0 0 24 0 55c0 40 55 63 55 63s55-23 55-63C110 24 85 0 55 0Z" fill="#E67E22" />
      <circle cx="55" cy="52" r="30" fill="#fff" />
      <path d="M30 60C42 40 68 40 80 60" stroke="#2C3E50" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="60" r="5" fill="#2C3E50" />
      <circle cx="80" cy="60" r="5" fill="#2C3E50" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="group flex items-center gap-2">
      <EpingleYego className="h-8 w-8 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]" />
      <span className="text-[17px] font-bold tracking-tight text-ink">Yègo</span>
    </span>
  );
}
