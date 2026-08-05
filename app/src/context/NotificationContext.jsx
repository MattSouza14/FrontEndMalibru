import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { fetchNotifications } from '../services/notificationService';
import {
  isNotificationRead,
  markNotificationRead,
  markNotificationsRead,
} from '../utils/notificationStorage';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 60_000;

function notificationToastVariant(type) {
  if (type === 'LICENSE_EXPIRING') return 'warning';
  if (type === 'CHAMADO_NOVO') return 'info';
  if (type === 'CHAMADO_RESPOSTA') return 'success';
  return 'info';
}

export function NotificationProvider({ children }) {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    knownIdsRef.current = new Set();
    initializedRef.current = false;
    setNotifications([]);
  }, [user?.id]);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token || !user?.id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const items = await fetchNotifications(token, user);
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, user]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!user?.id || notifications.length === 0) {
      if (notifications.length === 0 && !loading) {
        initializedRef.current = false;
      }
      return;
    }

    const unread = notifications.filter((item) => !isNotificationRead(user.id, item.id));

    if (!initializedRef.current) {
      unread.forEach((item) => knownIdsRef.current.add(item.id));
      initializedRef.current = true;
      return;
    }

    const incoming = unread.filter((item) => !knownIdsRef.current.has(item.id));

    incoming.forEach((item) => {
      knownIdsRef.current.add(item.id);
      showToast({
        title: item.title,
        message: item.message,
        variant: notificationToastVariant(item.type),
        onClick: () => navigate(item.href),
      });
    });
  }, [loading, navigate, notifications, showToast, user?.id]);

  const unreadCount = notifications.filter((item) => !isNotificationRead(user?.id, item.id)).length;

  function markAsRead(notificationId) {
    if (!user?.id || !notificationId) return;
    markNotificationRead(user.id, notificationId);
    setNotifications((prev) => [...prev]);
  }

  function markAllAsRead() {
    if (!user?.id || notifications.length === 0) return;
    markNotificationsRead(
      user.id,
      notifications.map((item) => item.id),
    );
    setNotifications((prev) => [...prev]);
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    isRead: (notificationId) => isNotificationRead(user?.id, notificationId),
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}
