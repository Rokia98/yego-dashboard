'use client';

import type { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LIEN_PLAY_STORE } from './contact';

// QR vers la fiche Play Store : depuis un ordinateur, on scanne avec son téléphone.
export default function QrTelechargement() {
  return (
    <div className="relative rounded-3xl bg-white p-4 shadow-pop">
      <QRCodeSVG
        value={LIEN_PLAY_STORE}
        size={148}
        level="M"
        fgColor="#2C3E50"
        imageSettings={{ src: '/landing/app-icon.png', height: 32, width: 32, excavate: true }}
      />
      <span className="lp-scan absolute inset-x-4 top-4 h-0.5 bg-[#E67E22] shadow-[0_0_12px_2px_rgb(230_126_34/0.6)]" style={{ '--course': '146px' } as CSSProperties} />
    </div>
  );
}
