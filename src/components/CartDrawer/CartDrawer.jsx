import styles from './CartDrawer.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ open, onClose }) {
  const { items, updateQty, removeFromCart, clearCart, totalCount, totalPrice } = useCart();

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
                          src={item.image || 'https://www.aromantra.com/hpeciai/5a41ef8e97c402e95227b0d980ac8ae6/eng_il_Incense-Sticks-Namaste-India-Palo-Santo-14455.jpg'}
                          alt={item.name}
                          className={styles.itemImg}
                        />
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.name}</p>
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
                <button className={styles.checkoutBtn}>
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
