import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.js';
import { useToast } from '../../../shared/context/ToastContext.js';
import { fetchNotifications } from '../services/notificationService.js';
import {
  isNotificationRead,
  markNotificationRead,
  markNotificationsRead,
} from '../utils/notificationStorage.js';

import { NotificationContext } from './NotificationContext.js';

const POLL_INTERVAL_MS = 60_000;

function notificationToastVariant(type) {
  if (type === 'LICENSE_EXPIRING') return 'warning';
  if (type === 'CHAMADO_NOVO') return 'info';
  if (type === 'CHAMADO_RESPOSTA') return 'success';
  return 'info';
}

export function NotificationProvider({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const items = await fetchNotifications(user);
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

