import Sidebar from './Sidebar';
import type { NavGroup } from '@/lib/nav';

type DashboardShellProps = {
  nav: NavGroup[];
  title: string;
  userLabel?: string;
  children: React.ReactNode;
};

export default function DashboardShell({ nav, title, userLabel, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      <Sidebar groups={nav} title={title} userLabel={userLabel} />
      {/* La sidebar est fixe sur desktop : on décale le contenu de sa largeur. */}
      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
