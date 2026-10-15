'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function BasculeTheme() {
  const { theme, toggle } = useTheme();
  const sombre = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className="group relative flex h-9 w-16 items-center rounded-full border border-line bg-paper p-1 transition-colors hover:border-accent/40"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-surface text-accent shadow-subtle transition-transform duration-500 ease-out ${
          sombre ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {sombre ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
