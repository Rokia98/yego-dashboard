import {
  LayoutDashboard,
  Ticket,
  Route,
  CalendarClock,
  ClipboardList,
  Bus,
  Users,
  CreditCard,
  Building2,
  Receipt,
  LifeBuoy,
  Undo2,
  ScanLine,
  ScrollText,
  FileText,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from './auth';

// `roles` : si présent, l'entrée n'est affichée qu'à ces rôles (doit refléter
// le useAuthGuard de la page cible, sinon l'utilisateur est redirigé en silence).
export type NavItem = { label: string; href: string; icon: LucideIcon; roles?: UserRole[] };
export type NavGroup = { titre?: string; items: NavItem[] };

export const COMPAGNIE_NAV: NavGroup[] = [
  {
    items: [{ label: 'Vue d’ensemble', href: '/compagnie', icon: LayoutDashboard }],
  },
  {
    titre: 'Vente',
    items: [
      { label: 'Guichet', href: '/compagnie/guichet', icon: Ticket },
      { label: 'Réservations', href: '/compagnie/reservations', icon: ClipboardList },
      { label: 'Remboursements', href: '/compagnie/remboursements', icon: Undo2, roles: ['company_admin'] },
      { label: 'Reversements', href: '/compagnie/reversements', icon: Banknote, roles: ['company_admin'] },
      { label: 'Contrôles', href: '/compagnie/controles', icon: ScanLine },
    ],
  },
  {
    titre: 'Exploitation',
    items: [
      { label: 'Trajets', href: '/compagnie/trajets', icon: Route },
      { label: 'Départs', href: '/compagnie/departs', icon: CalendarClock },
      { label: 'Flotte', href: '/compagnie/flotte', icon: Bus },
    ],
  },
  {
    titre: 'Compte',
    items: [
      { label: 'Agents', href: '/compagnie/agents', icon: Users, roles: ['company_admin'] },
      { label: 'Documents', href: '/compagnie/documents', icon: FileText, roles: ['company_admin'] },
      { label: 'Abonnement', href: '/compagnie/abonnement', icon: CreditCard, roles: ['company_admin'] },
      { label: 'Support', href: '/compagnie/support', icon: LifeBuoy },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    titre: 'Supervision',
    items: [
      { label: 'Vue d’ensemble', href: '/admin', icon: LayoutDashboard },
      { label: 'Compagnies', href: '/admin/compagnies', icon: Building2 },
    ],
  },
  {
    titre: 'Activité',
    items: [
      { label: 'Réservations', href: '/admin/reservations', icon: ClipboardList },
      { label: 'Remboursements', href: '/admin/remboursements', icon: Undo2 },
      { label: 'Reversements', href: '/admin/reversements', icon: Banknote },
      { label: 'Abonnements', href: '/admin/abonnements', icon: Receipt },
    ],
  },
  {
    titre: 'Système',
    items: [
      { label: 'Journal d’audit', href: '/admin/audit', icon: ScrollText },
      { label: 'Support', href: '/admin/support', icon: LifeBuoy },
    ],
  },
];

export const RACINES = new Set(['/compagnie', '/admin']);

/** Filtre la navigation selon le rôle et retire les groupes devenus vides. */
export function navPourRole(groups: NavGroup[], role: UserRole | null): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || (role != null && i.roles.includes(role))) }))
    .filter((g) => g.items.length > 0);
}
