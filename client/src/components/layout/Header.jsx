import { Link } from 'react-router-dom';
import {
  Sun, Moon, LogIn, User, LayoutDashboard, Hammer, Headset, LogOut,
} from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Koka e faqes.
//
// Në telefon titulli dhe butonat rrinë në dy rreshta të veçantë: të vendosur
// krah për krah (justify-between) në 360px titulli ngushtohet aq sa thyhet
// shëmtuar dhe butonat mblidhen në një kolonë të hollë. Prandaj 'flex-col'
// deri te 'sm' dhe krah më krah vetëm nga aty e lart.
export function Header({ totals, onOpenAdmin }) {
  const { theme, toggle } = useTheme();
  const { user, isAuthed, isCustomer, isAdmin, isSuper, isAgent, logout } = useAuth();

  return (
    <header className="card-pad">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full rounded-full bg-mint animate-pulseDot" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">
              Live · {t.city}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-4xl">
            {t.appTitle}
          </h1>
          <p className="mt-1 text-sm text-faint">{t.appSubtitle}</p>
        </div>

        {/* Një rresht i vetëm që thyhet vetë; në telefon fillon nga e majta. */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
          <button onClick={toggle} className="btn-ghost !py-2" aria-label={t.theme.dark}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="hidden sm:inline">{theme === 'dark' ? t.theme.light : t.theme.dark}</span>
          </button>
          {isAuthed && (
            <button onClick={logout} className="btn-ghost !px-2.5 !py-2 text-xs" title={t.logout}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="card flex items-baseline gap-2 rounded-xl px-4 py-2.5">
          <span className="font-mono text-2xl font-bold text-mint sm:text-3xl">
            {totals?.freeSpots ?? '—'}
          </span>
          <span className="text-sm text-faint">/ {totals?.totalSpots ?? '—'} {t.free}</span>
        </div>
        {isAuthed && user && <span className="chip-azure">{user.name}</span>}
      </div>
    </header>
  );
}