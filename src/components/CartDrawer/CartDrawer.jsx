import styles from './CartDrawer.module.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartDrawer({ open, onClose }) {
  const { items, updateQty, removeFromCart, clearCart, totalCount, totalPrice, cartError, clearCartError } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Auto clear error after 4 seconds
  useEffect(() => {
    if (cartError) {
      const timer = setTimeout(() => {
        if (clearCartError) clearCartError();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cartError, clearCartError]);

  const handleGoToCheckout = () => {
    onClose();
    if (!isAuthenticated) {
      navigate('/giris', { state: { from: { pathname: '/odeme' } } });
    } else {
      navigate('/odeme');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Karartma */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Çekmece */}
          <motion.aside
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
            aria-label="Alışveriş Sepeti"
          >
            {/* Başlık */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <FiShoppingBag className={styles.headerIcon} />
                <div>
                  <h2 className={styles.title}>Sepetim</h2>
                  <p className={styles.count}>{totalCount} ürün</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Sepeti kapat">
                <FiX />
              </button>
            </div>

            {/* Ürün Listesi */}
            <div className={styles.body}>
              <AnimatePresence>
                {cartError && (
                  <motion.div
                    className={styles.errorBanner}
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                  >
                    <FiAlertCircle className={styles.errorIcon} />
                    <span className={styles.errorText}>{cartError}</span>
                    <button className={styles.errorClose} onClick={clearCartError}>
                      <FiX />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {items.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🛒</span>
                  <p className={styles.emptyText}>Sepetiniz boş</p>
                  <button className={styles.continueBtn} onClick={onClose}>
                    Alışverişe Devam Et
                  </button>
                </div>
              ) : (
                <ul className={styles.list}>
                  <AnimatePresence>
                    {items.map(item => (
                      <motion.li
                        key={item.id}
                        className={styles.item}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        layout
                      >
                        <img
                          src={item.image || item.imageUrl || '/ornek resim.jpg'}
                          alt={item.name}
                          className={styles.itemImg}
                          onError={(e) => {
                            e.target.src = '/ornek resim.jpg';
                          }}
                        />
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.name}</p>
                          {item.customNote && (
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--gold-light, #f5d680)',
                              background: 'rgba(201, 162, 39, 0.1)',
                              border: '1px solid rgba(201, 162, 39, 0.25)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              marginTop: '3px',
                              marginBottom: '4px',
                              lineHeight: 1.3
                            }}>
                              ✨ Kişiselleştirme: {item.customNote}
                            </div>
                          )}
                          <p className={styles.itemPrice}>{item.price}</p>
                          {/* Miktar kontrolü */}
                          <div className={styles.qtyRow}>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              aria-label="Azalt"
                            >
                              <FiMinus />
                            </button>
                            <span className={styles.qty}>{item.qty}</span>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              aria-label="Artır"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Ürünü sil"
                        >
                          <FiTrash2 />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Alt: Toplam + Butonlar */}
            {items.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Toplam</span>
                  <span className={styles.totalValue}>{Math.round(totalPrice).toLocaleString('tr-TR')} ₺</span>
                </div>
                <button className={styles.checkoutBtn} onClick={handleGoToCheckout}>
                  Siparişi Tamamla →
                </button>
                <button className={styles.clearBtn} onClick={clearCart}>
                  <FiTrash2 /> Sepeti Temizle
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
