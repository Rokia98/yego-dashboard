'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import Button from './Button';

export type TicketImpression = {
  codeQr: string;
  siege?: string | null;
  trajet?: string;
  date?: string;
  passager?: string | null;
  compagnie?: string;
};

// La fenêtre d'impression partage l'origine du dashboard (et donc l'accès aux
// jetons) : toute donnée insérée dans le HTML DOIT être échappée.
function echapperHtml(valeur: string | null | undefined): string {
  return (valeur ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

// Identifiant DOM stable dérivé du code (qui peut contenir des caractères
// arbitraires) : on n'en garde que les caractères sûrs.
function qrDomId(codeQr: string): string {
  return `qr-${codeQr.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

function htmlTicket(t: TicketImpression): string {
  const ligne = (label: string, valeur: string | null | undefined) =>
    valeur ? `<div class="row"><span>${label}</span><strong>${echapperHtml(valeur)}</strong></div>` : '';
  // SVG généré par qrcode.react (chemins numériques uniquement), pas de donnée brute.
  const svg = document.getElementById(qrDomId(t.codeQr))?.outerHTML ?? '';
  return `<section class="ticket">
  <h1>Yègo${t.compagnie ? ` · ${echapperHtml(t.compagnie)}` : ''}</h1>
  <p class="muted">Ticket de transport</p>
  ${ligne('Trajet', t.trajet)}
  ${ligne('Départ', t.date)}
  ${ligne('Passager', t.passager)}
  ${ligne('Siège', t.siege || 'libre')}
  ${svg}
  <code>${echapperHtml(t.codeQr)}</code>
</section>`;
}

/**
 * Ouvre une fenêtre d'impression autonome (un ticket par page, QR en SVG
 * inline) : pas de dépendance réseau, imprimable sur une imprimante thermique
 * de guichet. Les QR doivent être affichés dans la page (composant TicketQr).
 */
export function imprimerTickets(tickets: TicketImpression[]) {
  if (tickets.length === 0) return;
  const w = window.open('', '_blank', 'width=380,height=560');
  if (!w) {
    alert('Fenêtre d’impression bloquée : autorisez les pop-ups pour ce site.');
    return;
  }
  w.document.write(`<!doctype html><html><head><title>Tickets Yègo</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;color:#12141a}
  .ticket{padding:24px;text-align:center;page-break-after:always}
  .ticket:last-child{page-break-after:auto}
  h1{font-size:15px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px}
  .muted{color:#5b6270;font-size:12px}
  .row{display:flex;justify-content:space-between;gap:12px;font-size:13px;margin:6px 0;border-bottom:1px dashed #ccc;padding-bottom:6px;text-align:right}
  .row span{text-align:left}
  svg{margin:16px auto;display:block}
  code{font-size:10px;word-break:break-all;color:#8a90a0}
</style></head><body>${tickets.map(htmlTicket).join('')}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export default function TicketQr(props: TicketImpression) {
  const { codeQr, siege } = props;
  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3">
      <QRCodeSVG id={qrDomId(codeQr)} value={codeQr} size={96} level="M" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Siège {siege || 'libre'}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-ink-faint" title={codeQr}>
          {codeQr}
        </p>
        <Button variant="secondary" className="mt-2 !py-1 !text-xs" onClick={() => imprimerTickets([props])}>
          <Printer className="h-3.5 w-3.5" strokeWidth={1.75} /> Imprimer
        </Button>
      </div>
    </div>
  );
}
