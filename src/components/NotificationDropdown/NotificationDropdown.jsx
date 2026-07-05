import styles from './NotificationDropdown.module.css';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationDropdown({ open, onClose }) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const ref = useRef(null);

  // Dışarı tıklanırsa kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        ref.current && 
        !ref.current.contains(e.target) &&
        !e.target.closest('#btn-notifications')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    onClose();
    navigate(notif.link);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className={styles.dropdown}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-label="Bildirimler"
        >
          {/* Başlık */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerTitle}>Bildirimler</span>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </div>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  className={styles.markAllBtn}
                  onClick={markAllRead}
                  title="Tümünü okundu işaretle"
                >
                  <FiCheckCircle /> Tümünü Oku
                </button>
              )}
              <button
                className={styles.clearBtn}
                onClick={clearAll}
                title="Tüm bildirimleri temizle"
              >
                <FiTrash2 /> Temizle
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔔</span>
                <p>Bildirim yok</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map(notif => (
                  <motion.button
                    key={notif.id}
                    className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
                    onClick={() => handleNotifClick(notif)}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    layout
                  >
                    <span className={styles.itemIcon}>{notif.icon}</span>
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>{notif.title}</p>
                      <p className={styles.itemText}>{notif.body}</p>
                      <p className={styles.itemTime}>{notif.time}</p>
                    </div>
                    {!notif.read && <div className={styles.dot} aria-label="Okunmadı" />}
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
