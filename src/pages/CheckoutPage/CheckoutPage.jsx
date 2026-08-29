import styles from './CheckoutPage.module.css'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FiCheck,
  FiLoader,
  FiAlertTriangle,
  FiCopy,
  FiLock,
  FiShoppingBag,
  FiX
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import LocationSelects from '../../components/LocationSelect/LocationSelects'
import * as accountApi from '../../services/accountApi'
import * as couponApi from '../../services/couponApi'
import * as orderApi from '../../services/orderApi'
import * as checkoutApi from '../../services/checkoutApi'
import * as bankTransferApi from '../../services/bankTransferApi'
import { PAYMENT_METHODS } from './paymentFlow'
import logoImage from '../../assets/images/logo-2.png'
import SEO from '../../components/SEO/SEO'

export default function CheckoutPage () {
  const { isAuthenticated, user } = useAuth()
  const { items: cartItems, clearCart } = useCart()
  const navigate = useNavigate()

  // Stepper State: 1 = Adres, 2 = Kargo, 3 = Ödeme
  const [editingStep, setEditingStep] = useState(null)

  // Loading states
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.BANK_TRANSFER)

  // Bank transfer info
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Enpara',
    accountHolder: 'İsa Şahap',
    iban: 'TR09 0015 7000 0000 0136 3203 61',
    phone: '0542 790 68 63'
  })
  const [copiedIban, setCopiedIban] = useState(false)

  // Selected values
  const [shippingAddressId, setShippingAddressId] = useState(null)
  const [billingAddressId, setBillingAddressId] = useState(null)
  const [sameAddress, setSameAddress] = useState(true)
  const [agreedToTerms, setAgreedToTerms] = useState(true)

  // Modal states for contracts
  const [activeModal, setActiveModal] = useState(null)

  // Guest Address states
  const [guestShipping, setGuestShipping] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
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

  const [shippingMethodCode] = useState('standard')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [orderCustomNote] = useState('')

  const [previewData, setPreviewData] = useState(null)
  const [previewError, setPreviewError] = useState('')

  // Load Bank Transfer info
  useEffect(() => {
    bankTransferApi.getBankTransferInfo()
      .then(res => {
        if (res && res.iban) {
          setBankInfo(prev => ({
            ...prev,
            bankName: res.bankName || 'Enpara',
            accountHolder: res.accountHolder || 'İsa Şahap',
            iban: res.iban || 'TR09 0015 7000 0000 0136 3203 61'
          }))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch addresses if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true)
      accountApi
        .getAddresses()
        .then(data => {
          setAddresses(data || [])
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
      if (shippingAddressId && String(shippingAddressId).trim() !== '') {
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

  // Copy IBAN
  const handleCopyIban = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(bankInfo.iban.replace(/\s+/g, '')).then(() => {
      setCopiedIban(true)
      setTimeout(() => setCopiedIban(false), 2000)
    }).catch(console.error)
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

  // Submit Order and Proceed to Confirmation
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return

    if (!agreedToTerms) {
      alert('Lütfen Gizlilik ve Satış Sözleşmesini onaylayınız.')
      return
    }

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
        setEditingStep(1)
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
        !s.addressLine
      ) {
        alert('Lütfen tüm adres ve iletişim alanlarını doldurun.')
        setEditingStep(1)
        setOrderLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(s.email)) {
        alert('Lütfen geçerli bir e-posta adresi girin.')
        setEditingStep(1)
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
      let orderRes
      if (isAuthenticated) {
        orderRes = await orderApi.createOrder(payload)
      } else {
        orderRes = await orderApi.createGuestOrder(payload)
      }

      const orderId = orderRes.id
      const orderNumber = orderRes.orderNumber || ''
      const customerEmail = guestShipping.email || user?.email || ''

      sessionStorage.setItem('pendingOrderId', orderId)
      if (orderNumber) {
        sessionStorage.setItem('pendingOrderNumber', orderNumber)
      }

      // Save order context for result page
      sessionStorage.setItem(
        'lastOrderDetails',
        JSON.stringify({
          orderId,
          orderNumber,
          customerName: guestShipping.fullName || user?.fullName || 'Değerli Müşterimiz',
          customerEmail,
          customerPhone: guestShipping.phoneNumber || user?.phoneNumber || '',
          shippingAddress: guestShipping,
          totalAmount: previewData?.grandTotal || 0,
          itemsCount: cartItems.length,
          items: cartItems
        })
      )

      await clearCart()
      navigate(
        `/odeme/sonuc?orderId=${encodeURIComponent(
          orderId
        )}&orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}`
      )
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

  // Selected address summary for authenticated users
  const selectedAddr = addresses.find(a => a.id === shippingAddressId) || addresses[0]

  // Active address summary text
  const currentAddressSummary = isAuthenticated
    ? (selectedAddr ? `${selectedAddr.fullName}, ${selectedAddr.neighborhood || ''} ${selectedAddr.addressLine}, ${selectedAddr.district}/${selectedAddr.city}` : 'Adres seçilmedi')
    : (guestShipping.fullName ? `${guestShipping.fullName}, +90${guestShipping.phoneNumber || ''} ${guestShipping.addressLine || ''} ${guestShipping.district || ''} ${guestShipping.city || ''}` : 'Adres bilgisi giriniz')

  const currentEmailSummary = isAuthenticated
    ? (user?.email || '')
    : (guestShipping.email || 'E-posta belirtilmedi')

  if (cartItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyContainer}>
          <FiShoppingBag className={styles.emptyIcon} />
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Sepetiniz Boş</h2>
          <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Ödeme yapabilmek için sepetinize ürün eklemelisiniz.</p>
          <button onClick={() => navigate('/urunler')} className={styles.formActionBtn}>
            Alışverişe Başla
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SEO title='Güvenli Ödeme | Muhristan' noindex={true} />

      {/* Top Header */}
      <header className={styles.checkoutHeader}>
        <div className={styles.headerContainer}>
          <Link to='/' className={styles.brandLogo}>
            <img src={logoImage} alt='Muhristan Logo' className={styles.logoImage} />
            <span className={styles.brandTitle}>Muhristan</span>
          </Link>
          {!isAuthenticated && (
            <div className={styles.headerRightLink}>
              Zaten hesabınız var mı? <Link to='/giris'>Giriş Yap</Link>
            </div>
          )}
        </div>
      </header>

      <div className={styles.container}>
        {/* Left Column: 3 Stepper Checkout Cards */}
        <div className={styles.leftColumn}>

          {/* 1. STEP: ADRES */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleGroup}>
                <div className={editingStep === 1 ? styles.stepBadge : styles.stepBadgeCompleted}>
                  {editingStep === 1 ? '1' : <FiCheck />}
                </div>
                <h3 className={styles.stepTitle}>Adres</h3>
              </div>
              {editingStep !== 1 && (
                <button
                  type='button'
                  onClick={() => setEditingStep(1)}
                  className={styles.editBtn}
                >
                  Düzenle
                </button>
              )}
            </div>

            {editingStep === 1 ? (
              // EDITING STATE
              <div>
                {isAuthenticated ? (
                  loadingAddresses ? (
                    <p style={{ fontSize: 13, color: '#64748b' }}>Adresler yükleniyor...</p>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {addresses.map(addr => (
                          <div
                            key={addr.id}
                            onClick={() => setShippingAddressId(addr.id)}
                            style={{
                              padding: 12,
                              border: shippingAddressId === addr.id ? '2px solid #0f172a' : '1px solid #cbd5e1',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: shippingAddressId === addr.id ? 'rgba(15,23,42,0.03)' : '#fff'
                            }}
                          >
                            <strong style={{ display: 'block', fontSize: 13 }}>{addr.title}</strong>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>
                              {addr.fullName} — {addr.district}/{addr.city}
                            </p>
                          </div>
                        ))}
                      </div>
                      <button
                        type='button'
                        onClick={() => setEditingStep(null)}
                        className={styles.formActionBtn}
                      >
                        Bu Adresi Kullan
                      </button>
                    </div>
                  )
                ) : (
                  <div>
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                        <input
                          type='email'
                          placeholder='E-posta *'
                          required
                          value={guestShipping.email}
                          onChange={e => handleGuestShippingChange('email', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <input
                          type='text'
                          placeholder='Ad Soyad *'
                          required
                          value={guestShipping.fullName}
                          onChange={e => handleGuestShippingChange('fullName', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <input
                          type='tel'
                          placeholder='Telefon (5XX XXX XX XX) *'
                          required
                          value={guestShipping.phoneNumber}
                          onChange={e => handleGuestShippingChange('phoneNumber', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <LocationSelects
                          city={guestShipping.city}
                          district={guestShipping.district}
                          neighborhood={guestShipping.neighborhood}
                          onCityChange={val => handleGuestShippingChange('city', val)}
                          onDistrictChange={val => handleGuestShippingChange('district', val)}
                          onNeighborhoodChange={val => handleGuestShippingChange('neighborhood', val)}
                          fieldInputClass={styles.input}
                          showLabels={false}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <input
                          type='text'
                          placeholder='Posta Kodu *'
                          required
                          value={guestShipping.postalCode}
                          onChange={e => handleGuestShippingChange('postalCode', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                        <input
                          type='text'
                          placeholder='Açık Adres (Cadde, Mahalle, Sokak, No, Daire) *'
                          required
                          value={guestShipping.addressLine}
                          onChange={e => handleGuestShippingChange('addressLine', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        if (!guestShipping.fullName || !guestShipping.email || !guestShipping.phoneNumber) {
                          alert('Lütfen ad soyad, e-posta ve telefon alanlarını doldurunuz.')
                          return
                        }
                        setEditingStep(null)
                      }}
                      className={styles.formActionBtn}
                    >
                      Kargoya Devam Et
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // SUMMARY VIEW (AS IN SCREENSHOT)
              <div className={styles.summaryInfoBox}>
                <div className={styles.summaryEmail}>{currentEmailSummary}</div>
                <div className={styles.summaryName}>
                  {isAuthenticated ? (selectedAddr?.fullName || user?.fullName) : (guestShipping.fullName || 'Misafir Müşteri')}
                  <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                    +{isAuthenticated ? (selectedAddr?.phoneNumber || user?.phoneNumber || '90') : (guestShipping.phoneNumber ? `90${guestShipping.phoneNumber}` : '')}
                  </span>
                </div>
                <p className={styles.summaryAddress}>
                  {isAuthenticated
                    ? (selectedAddr ? `${selectedAddr.neighborhood ? selectedAddr.neighborhood + ' Mah. ' : ''}${selectedAddr.addressLine}, ${selectedAddr.district}, ${selectedAddr.city}, Türkiye` : 'Kayıtlı adres seçilmedi')
                    : (guestShipping.addressLine ? `${guestShipping.neighborhood ? guestShipping.neighborhood + ' Mah. ' : ''}${guestShipping.addressLine}, ${guestShipping.district}, ${guestShipping.city}, Türkiye` : 'Adres bilgisi henüz girilmedi')}
                </p>
              </div>
            )}
          </div>

          {/* 2. STEP: KARGO */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleGroup}>
                <div className={styles.stepBadgeCompleted}>
                  <FiCheck />
                </div>
                <h3 className={styles.stepTitle}>Kargo</h3>
              </div>
            </div>

            <div className={styles.summaryInfoBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>ÜCRETSİZ KARGO / Ücretsiz</span>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Hızlı Teslimat (1-3 İş Günü)</span>
              </div>
            </div>
          </div>

          {/* 3. STEP: ÖDEME */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleGroup}>
                <div className={styles.stepBadge}>3</div>
                <h3 className={styles.stepTitle}>Ödeme</h3>
              </div>
            </div>

            {/* Payment Method Radio Cards */}
            <div className={styles.paymentMethodsList}>
              {/* Havale / EFT */}
              <div
                className={`${styles.paymentRadioCard} ${styles.paymentRadioCardActive}`}
                onClick={() => setPaymentMethod(PAYMENT_METHODS.BANK_TRANSFER)}
              >
                <div className={styles.paymentRadioHeader}>
                  <div className={`${styles.customRadio} ${styles.customRadioChecked}`}>
                    <FiCheck />
                  </div>
                  <span className={styles.paymentMethodName}>Havale / EFT</span>
                </div>

                {/* Details Content */}
                <div className={styles.paymentDetailsContent}>
                  <div className={styles.bankDetailRow}>
                    <strong>{bankInfo.bankName}</strong>
                  </div>

                  <div className={styles.bankIbanBox}>
                    <span className={styles.ibanCode}>{bankInfo.iban}</span>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyIban()
                      }}
                      className={styles.copyBtn}
                    >
                      {copiedIban ? <><FiCheck color='#16a34a' /> Kopyalandı</> : <><FiCopy /> Kopyala</>}
                    </button>
                  </div>

                  <div className={styles.bankDetailRow}>
                    <strong>{bankInfo.accountHolder}</strong> (İsa Şahap Şahsi Şirketi)
                  </div>

                  <p className={styles.bankInstruction}>
                    Ödeme yaptıktan sonra <strong>{bankInfo.phone}</strong> Whatsapp hattımıza sipariş numaranızı ve dekontunuzu iletmeniz gerekmektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={sameAddress}
                  onChange={e => setSameAddress(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Fatura adresim teslimat adresimle aynı</span>
              </label>

              {!sameAddress && (
                <div style={{ marginTop: 12, padding: 16, border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px 0' }}>Fatura Adresi Bilgileri</h4>
                  <div className={styles.formGrid}>
                    <input
                      type='text'
                      placeholder='Fatura Ünvanı / Ad Soyad *'
                      value={guestBilling.fullName}
                      onChange={e => handleGuestBillingChange('fullName', e.target.value)}
                      className={styles.input}
                    />
                    <input
                      type='tel'
                      placeholder='Telefon *'
                      value={guestBilling.phoneNumber}
                      onChange={e => handleGuestBillingChange('phoneNumber', e.target.value)}
                      className={styles.input}
                    />
                    <input
                      type='text'
                      placeholder='Fatura Adresi *'
                      value={guestBilling.addressLine}
                      onChange={e => handleGuestBillingChange('addressLine', e.target.value)}
                      className={styles.input}
                      style={{ gridColumn: 'span 2' }}
                    />
                  </div>
                </div>
              )}

              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>
                  <span
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveModal('gizlilik')
                    }}
                    className={styles.contractLink}
                  >
                    Gizlilik Sözleşmesini
                  </span>{' '}
                  ve{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveModal('mesafeli')
                    }}
                    className={styles.contractLink}
                  >
                    Satış Sözleşmesini
                  </span>{' '}
                  okudum, onaylıyorum.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type='button'
              onClick={handleSubmitOrder}
              disabled={orderLoading || previewLoading}
              className={styles.completeOrderBtn}
            >
              {orderLoading && (
                <FiLoader
                  style={{
                    animation: 'spin 1.5s linear infinite',
                    fontSize: 18
                  }}
                />
              )}
              <span>Siparişi Tamamla</span>
            </button>

            {/* Security Badge */}
            <div className={styles.securityNote}>
              <FiLock /> <span>Ödemeler güvenli ve şifrelidir</span>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            {/* Products List with Floating Circular Count Badges */}
            <div className={styles.productsList}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.productRow}>
                  <div className={styles.imageBadgeWrapper}>
                    <img src={item.image} alt={item.name} className={styles.productImg} />
                    <span className={styles.countBadge}>{item.qty || 1}</span>
                  </div>

                  <div className={styles.productInfo}>
                    <p className={styles.productName}>{item.name}</p>
                    {item.customNote && (
                      <p className={styles.productCustomNote}>✨ {item.customNote}</p>
                    )}
                  </div>

                  <div className={styles.productPriceGroup}>
                    {item.originalPrice && item.originalPrice !== item.unitPrice && (
                      <span className={styles.oldPrice}>
                        {typeof item.originalPrice === 'number'
                          ? `₺ ${item.originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                          : item.originalPrice}
                      </span>
                    )}
                    <span className={styles.currentPrice}>
                      {typeof item.unitPrice === 'number'
                        ? `₺ ${(item.unitPrice * (item.qty || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                        : item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon / Discount Accordion */}
            <div className={styles.couponArea}>
              {!showCouponInput && !couponApplied ? (
                <button
                  type='button'
                  onClick={() => setShowCouponInput(true)}
                  className={styles.couponToggleLink}
                >
                  <span>+ İndirim kodu ekle</span>
                </button>
              ) : (
                <form onSubmit={handleApplyCoupon}>
                  <div className={styles.couponInputRow}>
                    <input
                      type='text'
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value)
                        if (couponError) setCouponError('')
                        if (couponSuccess) setCouponSuccess('')
                      }}
                      placeholder='İndirim kodu'
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
                  </div>
                  {couponSuccess && (
                    <p style={{ color: '#16a34a', fontSize: 12, margin: '6px 0 0 0' }}>{couponSuccess}</p>
                  )}
                  {couponError && (
                    <p style={{ color: '#dc2626', fontSize: 12, margin: '6px 0 0 0' }}>{couponError}</p>
                  )}
                </form>
              )}
            </div>

            {/* Price Calculations Breakdown */}
            <div className={styles.totalsList}>
              {(() => {
                const subtotal = previewData?.subtotal || cartItems.reduce((sum, it) => sum + (it.unitPrice || 0) * (it.qty || 1), 0);
                const couponDiscount = previewData?.couponDiscountAmount || 0;
                const productDiscount = previewData?.productDiscountAmount || 0;
                const grandTotal = previewData?.grandTotal || Math.max(0, subtotal - couponDiscount - productDiscount);
                
                // Backendden gelen veya hesaplanan dinamik kargo ücreti
                const calculatedShipping = (previewData?.shippingFee != null)
                  ? Number(previewData.shippingFee)
                  : (previewData?.shippingTotal != null)
                  ? Number(previewData.shippingTotal)
                  : (previewData?.shippingCost != null)
                  ? Number(previewData.shippingCost)
                  : (previewData ? Math.max(0, Math.round((grandTotal - subtotal + couponDiscount + productDiscount) * 100) / 100) : 0);

                return (
                  <>
                    <div className={styles.totalRow}>
                      <span>Ara Toplam ⓘ</span>
                      <span>₺ {subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className={styles.totalRow}>
                      <span>Teslimat / Kargo</span>
                      <span>
                        {calculatedShipping > 0 ? (
                          `₺ ${calculatedShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Ücretsiz</span>
                        )}
                      </span>
                    </div>

                    {productDiscount > 0 && (
                      <div className={styles.totalDiscountRow}>
                        <span>Ürün İndirimi</span>
                        <span>- ₺ {productDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {couponDiscount > 0 && (
                      <div className={styles.totalDiscountRow}>
                        <span>Kupon İndirimi</span>
                        <span>- ₺ {couponDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className={styles.grandTotalRow}>
                      <span className={styles.grandTotalLabel}>Toplam</span>
                      <span className={styles.grandTotalPrice}>
                        ₺ {grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className={styles.taxSubtext}>
                      (KDV Dahildir — %20 Vergi: ₺ {(grandTotal - (grandTotal / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
                    </div>
                  </>
                );
              })()}
            </div>

            <div className={styles.poweredBy}>
              powered by <strong>Muhristan</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Modals */}
      {activeModal && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {activeModal === 'gizlilik' ? 'Gizlilik Sözleşmesi' : 'Mesafeli Satış Sözleşmesi'}
              </h3>
              <button
                type='button'
                onClick={() => setActiveModal(null)}
                className={styles.modalCloseBtn}
              >
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {activeModal === 'gizlilik' ? (
                <div>
                  <h4>1. Gizlilik Politikası ve Veri Güvenliği</h4>
                  <p>
                    İşbu Gizlilik Politikası, Muhristan (İsa Şahap Şahsi Şirketi) tarafından işletilen platform üzerinden toplanan kişisel verilerin korunması ve işlenmesine ilişkin şartları içerir.
                  </p>
                  <p>
                    Müşteri bilgileri yalnızca sipariş teslimatı, faturalandırma ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir ve üçüncü taraflarla paylaşılmaz.
                  </p>
                </div>
              ) : (
                <div>
                  <h4>1. Mesafeli Satış Sözleşmesi Şartları</h4>
                  <p>
                    <strong>Satıcı:</strong> İsa Şahap (Muhristan)<br />
                    <strong>İletişim:</strong> 0542 790 68 63<br />
                    <strong>Adres:</strong> Türkiye
                  </p>
                  <p>
                    Alıcı, siparişi onayladığında sözleşme konusu ürünün temel niteliklerini, satış fiyatını, ödeme şeklini ve teslimata ilişkin tüm ön bilgileri okuyup bilgi sahibi olduğunu ve onayladığını kabul eder.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
