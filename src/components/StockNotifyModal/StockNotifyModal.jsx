import { useState, useEffect } from "react";
import { FiBell, FiX, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import styles from "./StockNotifyModal.module.css";

export default function StockNotifyModal({ isOpen, onClose, product }) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setTimeout(() => {
      // Store notification request in localStorage
      const key = `isa_stock_notify_${product.id}`;
      localStorage.setItem(key, JSON.stringify({ email, requestedAt: new Date().toISOString() }));
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>
          <FiX size={18} />
        </button>

        {!submitted ? (
          <>
            <div className={styles.iconWrapper}>
              <FiBell />
            </div>
            <h3 className={styles.title}>Stoka Gelince Bildir</h3>
            <p className={styles.subtitle}>
              <span className={styles.productName}>{product.name || product.title}</span> stoklarımıza girdiğinde size e-posta ile haber verelim.
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>E-Posta Adresiniz</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Kaydediliyor..." : "Haber Ver"}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successState}>
            <FiCheckCircle className={styles.successIcon} />
            <h3 className={styles.title}>Talebiniz Alındı!</h3>
            <p className={styles.subtitle}>
              Ürün stoka girdiğinde <strong>{email}</strong> adresine bilgilendirme e-postası göndereceğiz.
            </p>
            <button className={styles.submitBtn} onClick={handleClose}>
              Tamam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
