import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../services/notificationApi';
import { useAuth } from './AuthContext';
import { safeGetItem } from '../utils/storage';

const NotificationContext = createContext(null);
const signalrUrl = import.meta.env.VITE_SIGNALR_BASE_URL ?? "https://localhost:7148/hubs";

export function getNotificationLink(n, user) {
  const type = String(n?.type || '').toLowerCase();
  const title = String(n?.title || '').toLowerCase();
  const body = String(n?.body || n?.message || '').toLowerCase();
  const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin') || user?.role === 'Admin';

  if (n?.targetUrl) return n.targetUrl;
  if (n?.link && n.link !== '/panel' && n.link !== '/admin') return n.link;

  if (isAdmin) {
    if (type === 'chat' || type === 'message' || title.includes('mesaj') || body.includes('mesaj')) {
      return '/admin?tab=messages';
    }
    if (type === 'order' || title.includes('sipariş') || body.includes('sipariş')) {
      return '/admin?tab=orders';
    }
    if (type === 'review' || title.includes('yorum') || title.includes('değerlendirme') || body.includes('yorum')) {
      return '/admin?tab=reviews';
    }
    if (type === 'stock' || type === 'inventory' || title.includes('stok') || body.includes('stok')) {
      return '/admin?tab=inventory';
    }
    if (type === 'product' || title.includes('ürün') || body.includes('ürün')) {
      return '/admin?tab=products';
    }
    return '/admin';
  }

  // Customer
  if (type === 'chat' || type === 'message' || title.includes('mesaj') || body.includes('mesaj')) {
    return '/panel';
  }
  if (type === 'order' || title.includes('sipariş') || body.includes('sipariş')) {
    return '/siparislerim';
  }
  if (type === 'stock' || title.includes('stok') || body.includes('stok')) {
    return n?.link || '/urunler';
  }
  if (type === 'promo' || type === 'campaign' || title.includes('indirim') || title.includes('kupon')) {
    return '/urunler';
  }

  return '/panel';
}

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
            link: getNotificationLink(n, user),
            icon: mapNotificationTypeToEmoji(n.type)
          }));
        setNotifications(mapped);
      }
    } catch {
      // Ignore network errors
    }
  }, [isAuthenticated, user, getDeletedIdsFromStorage]);

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

    let hubConn = null;
    let disposed = false;
    import('@microsoft/signalr').then(({ HubConnectionBuilder }) => {
      if (disposed) return;
      hubConn = new HubConnectionBuilder()
        .withUrl(`${signalrUrl}/notifications`, {
          accessTokenFactory: () => safeGetItem("accessToken") || ""
        })
        .withAutomaticReconnect()
        .build();

      hubConn.on("ReceiveNotification", (notif) => {
        if (!notif) return;
        const deletedIds = getDeletedIdsFromStorage();
        if (deletedIds.includes(notif.id)) return;

        const newNotif = {
          id: notif.id,
          type: notif.type || 'system',
          title: notif.title || 'Yeni Bildirim',
          body: notif.body || notif.message || '',
          time: 'Şimdi',
          read: false,
          link: getNotificationLink(notif, user),
          icon: mapNotificationTypeToEmoji(notif.type)
        };
        setNotifications(prev => [newNotif, ...prev]);
      });

      return hubConn.start()
        .then(async () => {
          if (disposed) return;
          setConnection(hubConn);
          if (user?.id) await hubConn.invoke("JoinMyNotifications", user.id).catch(() => null);
        });
    }).catch(() => null);

    return () => {
      disposed = true;
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

  const markChatNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => {
      const type = String(n.type || '').toLowerCase();
      const title = String(n.title || '').toLowerCase();
      const body = String(n.body || n.message || '').toLowerCase();
      if (type === 'chat' || type === 'message' || title.includes('mesaj') || body.includes('mesaj')) {
        return { ...n, read: true };
      }
      return n;
    }));

    const chatNotifs = notifications.filter(n => {
      const type = String(n.type || '').toLowerCase();
      const title = String(n.title || '').toLowerCase();
      const body = String(n.body || n.message || '').toLowerCase();
      return !n.read && (type === 'chat' || type === 'message' || title.includes('mesaj') || body.includes('mesaj'));
    });

    if (chatNotifs.length > 0) {
      try {
        await Promise.all(chatNotifs.map(n => markNotificationAsRead(n.id).catch(() => null)));
      } catch {
        // Ignore error
      }
    }
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    markChatNotificationsRead,
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
