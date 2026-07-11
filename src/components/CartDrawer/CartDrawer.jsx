import styles from './CartDrawer.module.css';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { createGuestOrder, createAuthenticatedOrder } from '../../services/orderApi';

export default function CartDrawer({ open, onClose }) {
  const { items, updateQty, removeFromCart, clearCart, totalCount, totalPrice } = useCart();
  const { products } = useProducts();

  // Checkout modal ve form state'leri
  const [showCheckout, setShowCheckout] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!city || !district || !fullAddress) {
      alert("Lütfen adres bilgilerini doldurun.");
      return;
    }

    // Sepet öğelerinin backend Guid (databaseId) eşleştirmesi
    const apiItems = items.map(item => {
      const originalProduct = products.find(p => String(p.id) === String(item.id) || p.slug === item.id);
      return {
        productId: originalProduct ? (originalProduct.databaseId || originalProduct.id) : item.id,
        quantity: item.qty
      };
    });

    try {
      setLoadingOrder(true);

      const payload = {
        shippingAddress: {
          city,
          district,
          fullAddress
        },
        items: apiItems
      };

      if (isLoggedIn) {
        await createAuthenticatedOrder(payload);
      } else {
        if (!customerName || !customerEmail || !customerPhone) {
          alert("Lütfen misafir müşteri bilgilerini doldurun.");
          return;
        }
        await createGuestOrder({
          customerName,
          customerEmail,
          customerPhone,
          ...payload
        });
      }

      alert("Siparişiniz başarıyla oluşturuldu! Teşekkür ederiz.");
      clearCart();
      setShowCheckout(false);
      onClose();
    } catch (err) {
      console.error("Sipariş oluşturma hatası:", err);
      alert("Sipariş oluşturulurken bir hata meydana geldi: " + (err.message || "İstek başarısız"));
    } finally {
      setLoadingOrder(false);
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
              {items.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🛒</span>
                  <p className={styles.emptyText}>Sepetiniz boş</p>
                  <button className={styles.continueBtn} onClick={onClose}>
                    Alışverişe Devam Et
                  </button>
                </div>
              ) : showCheckout ? (
                /* CHECKOUT FORMU */
                <form onSubmit={handleCheckoutSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ color: 'var(--gold-light)', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    Siparişi Tamamla
                  </h3>
                  
                  {!isLoggedIn && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ad Soyad *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>E-posta *</label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={e => setCustomerEmail(e.target.value)}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Telefon *</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Şehir / İl *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>İlçe *</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Açık Adres *</label>
                    <textarea
                      required
                      value={fullAddress}
                      onChange={e => setFullAddress(e.target.value)}
                      rows={3}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                      Sepete Dön
                    </button>
                    <button
                      type="submit"
                      disabled={loadingOrder}
                      style={{ flex: 2, padding: '10px', borderRadius: '4px', border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {loadingOrder ? "Gönderiliyor..." : "Siparişi Tamamla"}
                    </button>
                  </div>
                </form>
              ) : (
                /* NORMAL SEPET ÜRÜNLERİ */
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
            {items.length > 0 && !showCheckout && (
              <div className={styles.footer}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Toplam</span>
                  <span className={styles.totalValue}>{Math.round(totalPrice).toLocaleString('tr-TR')} ₺</span>
                </div>
                <button className={styles.checkoutBtn} onClick={() => setShowCheckout(true)}>
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
