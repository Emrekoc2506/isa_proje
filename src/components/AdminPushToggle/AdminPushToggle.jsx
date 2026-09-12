import { useState, useEffect, useCallback, useRef } from "react";
import { FiBell, FiBellOff, FiAlertCircle, FiCheck, FiInfo, FiX } from "react-icons/fi";
import styles from "./AdminPushToggle.module.css";
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "../../services/webPushService";

export default function AdminPushToggle() {
  const [status, setStatus] = useState({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isIos: false,
    isStandalone: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [message, setMessage] = useState(null);
  const popoverRef = useRef(null);

  const checkStatus = useCallback(async () => {
    const current = await getPushSubscriptionStatus();
    setStatus(current);
  }, []);

  useEffect(() => {
    checkStatus();

    // Dışarı tıklandığında popover'ı kapat
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [checkStatus]);

  // Otomatik abone kontrolü: Eğer izin verilmiş ama bu cihazda henüz kayıt yoksa sessizce kaydet
  useEffect(() => {
    if (status.isSupported && status.permission === "granted" && !status.isSubscribed && !loading) {
      subscribeToPush()
        .then((res) => {
          if (res.success) {
            checkStatus();
          }
        })
        .catch(() => {});
    }
  }, [status.isSupported, status.permission, status.isSubscribed, loading, checkStatus]);

  const handleToggle = async () => {
    setMessage(null);

    // Desteklenmiyorsa bilgilendir
    if (!status.isSupported) {
      if (status.isIos && !status.isStandalone) {
        setShowPopover(true);
        return;
      }
      setMessage("Tarayıcınız Web Push bildirimlerini desteklemiyor.");
      setShowPopover(true);
      return;
    }

    // İzin engellendiyse yönlendir
    if (status.permission === "denied") {
      setMessage("Bildirim izni tarayıcınız tarafından engellenmiş. Lütfen adres çubuğundaki kilit simgesinden bildirimlere izin verin.");
      setShowPopover(true);
      return;
    }

    setLoading(true);
    try {
      if (status.isSubscribed) {
        // Kapat
        const res = await unsubscribeFromPush();
        if (res.success) {
          setMessage("Sipariş bildirimleri bu cihaz için kapatıldı.");
        } else {
          setMessage(res.error || "Abonelik kapatılamadı.");
        }
      } else {
        // Aç
        const res = await subscribeToPush();
        if (res.success) {
          setMessage("Sipariş bildirimleri başarıyla aktif edildi! Yeni bir sipariş geldiğinde bildirim alacaksınız.");
        } else {
          setMessage(res.error || "Bildirim açılamadı.");
        }
      }
      await checkStatus();
      setShowPopover(true);
    } catch (err) {
      setMessage(err.message || "Bir işlem hatası oluştu.");
      setShowPopover(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      if (status.isSubscribed && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
        if (reg) {
          await reg.showNotification("Muhristan - Test Bildirimi", {
            body: "Web Push bildirimleri başarıyla çalışıyor!",
            icon: "/logo-2.png",
            badge: "/logo-2.png",
            vibrate: [200, 100, 200],
          });
          setMessage("Test bildirimi cihazınıza gönderildi.");
          return;
        }
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Muhristan - Test Bildirimi", {
          body: "Web Push bildirimleri başarıyla çalışıyor!",
          icon: "/logo-2.png",
        });
        setMessage("Test bildirimi tarayıcınızda gösterildi.");
      } else {
        setMessage("Lütfen önce bildirimleri aktif edin.");
      }
    } catch (err) {
      setMessage("Test bildirimi tetiklenemedi: " + err.message);
    }
  };

  // Buton görünümü belirle
  let btnClass = styles.statusInactive;
  let dotClass = styles.dotInactive;
  let label = "Sipariş Bildirimlerini Aç";
  let Icon = FiBell;

  if (status.isSubscribed) {
    btnClass = styles.statusActive;
    dotClass = styles.dotActive;
    label = "Sipariş Bildirimleri Açık";
    Icon = FiBell;
  } else if (status.permission === "denied") {
    btnClass = styles.statusDenied;
    dotClass = styles.dotDenied;
    label = "Bildirimler Engelli";
    Icon = FiBellOff;
  } else if (status.isIos && !status.isStandalone) {
    btnClass = styles.statusIos;
    dotClass = styles.dotIos;
    label = "iPhone Bildirim Ayarı";
    Icon = FiInfo;
  }

  return (
    <div className={styles.wrapper} ref={popoverRef}>
      <button
        type="button"
        className={`${styles.toggleBtn} ${btnClass}`}
        onClick={handleToggle}
        disabled={loading}
        title={label}
        aria-label={label}
      >
        <span className={`${styles.dot} ${dotClass}`} />
        <Icon className={styles.icon} />
        <span>{loading ? "İşleniyor..." : label}</span>
      </button>

      {/* Bilgilendirme / Yönetim Popover'ı */}
      {showPopover && (
        <div className={styles.popover} role="dialog">
          <div className={styles.popoverHeader}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FiBell /> Sipariş Bildirimleri
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setShowPopover(false)}
              aria-label="Kapat"
            >
              <FiX />
            </button>
          </div>

          {status.isIos && !status.isStandalone ? (
            <div className={styles.iosNotice}>
              <p className={styles.iosTitle}>
                📱 iPhone / iPad Kullanıcıları İçin:
              </p>
              <p className={styles.popoverText}>
                Apple iOS kısıtlaması gereği, ekran veya sekme kapalıyken bildirim alabilmek için:
              </p>
              <ol className={styles.iosList}>
                <li>Safari alt menüsünden <strong>Paylaş</strong> simgesine dokunun.</li>
                <li><strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini seçin.</li>
                <li>Ana ekrandan uygulamayı açıp buradan bildirimleri aktif edin.</li>
              </ol>
            </div>
          ) : (
            <div className={styles.popoverBody}>
              {message && <p className={styles.popoverText}>{message}</p>}
              {!message && status.isSubscribed && (
                <p className={styles.popoverText}>
                  ✅ Bildirimler aktif. Yeni bir sipariş geldiğinde cihazınıza anında sesli uyarı düşecektir.
                </p>
              )}
              {!message && !status.isSubscribed && status.permission !== "denied" && (
                <p className={styles.popoverText}>
                  Yeni siparişleri kaçırmamak için bildirim izni verin. Site kapalıyken bile bildirim alabilirsiniz.
                </p>
              )}
              {!message && status.permission === "denied" && (
                <p className={styles.deniedNotice}>
                  <FiAlertCircle style={{ verticalAlign: "middle", marginRight: "4px" }} />
                  Tarayıcınız bu sitede bildirimleri engellemiş. Adres çubuğundaki ayarlar simgesinden izin veriniz.
                </p>
              )}
            </div>
          )}

          <div className={styles.popoverActions}>
            {status.isSubscribed && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={handleSendTestNotification}
              >
                🔔 Test Bildirimi Gönder
              </button>
            )}
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setShowPopover(false)}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
