'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import Button from './Button';
import { formatFcfa } from '@/lib/format';

export type TicketImpression = {
  codeQr: string;
  siege?: string | null;
  statut?: string;
  villeDepart?: string;
  villeArrivee?: string;
  heure?: string; // ex. « 08:30 »
  date?: string; // ex. « 14/10/2026 »
  passager?: string | null;
  compagnie?: string;
  logoUrl?: string | null;
  prix?: string | number | null; // prix unitaire du billet
  reservationId?: number;
  numero?: number; // rang du billet dans la réservation (1-based)
  total?: number;
};

// Couleurs du billet de l'app mobile (yego-mobile, tickets/billetPdf.ts).
const ORANGE = '#E67E22';
const DARK = '#2C3E50';

const ETATS: Record<string, { texte: string; couleur: string; fond: string }> = {
  valide: { texte: 'Valide', couleur: '#1B7F4B', fond: '#DFF5E7' },
  utilise: { texte: 'Utilisé', couleur: '#7F8C8D', fond: '#ECEFF1' },
  annule: { texte: 'Annulé', couleur: '#C0392B', fond: '#FCEBEA' },
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

function monogramme(nom: string): string {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

// Logo de compagnie : uniquement une image data: ou https: (pas de javascript:…).
function logoSur(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,|https:\/\/)/i.test(url) ? url : null;
}

// Épingle Yègo (même tracé que le logo de l'app mobile).
const PIN = `<svg width="16" height="17" viewBox="0 0 110 118" xmlns="http://www.w3.org/2000/svg">
  <path d="M55 0C25 0 0 24 0 55c0 40 55 63 55 63s55-23 55-63C110 24 85 0 55 0Z" fill="${ORANGE}"/>
  <circle cx="55" cy="52" r="30" fill="#fff"/>
  <path d="M30 60C42 40 68 40 80 60" stroke="${DARK}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="30" cy="60" r="5" fill="${DARK}"/><circle cx="80" cy="60" r="5" fill="${DARK}"/>
</svg>`;

const BUS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10Zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM18 11H6V6h12v5Z"/>
</svg>`;

function htmlTicket(t: TicketImpression): string {
  const compagnie = t.compagnie || 'Compagnie';
  const logo = logoSur(t.logoUrl);
  const vignette = logo
    ? `<img class="mono mono-img" src="${echapperHtml(logo)}" alt="" />`
    : `<div class="mono">${echapperHtml(monogramme(compagnie))}</div>`;
  const etat = ETATS[t.statut ?? 'valide'] ?? ETATS.valide;
  // SVG généré par qrcode.react (chemins numériques uniquement), pas de donnée brute.
  const svg = document.getElementById(qrDomId(t.codeQr))?.outerHTML;
  const qr = svg ? `<div class="qr">${svg}</div>` : `<div class="qr-fallback">${echapperHtml(t.codeQr)}</div>`;
  const rang = t.numero && t.total ? `Billet ${t.numero}/${t.total}` : 'Billet';
  const ref = t.reservationId != null ? `Réf #${t.reservationId}` : '';
  const prix = t.prix != null && t.prix !== '' ? formatFcfa(t.prix) : '';

  return `
    <section class="billet">
      <div class="carte">
        <div class="bandeau">
          ${vignette}
          <div class="bandeau-txt">
            <div class="compagnie">${echapperHtml(compagnie)}</div>
            <div class="sous">Billet électronique</div>
          </div>
          <div class="marque">${PIN}<span>Y<b>è</b>go</span></div>
        </div>

        <div class="corps">
          <div class="trajet">
            <div class="col">
              <div class="mini">Départ</div>
              <div class="ville">${echapperHtml(t.villeDepart || '—')}</div>
              <div class="meta">${echapperHtml(t.heure)}</div>
            </div>
            <div class="milieu"><span></span><i>${BUS}</i><span></span></div>
            <div class="col right">
              <div class="mini">Arrivée</div>
              <div class="ville">${echapperHtml(t.villeArrivee || '—')}</div>
              <div class="meta">${echapperHtml(t.date)}</div>
            </div>
          </div>
        </div>

        <div class="perfo"><b class="n left"></b><b class="d"></b><b class="n right"></b></div>

        <div class="corps">
          <div class="infos">
            <div class="cell"><div class="mini">Siège</div><div class="siege">${echapperHtml(t.siege || '—')}</div></div>
            <div class="cell"><div class="mini">Passager</div><div class="val">${echapperHtml(t.passager || 'Voyageur')}</div></div>
            <div class="cell last"><div class="mini">État</div><span class="badge" style="color:${etat.couleur};background:${etat.fond}">${etat.texte}</span></div>
          </div>

          <div class="qr-cadre">${qr}<div class="qr-leg">Présentez ce code à l’embarquement</div></div>

          <div class="pied">
            <span>${rang}</span>
            <span>${ref}</span>
            <span class="prix">${echapperHtml(prix)}</span>
          </div>
        </div>
      </div>
    </section>`;
}

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: ${DARK}; background: #F5F6F7; }
  .billet { padding: 24px 20px; page-break-after: always; break-after: page; }
  .billet:last-child { page-break-after: auto; break-after: auto; }
  .carte { max-width: 380px; margin: 0 auto; border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 10px 30px rgba(30,42,54,.10); border: 1px solid #EDEFF1; }

  .bandeau { display: flex; align-items: center; gap: 12px; background: ${DARK}; padding: 18px 20px; }
  .mono { width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px; background: ${ORANGE}; color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
  .mono-img { background: #fff; object-fit: contain; padding: 3px; }
  .bandeau-txt { flex: 1; min-width: 0; }
  .compagnie { font-size: 16px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sous { font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(255,255,255,.6); margin-top: 3px; }
  .marque { display: flex; align-items: center; gap: 5px; color: #fff; font-weight: 800; font-size: 13px; }
  .marque b { color: ${ORANGE}; font-weight: 800; }

  .corps { padding: 0 22px; }
  .trajet { display: flex; align-items: flex-start; padding: 22px 0; }
  .col { flex: 1; min-width: 0; }
  .col.right { text-align: right; }
  .mini { font-size: 9px; letter-spacing: .7px; text-transform: uppercase; color: #AEB6B7; margin-bottom: 4px; }
  .ville { font-size: 21px; font-weight: 800; overflow-wrap: anywhere; }
  .meta { font-size: 12px; color: #7F8C8D; font-weight: 600; margin-top: 3px; }
  .milieu { display: flex; align-items: center; gap: 5px; padding: 16px 8px 0; }
  .milieu span { width: 22px; height: 2px; background: #E5E7EB; display: block; }
  .milieu i { width: 28px; height: 28px; border-radius: 50%; background: ${ORANGE}; display: flex; align-items: center; justify-content: center; }

  .perfo { display: flex; align-items: center; }
  .perfo .n { width: 22px; height: 22px; border-radius: 50%; background: #F5F6F7; display: block; }
  .perfo .n.left { margin-left: -11px; }
  .perfo .n.right { margin-right: -11px; }
  .perfo .d { flex: 1; border-top: 2px dashed #DEE2E5; margin: 0 6px; }

  .infos { display: flex; margin-top: 20px; border: 1px solid #EAEDEF; border-radius: 14px; overflow: hidden; }
  .cell { flex: 1; min-width: 0; padding: 12px 14px; border-right: 1px solid #EAEDEF; }
  .cell.last { border-right: 0; }
  .siege { font-size: 26px; font-weight: 800; color: ${ORANGE}; line-height: 1.1; }
  .val { font-size: 15px; font-weight: 700; margin-top: 3px; overflow-wrap: anywhere; }
  .badge { display: inline-block; font-size: 12px; font-weight: 800; padding: 4px 11px; border-radius: 999px; margin-top: 4px; }

  .qr-cadre { width: 214px; margin: 22px auto 0; padding: 16px 16px 12px; border: 1px solid #E5E7EB; border-radius: 16px; background: #FBFCFD; text-align: center; }
  .qr { background: #fff; padding: 6px; border-radius: 8px; }
  .qr svg { width: 170px; height: 170px; display: block; margin: 0 auto; }
  .qr-fallback { font-family: monospace; font-size: 10px; word-break: break-all; }
  .qr-leg { font-size: 10px; color: #7F8C8D; margin-top: 10px; }

  .pied { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 20px; padding: 14px 0 22px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #7F8C8D; font-weight: 600; }
  .pied .prix { color: ${DARK}; font-weight: 800; }

  @page { margin: 8mm; }
`;

/**
 * Ouvre une fenêtre d'impression autonome reprenant le billet de l'app mobile
 * (un billet par page, QR en SVG inline, aucune dépendance réseau hors logo de
 * la compagnie). Les QR doivent être affichés dans la page (composant TicketQr).
 */
export function imprimerTickets(tickets: TicketImpression[]) {
  if (tickets.length === 0) return;
  const w = window.open('', '_blank', 'width=460,height=760');
  if (!w) {
    alert('Fenêtre d’impression bloquée : autorisez les pop-ups pour ce site.');
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>Billets Yègo</title>
<style>${STYLES}</style></head><body>${tickets.map(htmlTicket).join('')}</body></html>`);
  w.document.close();
  w.focus();
  // Laisse le temps au logo de la compagnie de se charger avant l'impression.
  const imprimer = () => w.print();
  const images = Array.from(w.document.images);
  if (images.length === 0 || images.every((i) => i.complete)) imprimer();
  else {
    let restant = images.filter((i) => !i.complete).length;
    const fini = () => {
      restant -= 1;
      if (restant <= 0) imprimer();
    };
    images.forEach((i) => {
      if (!i.complete) {
        i.addEventListener('load', fini, { once: true });
        i.addEventListener('error', fini, { once: true });
      }
    });
  }
}

export default function TicketQr(props: TicketImpression) {
  const { codeQr, siege } = props;
  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3">
      <QRCodeSVG id={qrDomId(codeQr)} value={codeQr} size={96} level="M" fgColor={DARK} bgColor="#FFFFFF" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          {props.numero && props.total ? `Billet ${props.numero}/${props.total} · ` : ''}Siège {siege || 'libre'}
        </p>
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
