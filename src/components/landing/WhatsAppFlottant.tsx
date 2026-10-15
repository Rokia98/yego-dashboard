'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

// Bouton WhatsApp fixe, affiché une fois le héros dépassé.
export default function WhatsAppFlottant({ lien }: { lien: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const maj = () => {
      raf = 0;
      setVisible(window.scrollY > 640);
    };
    const surDefilement = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    raf = requestAnimationFrame(maj);
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', surDefilement);
    };
  }, []);

  return (
    <a
      href={lien}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      tabIndex={visible ? 0 : -1}
      className={`group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-pop transition-all duration-500 ease-out hover:scale-105 sm:bottom-6 sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <span aria-hidden className="lp-pulsation bg-[#25D366]" />
      <MessageCircle className="relative h-6 w-6" />
      <span className="relative hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-500 group-hover:max-w-[10rem] sm:inline">
        Écrivez-nous
      </span>
    </a>
  );
}
