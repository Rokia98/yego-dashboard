'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { KeyRound, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { getCurrentUser, logout, PATH_CHANGEMENT_MDP, PATH_CONNEXION, type UserRole } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { navPourRole, RACINES, type NavGroup } from '@/lib/nav';

type SidebarProps = {
  groups: NavGroup[];
  title: string;
  userLabel?: string;
};

function estActif(pathname: string, href: string) {
  if (pathname === href) return true;
  return !RACINES.has(href) && pathname.startsWith(href + '/');
}

export default function Sidebar({ groups, title, userLabel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  // La page a déjà validé la session (useAuthGuard) : on lit juste le rôle.
  useEffect(() => {
    setRole(getCurrentUser()?.role ?? null);
  }, []);

  const groupesVisibles = navPourRole(groups, role);

  // Ferme le tiroir à chaque navigation.
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push(PATH_CONNEXION);
  }

  const contenu = (
    <>
      <div className="mb-5 flex items-center gap-2.5 px-1.5 lg:mb-6">
        <Link href={PATH_CONNEXION} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-subtle">
            Y
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Yègo</span>
        </Link>
        <span className="ml-auto rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-ink">
          Pro
        </span>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-lg p-1 text-ink-faint hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <p className="mb-3 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{title}</p>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {groupesVisibles.map((groupe, gi) => (
          <div key={groupe.titre ?? gi}>
            {groupe.titre && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint/70">
                {groupe.titre}
              </p>
            )}
            <div className="space-y-0.5">
              {groupe.items.map((item) => {
                const active = estActif(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-accent-soft font-medium text-accent-ink'
                        : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-ink-faint group-hover:text-ink-soft'}`}
                      strokeWidth={1.75}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-0.5 border-t border-line-soft pt-3">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        </button>
        {userLabel && (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-soft">
              {userLabel.replace(/\D/g, '').slice(-2) || 'YG'}
            </span>
            <span className="truncate text-xs text-ink-faint">{userLabel}</span>
          </div>
        )}
        <Link
          href={PATH_CHANGEMENT_MDP}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <KeyRound className="h-4 w-4" strokeWidth={1.75} />
          Changer mon mot de passe
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barre supérieure mobile */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="rounded-lg p-1 text-ink-soft hover:bg-surface-2 hover:text-ink"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">Y</span>
          <span className="text-sm font-semibold text-ink">Yègo</span>
        </span>
      </div>

      {/* Fond sombre du tiroir mobile */}
      {ouvert && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOuvert(false)}
          aria-hidden
        />
      )}

      {/* Sidebar : tiroir sur mobile, colonne FIXE sur desktop (ne défile pas avec le contenu) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col overflow-y-auto border-r border-line bg-surface px-3.5 py-4 transition-transform duration-200 lg:z-30 lg:w-64 lg:translate-x-0 lg:py-5 ${
          ouvert ? 'translate-x-0 shadow-pop' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {contenu}
      </aside>
    </>
  );
}
