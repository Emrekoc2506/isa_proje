import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as signalR from "@microsoft/signalr";
import { getMyNotifications, markNotificationAsRead } from '../services/notificationApi';
import { me } from '../services/authApi';

const NotificationContext = createContext(null);
const signalrUrl = import.meta.env.VITE_SIGNALR_BASE_URL ?? "https://localhost:7148/hubs";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [connection, setConnection] = useState(null);

  // Bildirimleri API'den Çekme
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const data = await getMyNotifications();
      if (data) {
        const mapped = data.map(n => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title || 'Bildirim',
          body: n.message || n.body || '',
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi',
          read: n.isRead ?? false,
          link: n.link || '/panel',
          icon: mapNotificationTypeToEmoji(n.type)
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("Bildirimler yüklenemedi:", err);
    }
  }, []);

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
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let hubConn = new signalR.HubConnectionBuilder()
      .withUrl(`${signalrUrl}/notifications`, {
        accessTokenFactory: () => localStorage.getItem("accessToken")
      })
      .withAutomaticReconnect()
      .build();

    hubConn.start()
      .then(async () => {
        console.log("Notification Hub bağlantısı kuruldu.");
        setConnection(hubConn);

        // Kullanıcı bilgisini çekip kendi grubuna katılalım
        const userObj = await me().catch(() => null);
        if (userObj && userObj.id) {
          await hubConn.invoke("JoinMyNotifications", userObj.id).catch(console.error);
        }
      })
      .catch(err => {
        console.error("Notification Hub bağlantı hatası:", err);
      });

    // Real-time bildirim alıcısı
    hubConn.on("ReceiveNotification", (notif) => {
      if (notif) {
        const newNotif = {
          id: notif.id,
          type: notif.type || 'system',
          title: notif.title || 'Yeni Bildirim',
          body: notif.message || notif.body || '',
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
        hubConn.stop();
      }
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Bildirimi okundu yap
  const markRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Bildirim okundu olarak işaretlenemedi:", err);
      // API'de hata verse de lokalde işaretleyebiliriz (fallback)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  // Tümünü okundu yap
  const markAllRead = useCallback(async () => {
    try {
      // Backend'de "/notifications/read-all" olmayabilir, o yüzden bekleyenleri tek tek veya lokalde işaretleyelim
      const unreadList = notifications.filter(n => !n.read);
      await Promise.all(unreadList.map(n => markNotificationAsRead(n.id).catch(() => null)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Tümünü okundu işaretleme hatası:", err);
    }
  }, [notifications]);

  // Tümünü sil (Lokal)
  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clearAll, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
