import styles from './CheckoutPage.module.css'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMapPin,
  FiTruck,
  FiShoppingBag,
  FiCheck,
  FiLoader,
  FiAlertTriangle
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import LocationSelects from '../../components/LocationSelect/LocationSelects'
import * as accountApi from '../../services/accountApi'
import * as checkoutApi from '../../services/checkoutApi'
import * as couponApi from '../../services/couponApi'
import * as orderApi from '../../services/orderApi'
import * as paymentApi from '../../services/paymentApi'
import {
  isManualPayment,
  shouldInitializePayment,
  PAYMENT_METHODS
} from './paymentFlow'

import SEO from '../../components/SEO/SEO'

export default function CheckoutPage () {
  const { isAuthenticated } = useAuth()
  const { items: cartItems, clearCart } = useCart()
  const navigate = useNavigate()

  // Loading states
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [paymentOptions, setPaymentOptions] = useState({
    onlineCard: { enabled: false, provider: 'OnlineCard' },
    bankTransfer: { enabled: true }
  })
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS.BANK_TRANSFER
  )

  // Selected values
  const [shippingAddressId, setShippingAddressId] = useState(null)
  const [billingAddressId, setBillingAddressId] = useState(null)
  const [sameAddress, setSameAddress] = useState(true)

  // Guest Address states
  const [guestShipping, setGuestShipping] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: '',
    district: '',
    neighborhood: '',
    addressLine: '',
    postalCode: '',
    country: 'TR'
  })
  const [guestBilling, setGuestBilling] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: '',
    district: '',
    neighborhood: '',
    addressLine: '',
    postalCode: '',
    country: 'TR'
  })

  const [shippingMethodCode, setShippingMethodCode] = useState('standard')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [orderCustomNote, setOrderCustomNote] = useState('')

  const [previewData, setPreviewData] = useState(null)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    checkoutApi
      .getPaymentOptions()
      .then(data => {
        if (!data) return
        setPaymentOptions(data)
        if (!data.onlineCard?.enabled) {
          setPaymentMethod(current =>
            current === PAYMENT_METHODS.ONLINE_CARD
              ? PAYMENT_METHODS.BANK_TRANSFER
              : current
          )
        }
      })
      .catch(() => {
        // Manual methods remain available when the optional capability endpoint is unavailable.
        setPaymentMethod(current =>
          current === PAYMENT_METHODS.ONLINE_CARD
            ? PAYMENT_METHODS.BANK_TRANSFER
            : current
        )
      })
  }, [])

  // Fetch addresses if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true)
      accountApi
        .getAddresses()
        .then(data => {
          setAddresses(data || [])
          // Set default shipping/billing
          const defShipping = data?.find(a => a.isDefaultShipping)
          const defBilling = data?.find(a => a.isDefaultBilling)
          if (defShipping) setShippingAddressId(defShipping.id)
          else if (data?.length > 0) setShippingAddressId(data[0].id)

          if (defBilling) setBillingAddressId(defBilling.id)
          else if (data?.length > 0) setBillingAddressId(data[0].id)
        })
        .catch(console.error)
        .finally(() => setLoadingAddresses(false))
    }
  }, [isAuthenticated])

  // Load preview data
  const loadPreview = useCallback(async () => {
    if (cartItems.length === 0) return

    setPreviewLoading(true)
    setPreviewError('')

    const payload = {
      shippingMethodCode,
      couponCode: couponApplied || null,
      paymentMethod
    }

    if (isAuthenticated) {
      if (shippingAddressId && shippingAddressId.trim() !== '') {
        payload.shippingAddressId = shippingAddressId
        payload.billingAddressId = sameAddress
          ? shippingAddressId
          : billingAddressId || shippingAddressId
      }
    } else {
      const cleanShippingPhone = guestShipping.phoneNumber
        ? guestShipping.phoneNumber.replace(/\s+/g, '')
        : ''
      const cleanBillingPhone = guestBilling.phoneNumber
        ? guestBilling.phoneNumber.replace(/\s+/g, '')
        : ''

      const cleanGuestShipping = {
        ...guestShipping,
        neighborhood: guestShipping.neighborhood || 'Merkez',
        phoneNumber: cleanShippingPhone
      }
      const cleanGuestBilling = {
        ...guestBilling,
        neighborhood: guestBilling.neighborhood || 'Merkez',
        phoneNumber: cleanBillingPhone
      }

      payload.guestShippingAddress = cleanGuestShipping
      payload.guestBillingAddress = sameAddress
        ? cleanGuestShipping
        : cleanGuestBilling
    }

    try {
      const data = await checkoutApi.previewCheckout(payload)
      setPreviewData(data)
    } catch (err) {
      setPreviewError(err.message || 'Ön izleme hesaplanamadı.')
    } finally {
      setPreviewLoading(false)
    }
  }, [
    isAuthenticated,
    cartItems,
    shippingAddressId,
    billingAddressId,
    sameAddress,
    guestShipping,
    guestBilling,
    shippingMethodCode,
    couponApplied,
    paymentMethod
  ])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  // Apply Coupon
  const handleApplyCoupon = async e => {
    e.preventDefault()
    setCouponError('')
    setCouponSuccess('')

    if (!couponCode.trim()) return

    try {
      await couponApi.validateCoupon(couponCode.trim())
      setCouponApplied(couponCode.trim())
      setCouponSuccess(`"${couponCode.trim()}" kuponu başarıyla uygulandı!`)
    } catch (err) {
      setCouponError(err.message || 'Kupon geçersiz.')
    }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied('')
    setCouponCode('')
    setCouponSuccess('')
    setCouponError('')
  }

  // Submit Order and Proceed to Payment
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return

    setOrderLoading(true)

    const payload = {
      paymentMethod,
      shippingMethodCode,
      couponCode: couponApplied || null,
      customerNote: orderCustomNote.trim() || null
    }

    if (isAuthenticated) {
      if (!shippingAddressId) {
        alert('Lütfen teslimat adresi seçin.')
        setOrderLoading(false)
        return
      }
      payload.shippingAddressId = shippingAddressId
      payload.billingAddressId = sameAddress
        ? shippingAddressId
        : billingAddressId
    } else {
      const s = guestShipping
      if (
        !s.fullName ||
        !s.email ||
        !s.phoneNumber ||
        !s.city ||
        !s.district ||
        !s.neighborhood ||
        !s.addressLine ||
        !s.postalCode
      ) {
        alert('Lütfen tüm adres ve iletişim alanlarını doldurun.')
        setOrderLoading(false)
        return
      }

      // E-posta format validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(s.email)) {
        alert('Lütfen geçerli bir e-posta adresi girin.')
        setOrderLoading(false)
        return
      }

      const cleanShippingPhone = guestShipping.phoneNumber
        ? guestShipping.phoneNumber.replace(/\s+/g, '')
        : ''
      const cleanBillingPhone = guestBilling.phoneNumber
        ? guestBilling.phoneNumber.replace(/\s+/g, '')
        : ''

      const cleanGuestShipping = {
        ...guestShipping,
        neighborhood: guestShipping.neighborhood || 'Merkez',
        phoneNumber: cleanShippingPhone
      }
      const cleanGuestBilling = {
        ...guestBilling,
        neighborhood: guestBilling.neighborhood || 'Merkez',
        phoneNumber: cleanBillingPhone
      }

      payload.guestShippingAddress = cleanGuestShipping
      payload.guestBillingAddress = sameAddress
        ? cleanGuestShipping
        : cleanGuestBilling
      payload.customerName = guestShipping.fullName
      payload.customerEmail = guestShipping.email
      payload.customerPhone = cleanShippingPhone
    }

    try {
      // 1. Create order
      let orderRes
      if (isAuthenticated) {
        orderRes = await orderApi.createOrder(payload)
      } else {
        orderRes = await orderApi.createGuestOrder(payload)
      }

      const orderId = orderRes.id

      // Store pending order details
      sessionStorage.setItem('pendingOrderId', orderId)
      if (orderRes.orderNumber) {
        sessionStorage.setItem('pendingOrderNumber', orderRes.orderNumber)
      }

      // Manual payments are complete orders and must never call the online payment endpoint.
      if (isManualPayment(paymentMethod)) {
        await clearCart()
        navigate(
          `/odeme/sonuc?orderId=${encodeURIComponent(
            orderId
          )}&orderNumber=${encodeURIComponent(orderRes.orderNumber || '')}`
        )
        return
      }

      // OnlineCard owns exactly one payment initialization attempt for this submit.
      try {
        const paymentRes = await paymentApi.initializePayment({
          orderId,
          provider: 'online',
          returnUrl: window.location.origin + '/odeme/sonuc',
          idempotencyKey:
            globalThis.crypto?.randomUUID?.() || `idemp-${Date.now()}`
        })

        if (paymentRes?.redirectUrl) {
          window.location.assign(paymentRes.redirectUrl)
        } else {
          throw new Error('Online ödeme yönlendirme bağlantısı alınamadı.')
        }
      } catch (err) {
        sessionStorage.setItem(
          'paymentInitError',
          err.message || 'Online ödeme başlatılamadı.'
        )
        navigate(
          `/odeme/sonuc?orderId=${encodeURIComponent(
            orderId
          )}&orderNumber=${encodeURIComponent(orderRes.orderNumber || '')}`
        )
      }
    } catch (err) {
      let errorMessage =
        err.message || 'Sipariş oluşturulurken bir hata oluştu.'
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ')
      }
      alert(errorMessage)
    } finally {
      setOrderLoading(false)
    }
  }

  const formatPhone = val => {
    let digits = val.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.substring(1)
    digits = digits.substring(0, 10)
    let res = ''
    if (digits.length > 0) res += digits.substring(0, 3)
    if (digits.length > 3) res += ' ' + digits.substring(3, 6)
    if (digits.length > 6) res += ' ' + digits.substring(6, 8)
    if (digits.length > 8) res += ' ' + digits.substring(8, 10)
    return res
  }

  const handleGuestShippingChange = (field, val) => {
    let value = val
    if (field === 'phoneNumber') {
      value = formatPhone(val)
    }
    setGuestShipping(prev => ({ ...prev, [field]: value }))
  }

  const handleGuestBillingChange = (field, val) => {
    let value = val
    if (field === 'phoneNumber') {
      value = formatPhone(val)
    }
    setGuestBilling(prev => ({ ...prev, [field]: value }))
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <FiShoppingBag className={styles.emptyIcon} />
        <h2>Sepetiniz Boş</h2>
        <p>Ödeme yapabilmek için sepetinize ürün eklemelisiniz.</p>
        <button onClick={() => navigate('/urunler')} className={styles.shopBtn}>
          Alışverişe Başla
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SEO title='Ödeme ve Sipariş | Muhristan' noindex={true} />
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          {/* 1. ADRES SEÇİMİ */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <FiMapPin /> Teslimat & Fatura Adresi
            </h3>

            {isAuthenticated ? (
              // Authenticated address list
              loadingAddresses ? (
                <p>Adresleriniz yükleniyor...</p>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`${styles.addressSelectCard} ${
                        shippingAddressId === addr.id ? styles.selectedCard : ''
                      }`}
                      onClick={() => setShippingAddressId(addr.id)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>{addr.title}</span>
                        {shippingAddressId === addr.id && (
                          <FiCheck className={styles.checkIcon} />
                        )}
                      </div>
                      <p className={styles.cardName}>{addr.fullName}</p>
                      <p className={styles.cardAddress}>
                        {addr.neighborhood}, {addr.addressLine} {addr.district}/
                        {addr.city}
                      </p>
                    </div>
                  ))}
                  {addresses.length === 0 && (
                    <div>
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: 13,
                          marginBottom: 12
                        }}
                      >
                        Kayıtlı adresiniz bulunmamaktadır.
                      </p>
                      <button
                        onClick={() => navigate('/adreslerim')}
                        className={styles.seeAllBtn}
                      >
                        Adres Ekle
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Guest Address forms
              <div className={styles.guestAddressForm}>
                <h4>Teslimat Adresi</h4>
                <div className={styles.formGrid}>
                  <input
                    type='text'
                    placeholder='Ad Soyad *'
                    required
                    value={guestShipping.fullName}
                    onChange={e =>
                      handleGuestShippingChange('fullName', e.target.value)
                    }
                    className={styles.input}
                  />
                  <input
                    type='email'
                    placeholder='E-posta *'
                    required
                    value={guestShipping.email}
                    onChange={e =>
                      handleGuestShippingChange('email', e.target.value)
                    }
                    className={styles.input}
                  />
                  <input
                    type='tel'
                    placeholder='Telefon *'
                    required
                    value={guestShipping.phoneNumber}
                    onChange={e =>
                      handleGuestShippingChange('phoneNumber', e.target.value)
                    }
                    className={styles.input}
                  />
                  <LocationSelects
                    city={guestShipping.city}
                    district={guestShipping.district}
                    neighborhood={guestShipping.neighborhood}
                    onCityChange={val => handleGuestShippingChange('city', val)}
                    onDistrictChange={val =>
                      handleGuestShippingChange('district', val)
                    }
                    onNeighborhoodChange={val =>
                      handleGuestShippingChange('neighborhood', val)
                    }
                    fieldInputClass={styles.input}
                    showLabels={false}
                    selectStyle={{
                      background: 'var(--bg-dark)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <input
                    type='text'
                    placeholder='Posta Kodu *'
                    required
                    value={guestShipping.postalCode}
                    onChange={e =>
                      handleGuestShippingChange('postalCode', e.target.value)
                    }
                    className={styles.input}
                  />
                  <input
                    type='text'
                    placeholder='Açık Adres *'
                    required
                    value={guestShipping.addressLine}
                    onChange={e =>
                      handleGuestShippingChange('addressLine', e.target.value)
                    }
                    className={styles.input}
                    style={{ gridColumn: 'span 2' }}
                  />
                </div>
              </div>
            )}

            {/* Fatura Adresi Ayrı İse */}
            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                <input
                  type='checkbox'
                  checked={sameAddress}
                  onChange={e => setSameAddress(e.target.checked)}
                />
                Fatura adresim teslimat adresiyle aynı olsun
              </label>
            </div>

            {!sameAddress && (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <h4
                  style={{ color: 'var(--gold-light)', margin: '0 0 12px 0' }}
                >
                  Fatura Adresi
                </h4>
                {isAuthenticated ? (
                  <div className={styles.addressList}>
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        className={`${styles.addressSelectCard} ${
                          billingAddressId === addr.id
                            ? styles.selectedCard
                            : ''
                        }`}
                        onClick={() => setBillingAddressId(addr.id)}
                      >
                        <div className={styles.cardHeader}>
                          <span className={styles.cardTitle}>{addr.title}</span>
                          {billingAddressId === addr.id && (
                            <FiCheck className={styles.checkIcon} />
                          )}
                        </div>
                        <p className={styles.cardName}>{addr.fullName}</p>
                        <p className={styles.cardAddress}>
                          {addr.neighborhood}, {addr.addressLine}{' '}
                          {addr.district}/{addr.city}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.guestAddressForm}>
                    <div className={styles.formGrid}>
                      <input
                        type='text'
                        placeholder='Ad Soyad *'
                        required
                        value={guestBilling.fullName}
                        onChange={e =>
                          handleGuestBillingChange('fullName', e.target.value)
                        }
                        className={styles.input}
                      />
                      <input
                        type='tel'
                        placeholder='Telefon *'
                        required
                        value={guestBilling.phoneNumber}
                        onChange={e =>
                          handleGuestBillingChange(
                            'phoneNumber',
                            e.target.value
                          )
                        }
                        className={styles.input}
                      />
                      <LocationSelects
                        city={guestBilling.city}
                        district={guestBilling.district}
                        neighborhood={guestBilling.neighborhood}
                        onCityChange={val =>
                          handleGuestBillingChange('city', val)
                        }
                        onDistrictChange={val =>
                          handleGuestBillingChange('district', val)
                        }
                        onNeighborhoodChange={val =>
                          handleGuestBillingChange('neighborhood', val)
                        }
                        fieldInputClass={styles.input}
                        showLabels={false}
                        selectStyle={{
                          background: 'var(--bg-dark)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <input
                        type='text'
                        placeholder='Posta Kodu *'
                        required
                        value={guestBilling.postalCode}
                        onChange={e =>
                          handleGuestBillingChange('postalCode', e.target.value)
                        }
                        className={styles.input}
                      />
                      <input
                        type='text'
                        placeholder='Açık Adres *'
                        required
                        value={guestBilling.addressLine}
                        onChange={e =>
                          handleGuestBillingChange(
                            'addressLine',
                            e.target.value
                          )
                        }
                        className={styles.input}
                        style={{ gridColumn: 'span 2' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KARGO FİRMASI VE ÜCRETİ BÖLÜMÜ */}
          <div
            className={styles.sectionCard}
            style={{
              background: 'rgba(201, 162, 39, 0.05)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <h3
              className={styles.sectionTitle}
              style={{
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--gold-light)',
                margin: '0 0 12px 0'
              }}
            >
              <FiTruck style={{ color: 'var(--gold)' }} /> Kargo & Teslimat
              Firması
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-dark, #0f0a18)',
                border: '1px solid rgba(201, 162, 39, 0.4)',
                borderRadius: '10px'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: '#e30613',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '-0.5px'
                  }}
                >
                  YK
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    Yurtiçi Kargo
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Tüm Türkiye'ye 1-3 iş günü içinde hızlı ve güvenli teslimat
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--gold-light)'
                  }}
                >
                  170.00 ₺
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: '#2ecc71',
                    fontWeight: 600
                  }}
                >
                  Sabit Ücret
                </span>
              </div>
            </div>
          </div>

          {/* KİŞİSELLEŞTİRME BÖLÜMÜ */}
          <div
            className={styles.sectionCard}
            style={{
              background:
                'linear-gradient(135deg, rgba(201, 162, 39, 0.08), rgba(20, 10, 32, 0.95))',
              border: '1.5px solid var(--gold, #c9a227)',
              boxShadow: '0 4px 16px rgba(201, 162, 39, 0.15)'
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--gold-light, #f5d680)',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>✨</span> Kişiye Özel Tılsım & İsim Hazırlığı (İsteğe Bağlı)
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary, #cbd5e1)',
                lineHeight: '1.5',
                marginBottom: '12px'
              }}
            >
              Ürününüzün size özel niyet ve ebced vefki ile hazırlanması için
              lütfen ürünü takacak kişinin <strong>Tam Adı</strong> ve{' '}
              <strong>Anne Adı</strong> bilgilerini yazın (Bilgileriniz tamamen
              gizli tutulmaktadır).
            </p>
            <div style={{ position: 'relative' }}>
              <textarea
                rows={3}
                maxLength={250}
                value={orderCustomNote}
                onChange={e => setOrderCustomNote(e.target.value)}
                placeholder='Örn: Ahmet oğlu Mehmet, Anne Adı: Ayşe — Özel tılsım notu...'
                style={{
                  width: '100%',
                  padding: '12px 14px 28px 14px',
                  background: 'var(--bg-dark, #0f0a18)',
                  border: '1px solid rgba(201, 162, 39, 0.4)',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  boxSizing: 'border-box'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '12px',
                  fontSize: '11px',
                  color: 'var(--text-muted, #94a3b8)',
                  fontWeight: 600
                }}
              >
                {orderCustomNote.length}/250
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Ödeme Yöntemi</h3>
            <div
              role='radiogroup'
              aria-label='Ödeme Yöntemi'
              style={{ display: 'grid', gap: 10 }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: paymentOptions.onlineCard?.enabled ? 1 : 0.6
                }}
              >
                <input
                  type='radio'
                  name='paymentMethod'
                  value={PAYMENT_METHODS.ONLINE_CARD}
                  checked={paymentMethod === PAYMENT_METHODS.ONLINE_CARD}
                  disabled={!paymentOptions.onlineCard?.enabled}
                  onChange={() => setPaymentMethod(PAYMENT_METHODS.ONLINE_CARD)}
                />
                <span>
                  Kredi / Banka Kartı
                  {!paymentOptions.onlineCard?.enabled && (
                    <small
                      style={{ display: 'block', color: 'var(--text-muted)' }}
                    >
                      Şu anda kullanılamıyor
                    </small>
                  )}
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type='radio'
                  name='paymentMethod'
                  value={PAYMENT_METHODS.BANK_TRANSFER}
                  checked={paymentMethod === PAYMENT_METHODS.BANK_TRANSFER}
                  onChange={() =>
                    setPaymentMethod(PAYMENT_METHODS.BANK_TRANSFER)
                  }
                />
                <span>Havale / EFT</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          {/* SİPARİŞ ÖZETİ & HESAPLAMA */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <FiShoppingBag /> Sipariş Özeti
            </h3>

            <div className={styles.cartItemsList}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.cartItemRow}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.cartItemImg}
                  />
                  <div className={styles.cartItemInfo}>
                    <p className={styles.cartItemName}>{item.name}</p>
                    {item.customNote && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--gold-light, #f5d680)',
                          margin: '2px 0 4px 0'
                        }}
                      >
                        ✨ Kişiselleştirme: {item.customNote}
                      </p>
                    )}
                    <p className={styles.cartItemMeta}>
                      {item.qty} adet × {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* KUPON FORMU */}
            <div className={styles.couponSection}>
              <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                <input
                  type='text'
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value)
                    if (couponError) setCouponError('')
                    if (couponSuccess) setCouponSuccess('')
                  }}
                  placeholder='İndirim kuponu'
                  className={styles.couponInput}
                  disabled={!!couponApplied}
                />
                {couponApplied ? (
                  <button
                    type='button'
                    onClick={handleRemoveCoupon}
                    className={styles.couponRemoveBtn}
                  >
                    Kaldır
                  </button>
                ) : (
                  <button type='submit' className={styles.couponApplyBtn}>
                    Uygula
                  </button>
                )}
              </form>
              {couponSuccess && (
                <p className={styles.couponSuccess}>{couponSuccess}</p>
              )}
              {couponError && (
                <p className={styles.couponError}>{couponError}</p>
              )}
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
                <span>Kargo (Yurtiçi Kargo)</span>
                <span>
                  {previewData?.shippingAmount === 0
                    ? 'Ücretsiz'
                    : `${previewData?.shippingAmount || 170} ₺`}
                </span>
              </div>

              {previewData?.taxAmount > 0 && (
                <div className={styles.totalsRow}>
                  <span>KDV</span>
                  <span>{previewData.taxAmount} ₺</span>
                </div>
              )}

              <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                <span>Genel Toplam</span>
                <span>
                  {previewData?.grandTotal || 0}{' '}
                  {previewData?.currency || 'TRY'}
                </span>
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
              <div
                className={styles.warningsBox}
                style={{ borderColor: '#e05594', color: '#e05594' }}
              >
                <FiAlertTriangle /> <span>{previewError}</span>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={orderLoading || previewLoading || !!previewError}
              className={styles.submitBtn}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 20
              }}
            >
              {orderLoading && (
                <FiLoader
                  className={styles.spinner}
                  style={{
                    animation: 'spin 1.5s linear infinite',
                    fontSize: 16,
                    margin: 0
                  }}
                />
              )}
              {shouldInitializePayment(paymentMethod)
                ? 'Siparişi Tamamla & Öde'
                : 'Siparişi Tamamla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
