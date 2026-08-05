import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import { markChamadoRead } from '../utils/notificationStorage';
import { useAuth } from '../context/AuthContext';

function IconBell() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d`;
}

function notificationAccent(type) {
  if (type === 'LICENSE_EXPIRING') return 'bg-amber-100 text-amber-700';
  if (type === 'CHAMADO_NOVO') return 'bg-blue-100 text-blue-700';
  if (type === 'CHAMADO_RESPOSTA') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
}

function notificationLabel(type) {
  if (type === 'LICENSE_EXPIRING') return 'Vencimento';
  if (type === 'CHAMADO_NOVO') return 'Chamado';
  if (type === 'CHAMADO_RESPOSTA') return 'Resposta';
  return 'Aviso';
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    isRead,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotificationClick(notification) {
    markAsRead(notification.id);
    if (notification.chamadoId && user?.id) {
      markChamadoRead(user.id, notification.chamadoId);
    }
    setOpen(false);
    navigate(notification.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative size-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center justify-center"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notificações</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">
                Nenhuma notificação no momento.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const read = isRead(notification.id);
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          read ? 'opacity-70' : 'bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`shrink-0 mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${notificationAccent(
                              notification.type,
                            )}`}
                          >
                            {notificationLabel(notification.type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          {!read && (
                            <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
