import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoUser } from '../data/dashboard';

const NotificationContext = createContext(null);

const STORAGE_KEY = `mv_notifications_${demoUser.email}`;

// Demo bildirimler (gerçek sistemde API'den gelir)
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'message',       // message | order | promo | system
    title: 'Yeni Mesaj',
    body: 'Müşteri hizmetleri: Siparişiniz hakkında bilgi vermeyi unutmayın.',
    time: '5 dk önce',
    read: false,
    link: '/panel',        // tıklanınca gidilecek yer
    icon: '💬',
  },
  {
    id: 'n2',
    type: 'order',
    title: 'Siparişiniz Kargoya Verildi',
    body: '#MV-2025-002 numaralı siparişiniz kargoya teslim edildi.',
    time: '2 saat önce',
    read: false,
    link: '/panel',
    icon: '📦',
  },
  {
    id: 'n3',
    type: 'promo',
    title: 'Haftalık Kampanya',
    body: 'Uçucu yağlarda bu hafta %20 indirim! Kaçırmayın.',
    time: 'Dün',
    read: true,
    link: '/',
    icon: '✦',
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Profil Bilgilerinizi Tamamlayın',
    body: 'Daha iyi bir deneyim için adres bilgilerinizi ekleyin.',
    time: '2 gün önce',
    read: true,
    link: '/panel',
    icon: '⚙',
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // localStorage'dan yükle (yoksa demo verisi kullan)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setNotifications(stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS);
    } catch {
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  }, []);

  // Değişince kaydet
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Bildirimi okundu yap
  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Tümünü okundu yap
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Tümünü sil
  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
