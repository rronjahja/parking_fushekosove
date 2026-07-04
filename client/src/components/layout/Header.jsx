import { Link } from 'react-router-dom';
import {
  Sun, Moon, LogIn, User, LayoutDashboard, Hammer, Headset, LogOut,
} from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function Header({ totals, onOpenAdmin }) {
  const { theme, toggle } = useTheme();
  const { user, isAuthed, isCustomer, isAdmin, isSuper, isAgent, logout } = useAuth();

  return (
    <header className="card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full rounded-full bg-mint animate-pulseDot" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">
              Live · {t.city}
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {t.appTitle}
          </h1>
          <p className="mt-1 text-sm text-faint">{t.appSubtitle}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {!isAuthed && (
              <Link to="/hyrje" className="btn-primary !py-2 text-xs">
                <LogIn size={14} /> Kyçu
              </Link>
            )}
            {isCustomer && (
              <Link to="/profili" className="btn-ghost !py-2 text-xs" title="Profili im">
                <User size={14} /> <span className="hidden sm:inline">Profili</span>
              </Link>
            )}
            <button onClick={toggle} className="btn-ghost !py-2">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden sm:inline">{theme === 'dark' ? t.theme.light : t.theme.dark}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isAdmin && (
              <button onClick={onOpenAdmin} className="btn-amber !py-2 text-xs">
                <LayoutDashboard size={14} /> {t.admin}
              </button>
            )}
            {isSuper && (
              <Link to="/ndertuesi" className="btn-primary !py-2 text-xs">
                <Hammer size={14} /> {t.builder}
              </Link>
            )}
            {isAgent && (
              <Link to="/agjenti" className="btn-ghost !py-2 text-xs">
                <Headset size={14} /> {t.agentPanel}
              </Link>
            )}
            {isAuthed && (
              <button onClick={logout} className="btn-ghost !px-2.5 !py-2 text-xs" title={t.logout}>
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="card flex items-baseline gap-2 rounded-xl px-4 py-2.5">
          <span className="font-mono text-3xl font-bold text-mint">{totals?.freeSpots ?? '—'}</span>
          <span className="text-sm text-faint">/ {totals?.totalSpots ?? '—'} {t.free}</span>
        </div>
        {isAuthed && user && <span className="chip-azure">{user.name}</span>}
      </div>
    </header>
  );
}