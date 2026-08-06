import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as signalR from "@microsoft/signalr";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../services/notificationApi';
import { useAuth } from './AuthContext';
import { safeGetItem } from '../utils/storage';

const NotificationContext = createContext(null);
const signalrUrl = import.meta.env.VITE_SIGNALR_BASE_URL ?? "https://localhost:7148/hubs";

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [connection, setConnection] = useState(null);

  const getDeletedIdsFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('deleted_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const addDeletedIdToStorage = useCallback((idOrIds) => {
    try {
      const current = getDeletedIdsFromStorage();
      const idsToAdd = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const updated = Array.from(new Set([...current, ...idsToAdd]));
      localStorage.setItem('deleted_notifications', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, [getDeletedIdsFromStorage]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      const data = await getMyNotifications();
      if (data) {
        const deletedIds = getDeletedIdsFromStorage();
        const mapped = data
          .filter(n => !deletedIds.includes(n.id))
          .map(n => ({
            id: n.id,
            type: n.type || 'system',
            title: n.title || 'Bildirim',
            body: n.body || n.message || '',
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi',
            read: n.isRead ?? false,
            link: n.link || '/panel',
            icon: mapNotificationTypeToEmoji(n.type)
          }));
        setNotifications(mapped);
      }
    } catch {
      // Ignore network errors
    }
  }, [isAuthenticated, getDeletedIdsFromStorage]);

  const mapNotificationTypeToEmoji = (type) => {
    const t = String(type).toLowerCase();
    if (t === 'message' || t === 'chat') return '💬';
    if (t === 'order') return '📦';
    if (t === 'promo' || t === 'campaign') return '✦';
    return '⚙';
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // SignalR Hub Entegrasyonu
  useEffect(() => {
    if (!isAuthenticated) {
      if (connection) {
        connection.stop().catch(() => null);
        setConnection(null);
      }
      return;
    }

    let hubConn = new signalR.HubConnectionBuilder()
      .withUrl(`${signalrUrl}/notifications`, {
        accessTokenFactory: () => safeGetItem("accessToken") || ""
      })
      .withAutomaticReconnect()
      .build();

    hubConn.start()
      .then(async () => {
        setConnection(hubConn);

        if (user && user.id) {
          await hubConn.invoke("JoinMyNotifications", user.id).catch(() => null);
        }
      })
      .catch(() => null);

    // Real-time bildirim alıcısı
    hubConn.on("ReceiveNotification", (notif) => {
      if (notif) {
        const deletedIds = getDeletedIdsFromStorage();
        if (deletedIds.includes(notif.id)) return;

        const newNotif = {
          id: notif.id,
          type: notif.type || 'system',
          title: notif.title || 'Yeni Bildirim',
          body: notif.body || notif.message || '',
          time: 'Şimdi',
          read: false,
          link: notif.link || '/panel',
          icon: mapNotificationTypeToEmoji(notif.type)
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    });

    return () => {
      if (hubConn) {
        hubConn.stop().catch(() => null);
      }
    };
  }, [isAuthenticated, user, getDeletedIdsFromStorage]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // Ignore error
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Ignore error
    }
  }, []);

  const deleteSingle = useCallback(async (id) => {
    addDeletedIdToStorage(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      // Ignore error
    }
  }, [addDeletedIdToStorage]);

  const clearAll = useCallback(async () => {
    const ids = notifications.map(n => n.id);
    addDeletedIdToStorage(ids);
    setNotifications([]);
    try {
      await deleteAllNotifications().catch(() => {
        return Promise.all(ids.map(id => deleteNotification(id).catch(() => null)));
      });
    } catch {
      // Ignore error
    }
  }, [notifications, addDeletedIdToStorage]);

  const value = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteSingle,
    clearAll,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
