import { Link, Outlet, useLocation } from 'react-router-dom';

interface NavLink {
  to: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { to: '/', label: '主頁' },
  { to: '/game', label: '遊戲' },
  { to: '/settings', label: '設定' },
];

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-menu">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-700/50 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl" aria-hidden="true">🀄</span>
            <span className="text-yellow-400">香港麻雀</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-700/50 bg-neutral-950/60 py-3 text-center">
        <p className="text-xs text-neutral-500">
          HK Mahjong &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
