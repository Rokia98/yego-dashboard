'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { PATH_CONNEXION } from '@/lib/session';
import Logo from './Logo';

const LIENS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#fonctionnement', label: 'Comment ça marche' },
  { href: '#voyageurs', label: 'Voyageurs' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

export default function EnTete() {
  const [defile, setDefile] = useState(false);
  const [menu, setMenu] = useState(false);
  const progression = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const maj = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (progression.current) {
        progression.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
      }
      setDefile(h.scrollTop > 12);
    };
    const surDefilement = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    raf = requestAnimationFrame(maj);
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => {
      window.removeEventListener('scroll', surDefilement);
      cancelAnimationFrame(raf);
    };
  }, []);

  const opaque = defile || menu;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-500 ${
        opaque ? 'border-b border-line-soft bg-paper/80 shadow-subtle backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div
        ref={progression}
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] origin-left bg-accent"
        style={{ transform: 'scaleX(0)' }}
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Yègo — accueil" onClick={() => setMenu(false)}>
          <Logo />
        </Link>
        <nav className="ml-6 hidden items-center gap-7 text-sm text-ink-soft md:flex">
          {LIENS.map((l) => (
            <a key={l.href} href={l.href} className="lp-lien transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={PATH_CONNEXION}
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink sm:inline-flex"
          >
            Se connecter
          </Link>
          <a
            href="#contact"
            className="lp-brillant hidden rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-subtle transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex"
          >
            Devenir partenaire
          </a>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface-2 md:hidden"
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile : déroulé en grid-rows 0fr -> 1fr pour une hauteur animée sans mesure. */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-out md:hidden ${
          menu ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col gap-1 px-4 pb-5 pt-1">
            {LIENS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenu(false)}
                className={`rounded-xl px-3 py-3 text-base font-medium text-ink transition-all duration-500 hover:bg-surface-2 ${
                  menu ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                }`}
                style={{ transitionDelay: menu ? `${80 + i * 50}ms` : '0ms' }}
              >
                {l.label}
              </a>
            ))}
            <Link
              href={PATH_CONNEXION}
              className="mt-2 rounded-xl border border-line px-3 py-3 text-center text-sm font-medium text-ink"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
