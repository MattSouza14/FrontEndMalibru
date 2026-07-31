import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRoles } from '../utils/roles';

function IconSearch() {
  return (
    <svg className="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
    <header className="h-16 bg-white border-b border-gray-200 shadow-header flex items-center px-5 lg:px-8 gap-4 shrink-0">
      <div className="flex-1 max-w-md hidden sm:block">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Buscar no portal..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400"
          />
        </label>
      </div>

      <div className="flex-1 sm:hidden">
        <Link to="/HomePage" className="font-bold text-sidebar text-sm tracking-tight">
          Malibru Portal
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <span className="hidden md:inline text-xs text-gray-500 tabular-nums">{dateTime}</span>

        <button
          type="button"
          className="relative size-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center justify-center"
          aria-label="Notificações"
        >
          <IconBell />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="size-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
              {initial}
            </div>
            <div className="hidden lg:block text-left min-w-0 max-w-[140px]">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 truncate">
                {formatRoles(user)}
              </p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 lg:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Meu perfil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
