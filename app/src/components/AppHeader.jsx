import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { formatRoles } from '../utils/roles';

function IconSearch() {
  return (
    <svg className="size-4 text-ws-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function formatDateTime() {
  return new Date().toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateTime, setDateTime] = useState(formatDateTime);
  const menuRef = useRef(null);
  const initial = (user?.nome || user?.email || 'U')[0]?.toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => setDateTime(formatDateTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/Login', { replace: true });
  }

  return (
    <header className="h-16 bg-ws-elevated border-b border-ws-border shadow-header flex items-center px-5 lg:px-8 gap-4 shrink-0">
      <div className="flex-1 max-w-md hidden sm:block">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Buscar no portal..."
            className="w-full pl-10 pr-4 py-2 text-sm font-mono bg-ws-panel border border-ws-border-strong rounded focus:outline-none focus:border-accent placeholder:text-ws-muted text-ws-ink"
          />
        </label>
      </div>

      <div className="flex-1 sm:hidden">
        <Link to="/HomePage" className="font-bold text-ws-bright text-sm tracking-tight font-mono">
          Malibru Portal
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <span className="hidden md:inline text-xs text-ws-muted tabular-nums font-mono">{dateTime}</span>

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded hover:bg-ws-hover transition-colors"
          >
            <div className="size-9 rounded-full bg-primary/20 text-ws-sky font-semibold flex items-center justify-center text-sm font-mono">
              {initial}
            </div>
            <div className="hidden lg:block text-left min-w-0 max-w-[140px]">
              <p className="text-sm font-medium text-ws-bright truncate">{user?.nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-ws-muted truncate font-mono">
                {formatRoles(user)}
              </p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-ws-panel rounded border border-ws-border shadow-card py-1 z-50">
              <div className="px-4 py-3 border-b border-ws-border lg:hidden">
                <p className="text-sm font-medium text-ws-bright truncate">{user?.nome}</p>
                <p className="text-xs text-ws-muted truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-ws-secondary hover:bg-ws-hover"
              >
                Meu perfil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-ws-red hover:bg-ws-hover"
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
