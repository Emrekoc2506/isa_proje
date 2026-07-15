import styles from './CheckoutPage.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiTruck, FiTag, FiShoppingBag, FiCheck, FiChevronRight, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import * as accountApi from '../../services/accountApi';
import * as checkoutApi from '../../services/checkoutApi';
import * as couponApi from '../../services/couponApi';
import * as orderApi from '../../services/orderApi';
import * as paymentApi from '../../services/paymentApi';

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  // Loading states
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // Selected values
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingAddressId, setBillingAddressId] = useState(null);
  const [sameAddress, setSameAddress] = useState(true);

  // Guest Address states
  const [guestShipping, setGuestShipping] = useState({
    fullName: '', email: '', phoneNumber: '', city: '', district: '',
    neighborhood: '', addressLine: '', postalCode: '', country: 'TR'
  });
  const [guestBilling, setGuestBilling] = useState({
    fullName: '', email: '', phoneNumber: '', city: '', district: '',
    neighborhood: '', addressLine: '', postalCode: '', country: 'TR'
  });

  const [shippingMethodCode, setShippingMethodCode] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState('');

  // Fetch addresses if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true);
      accountApi.getAddresses()
        .then((data) => {
          setAddresses(data || []);
          // Set default shipping/billing
          const defShipping = data?.find(a => a.isDefaultShipping);
          const defBilling = data?.find(a => a.isDefaultBilling);
          if (defShipping) setShippingAddressId(defShipping.id);
          else if (data?.length > 0) setShippingAddressId(data[0].id);

          if (defBilling) setBillingAddressId(defBilling.id);
          else if (data?.length > 0) setBillingAddressId(data[0].id);
        })
        .catch(console.error)
        .finally(() => setLoadingAddresses(false));
    }
  }, [isAuthenticated]);

  // Load preview data
  const loadPreview = useCallback(async () => {
    if (cartItems.length === 0) return;

    setPreviewLoading(true);
    setPreviewError('');

    const payload = {
      shippingMethodCode,
      couponCode: couponApplied || null
    };

    if (isAuthenticated) {
      payload.shippingAddressId = shippingAddressId;
      payload.billingAddressId = sameAddress ? shippingAddressId : billingAddressId;
    } else {
      payload.guestShippingAddress = guestShipping;
      payload.guestBillingAddress = sameAddress ? guestShipping : guestBilling;
    }

    try {
      const data = await checkoutApi.previewCheckout(payload);
      setPreviewData(data);
    } catch (err) {
      setPreviewError(err.message || 'Ön izleme hesaplanamadı.');
    } finally {
      setPreviewLoading(false);
    }
  }, [isAuthenticated, cartItems, shippingAddressId, billingAddressId, sameAddress, guestShipping, guestBilling, shippingMethodCode, couponApplied]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Apply Coupon
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) return;

    try {
      const res = await couponApi.validateCoupon(couponCode.trim());
      setCouponApplied(couponCode.trim());
      setCouponSuccess(`"${couponCode.trim()}" kuponu başarıyla uygulandı!`);
    } catch (err) {
      setCouponError(err.message || 'Kupon geçersiz.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied('');
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Submit Order and Proceed to Payment
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;

    setOrderLoading(true);

    const payload = {
      shippingMethodCode,
      couponCode: couponApplied || null
    };

    if (isAuthenticated) {
      if (!shippingAddressId) {
        alert("Lütfen teslimat adresi seçin.");
        setOrderLoading(false);
        return;
      }
      payload.shippingAddressId = shippingAddressId;
      payload.billingAddressId = sameAddress ? shippingAddressId : billingAddressId;
    } else {
      const s = guestShipping;
      if (!s.fullName || !s.email || !s.phoneNumber || !s.city || !s.district || !s.neighborhood || !s.addressLine || !s.postalCode) {
        alert("Lütfen tüm adres ve iletişim alanlarını doldurun.");
        setOrderLoading(false);
        return;
      }

      // E-posta format validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(s.email)) {
        alert("Lütfen geçerli bir e-posta adresi girin.");
        setOrderLoading(false);
        return;
      }

      payload.guestShippingAddress = guestShipping;
      payload.guestBillingAddress = sameAddress ? guestShipping : guestBilling;
      payload.customerName = guestShipping.fullName;
      payload.customerEmail = guestShipping.email;
      payload.customerPhone = guestShipping.phoneNumber;
    }

    try {
      // 1. Create order
      let orderRes;
      if (isAuthenticated) {
        orderRes = await orderApi.createOrder(payload);
      } else {
        orderRes = await orderApi.createGuestOrder(payload);
      }

      const orderId = orderRes.id;

      // Store pending order details
      sessionStorage.setItem('pendingOrderId', orderId);
      if (orderRes.orderNumber) {
        sessionStorage.setItem('pendingOrderNumber', orderRes.orderNumber);
      }
      const emailVal = isAuthenticated ? '' : guestShipping.email;
      if (emailVal) {
        sessionStorage.setItem('pendingOrderEmail', emailVal);
      }

      // 2. Initialize payment redirect
      const paymentRes = await paymentApi.initializePayment({
        orderId,
        provider: 'iyzico',
        returnUrl: window.location.origin + '/odeme/sonuc',
        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
      });

      // 3. Redirect to provider
      if (paymentRes?.redirectUrl) {
        window.location.assign(paymentRes.redirectUrl);
      } else {
        navigate('/odeme/sonuc');
      }
    } catch (err) {
      let errorMessage = err.message || "Sipariş oluşturulurken bir hata oluştu.";
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      alert(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPhone = (val) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    digits = digits.substring(0, 10);
    let res = '';
    if (digits.length > 0) res += digits.substring(0, 3);
    if (digits.length > 3) res += ' ' + digits.substring(3, 6);
    if (digits.length > 6) res += ' ' + digits.substring(6, 8);
    if (digits.length > 8) res += ' ' + digits.substring(8, 10);
    return res;
  };

  const handleGuestShippingChange = (field, val) => {
    let value = val;
    if (field === 'phoneNumber') {
      value = formatPhone(val);
    }
    setGuestShipping(prev => ({ ...prev, [field]: value }));
  };

  const handleGuestBillingChange = (field, val) => {
    let value = val;
    if (field === 'phoneNumber') {
      value = formatPhone(val);
    }
    setGuestBilling(prev => ({ ...prev, [field]: value }));
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <FiShoppingBag className={styles.emptyIcon} />
        <h2>Sepetiniz Boş</h2>
        <p>Ödeme yapabilmek için sepetinize ürün eklemelisiniz.</p>
        <button onClick={() => navigate('/urunler')} className={styles.shopBtn}>Alışverişe Başla</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          {/* 1. ADRES SEÇİMİ */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}><FiMapPin /> Teslimat & Fatura Adresi</h3>

            {isAuthenticated ? (
              // Authenticated address list
              loadingAddresses ? (
                <p>Adresleriniz yükleniyor...</p>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      className={`${styles.addressSelectCard} ${shippingAddressId === addr.id ? styles.selectedCard : ''}`}
                      onClick={() => setShippingAddressId(addr.id)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>{addr.title}</span>
                        {shippingAddressId === addr.id && <FiCheck className={styles.checkIcon} />}
                      </div>
                      <p className={styles.cardName}>{addr.fullName}</p>
                      <p className={styles.cardAddress}>{addr.neighborhood}, {addr.addressLine} {addr.district}/{addr.city}</p>
                    </div>
                  ))}
                  {addresses.length === 0 && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Kayıtlı adresiniz bulunmamaktadır.</p>
                      <button onClick={() => navigate('/adreslerim')} className={styles.seeAllBtn}>Adres Ekle</button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Guest Address forms
              <div className={styles.guestAddressForm}>
                <h4>Teslimat Adresi</h4>
                <div className={styles.formGrid}>
                  <input type="text" placeholder="Ad Soyad *" required value={guestShipping.fullName} onChange={e => handleGuestShippingChange('fullName', e.target.value)} className={styles.input} />
                  <input type="email" placeholder="E-posta *" required value={guestShipping.email} onChange={e => handleGuestShippingChange('email', e.target.value)} className={styles.input} />
                  <input type="tel" placeholder="Telefon *" required value={guestShipping.phoneNumber} onChange={e => handleGuestShippingChange('phoneNumber', e.target.value)} className={styles.input} />
                  <input type="text" placeholder="Şehir *" required value={guestShipping.city} onChange={e => handleGuestShippingChange('city', e.target.value)} className={styles.input} />
                  <input type="text" placeholder="İlçe *" required value={guestShipping.district} onChange={e => handleGuestShippingChange('district', e.target.value)} className={styles.input} />
                  <input type="text" placeholder="Mahalle *" required value={guestShipping.neighborhood} onChange={e => handleGuestShippingChange('neighborhood', e.target.value)} className={styles.input} />
                  <input type="text" placeholder="Posta Kodu *" required value={guestShipping.postalCode} onChange={e => handleGuestShippingChange('postalCode', e.target.value)} className={styles.input} />
                  <input type="text" placeholder="Açık Adres *" required value={guestShipping.addressLine} onChange={e => handleGuestShippingChange('addressLine', e.target.value)} className={styles.input} style={{ gridColumn: 'span 2' }} />
                </div>
              </div>
            )}

            {/* Fatura Adresi Ayrı İse */}
            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={sameAddress} onChange={e => setSameAddress(e.target.checked)} />
                Fatura adresim teslimat adresiyle aynı olsun
              </label>
            </div>

            {!sameAddress && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'var(--gold-light)', margin: '0 0 12px 0' }}>Fatura Adresi</h4>
                {isAuthenticated ? (
                  <div className={styles.addressList}>
                    {addresses.map(addr => (
                      <div 
                        key={addr.id} 
                        className={`${styles.addressSelectCard} ${billingAddressId === addr.id ? styles.selectedCard : ''}`}
                        onClick={() => setBillingAddressId(addr.id)}
                      >
                        <div className={styles.cardHeader}>
                          <span className={styles.cardTitle}>{addr.title}</span>
                          {billingAddressId === addr.id && <FiCheck className={styles.checkIcon} />}
                        </div>
                        <p className={styles.cardName}>{addr.fullName}</p>
                        <p className={styles.cardAddress}>{addr.neighborhood}, {addr.addressLine} {addr.district}/{addr.city}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.guestAddressForm}>
                    <div className={styles.formGrid}>
                      <input type="text" placeholder="Ad Soyad *" required value={guestBilling.fullName} onChange={e => handleGuestBillingChange('fullName', e.target.value)} className={styles.input} />
                      <input type="tel" placeholder="Telefon *" required value={guestBilling.phoneNumber} onChange={e => handleGuestBillingChange('phoneNumber', e.target.value)} className={styles.input} />
                      <input type="text" placeholder="Şehir *" required value={guestBilling.city} onChange={e => handleGuestBillingChange('city', e.target.value)} className={styles.input} />
                      <input type="text" placeholder="İlçe *" required value={guestBilling.district} onChange={e => handleGuestBillingChange('district', e.target.value)} className={styles.input} />
                      <input type="text" placeholder="Mahalle *" required value={guestBilling.neighborhood} onChange={e => handleGuestBillingChange('neighborhood', e.target.value)} className={styles.input} />
                      <input type="text" placeholder="Posta Kodu *" required value={guestBilling.postalCode} onChange={e => handleGuestBillingChange('postalCode', e.target.value)} className={styles.input} />
                      <input type="text" placeholder="Açık Adres *" required value={guestBilling.addressLine} onChange={e => handleGuestBillingChange('addressLine', e.target.value)} className={styles.input} style={{ gridColumn: 'span 2' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. KARGO YÖNTEMİ */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}><FiTruck /> Kargo Yöntemi</h3>
            <div className={styles.shippingMethods}>
              {previewData?.shippingMethods?.map(method => (
                <div 
                  key={method.code} 
                  className={`${styles.shippingMethodCard} ${shippingMethodCode === method.code ? styles.selectedCard : ''}`}
                  onClick={() => setShippingMethodCode(method.code)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <p className={styles.methodName}>{method.name}</p>
                      <p className={styles.methodDesc}>{method.code === 'standard' ? '3-5 iş günü teslimat' : method.code === 'express' ? '1-2 iş günü teslimat' : 'Mağazadan teslim alma'}</p>
                    </div>
                    <span className={styles.methodPrice}>
                      {method.amount === 0 ? 'Ücretsiz' : `${method.amount} ₺`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          {/* SİPARİŞ ÖZETİ & HESAPLAMA */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}><FiShoppingBag /> Sipariş Özeti</h3>
            
            <div className={styles.cartItemsList}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.cartItemRow}>
                  <img src={item.image} alt={item.name} className={styles.cartItemImg} />
                  <div className={styles.cartItemInfo}>
                    <p className={styles.cartItemName}>{item.name}</p>
                    <p className={styles.cartItemMeta}>{item.qty} adet × {item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* KUPON FORMU */}
            <div className={styles.couponSection}>
              <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={e => {
                    setCouponCode(e.target.value);
                    if (couponError) setCouponError('');
                    if (couponSuccess) setCouponSuccess('');
                  }} 
                  placeholder="İndirim kuponu" 
                  className={styles.couponInput}
                  disabled={!!couponApplied} 
                />
                {couponApplied ? (
                  <button type="button" onClick={handleRemoveCoupon} className={styles.couponRemoveBtn}>Kaldır</button>
                ) : (
                  <button type="submit" className={styles.couponApplyBtn}>Uygula</button>
                )}
              </form>
              {couponSuccess && <p className={styles.couponSuccess}>{couponSuccess}</p>}
              {couponError && <p className={styles.couponError}>{couponError}</p>}
            </div>

            {/* HESAPLAR */}
            <div className={styles.summaryTotals}>
              <div className={styles.totalsRow}>
                <span>Ara Toplam</span>
                <span>{previewData?.subtotal || 0} ₺</span>
              </div>
              
              {previewData?.productDiscountAmount > 0 && (
                <div className={`${styles.totalsRow} ${styles.discountText}`}>
                  <span>Ürün İndirimi</span>
                  <span>-{previewData.productDiscountAmount} ₺</span>
                </div>
              )}

              {previewData?.couponDiscountAmount > 0 && (
                <div className={`${styles.totalsRow} ${styles.discountText}`}>
                  <span>Kupon İndirimi</span>
                  <span>-{previewData.couponDiscountAmount} ₺</span>
                </div>
              )}

              <div className={styles.totalsRow}>
                <span>Kargo</span>
                <span>{previewData?.shippingAmount === 0 ? 'Ücretsiz' : `${previewData?.shippingAmount || 0} ₺`}</span>
              </div>

              {previewData?.taxAmount > 0 && (
                <div className={styles.totalsRow}>
                  <span>KDV</span>
                  <span>{previewData.taxAmount} ₺</span>
                </div>
              )}

              <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                <span>Genel Toplam</span>
                <span>{previewData?.grandTotal || 0} {previewData?.currency || 'TRY'}</span>
              </div>
            </div>

            {/* UYARILAR */}
            {previewData?.warnings?.length > 0 && (
              <div className={styles.warningsBox}>
                {previewData.warnings.map((warn, index) => (
                  <div key={index} className={styles.warningRow}>
                    <FiAlertTriangle /> <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {previewError && (
              <div className={styles.warningsBox} style={{ borderColor: '#e05594', color: '#e05594' }}>
                <FiAlertTriangle /> <span>{previewError}</span>
              </div>
            )}

            <button 
              onClick={handleSubmitOrder}
              disabled={orderLoading || previewLoading || !!previewError}
              className={styles.submitBtn}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}
            >
              {orderLoading && <FiLoader className={styles.spinner} style={{ animation: 'spin 1.5s linear infinite', fontSize: 16, margin: 0 }} />}
              Siparişi Tamamla & Öde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
