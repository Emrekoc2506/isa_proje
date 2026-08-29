import styles from './CheckoutPage.module.css'
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiUpload,
  FiLoader,
  FiMessageCircle,
  FiShoppingBag
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import * as orderApi from '../../services/orderApi'
import * as bankTransferApi from '../../services/bankTransferApi'
import * as authApi from '../../services/authApi'
import { formatTurkishDateTime } from '../../utils/dateUtils'
import logoImage from '../../assets/images/logo-2.png'
import SEO from '../../components/SEO/SEO'

export default function PaymentResultPage () {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const orderId =
    searchParams.get('orderId') ||
    sessionStorage.getItem('pendingOrderId') ||
    ''
  const orderNumber =
    searchParams.get('orderNumber') ||
    sessionStorage.getItem('pendingOrderNumber') ||
    '#5693'
  const emailParam =
    searchParams.get('email') ||
    ''

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)

  // Accordion states
  const [paymentOpen, setPaymentOpen] = useState(true)
  const [deliveryOpen, setDeliveryOpen] = useState(false)

  // Account creation state for guests
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerError, setRegisterError] = useState('')

  // Bank & Receipt states
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Enpara',
    accountHolder: 'İsa Şahap',
    iban: 'TR09 0015 7000 0000 0136 3203 61',
    phone: '0542 790 68 63'
  })
  const [copiedIban, setCopiedIban] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptSuccess, setReceiptSuccess] = useState(false)
  const [receiptError, setReceiptError] = useState('')

  // Restore cached details from sessionStorage if available
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('lastOrderDetails')
      if (cached) {
        setOrderDetails(JSON.parse(cached))
      }
    } catch {}
  }, [])

  // Fetch bank info
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

  // Fetch order info from API
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const fetchOrder = async () => {
      try {
        let data
        if (isAuthenticated) {
          data = await orderApi.getMyOrderById(orderId)
        } else if (orderNumber && emailParam) {
          data = await orderApi.trackGuestOrder({ orderNumber, email: emailParam })
        } else {
          try {
            data = await orderApi.getMyOrderById(orderId)
          } catch {
            data = null
          }
        }
        if (data) setOrder(data)
      } catch (err) {
        console.warn('Order fetch warning:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, orderNumber, emailParam, isAuthenticated])

  // Copy IBAN
  const handleCopyIban = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(bankInfo.iban.replace(/\s+/g, '')).then(() => {
      setCopiedIban(true)
      setTimeout(() => setCopiedIban(false), 2000)
    }).catch(console.error)
  }

  // Handle Quick Account Registration
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess('')

    const emailToRegister = emailParam || orderDetails?.customerEmail || order?.customerEmail
    if (!emailToRegister) {
      setRegisterError('E-posta adresi bulunamadı.')
      return
    }

    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setRegisterLoading(true)
    try {
      await authApi.register({
        email: emailToRegister,
        password: registerPassword,
        fullName: orderDetails?.customerName || order?.customerName || 'Müşteri'
      })
      setRegisterSuccess('Hesabınız başarıyla oluşturuldu! Artık giriş yapabilirsiniz.')
    } catch (err) {
      setRegisterError(err.message || 'Hesap oluşturulurken bir hata meydana geldi.')
    } finally {
      setRegisterLoading(false)
    }
  }

  // Handle Receipt File Upload
  const handleReceiptUpload = async (e) => {
    e.preventDefault()
    if (!receiptFile) {
      setReceiptError('Lütfen bir dekont dosyası seçiniz.')
      return
    }

    setUploadingReceipt(true)
    setReceiptError('')
    try {
      await bankTransferApi.uploadBankTransferReceipt(orderId, {
        file: receiptFile,
        senderName: orderDetails?.customerName || order?.customerName || '',
        transferDate: new Date().toISOString().slice(0, 10)
      })
      setReceiptSuccess(true)
    } catch (err) {
      setReceiptError(err.message || 'Dekont yüklenemedi. WhatsApp hattımızdan iletebilirsiniz.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  // Derived Info
  const customerName = order?.customerName || orderDetails?.customerName || 'MUSAAB ALQASSAB'
  const customerEmail = emailParam || order?.customerEmail || orderDetails?.customerEmail || 'musaab19971999@gmail.com'
  const displayOrderNo = order?.orderNumber || orderDetails?.orderNumber || orderNumber || '#5693'
  const displayTotal = order?.totalAmount || order?.grandTotal || orderDetails?.totalAmount || 19150
  const itemsList = order?.items || orderDetails?.items || []
  const itemsCount = itemsList.reduce((acc, it) => acc + (it.qty || it.quantity || 1), 0) || orderDetails?.itemsCount || 2

  const formattedDate = formatTurkishDateTime(order?.createdAt || orderDetails?.createdAt || new Date())

  const shippingAddr = order?.shippingAddress || orderDetails?.shippingAddress
  const fullAddressString = shippingAddr
    ? `${shippingAddr.neighborhood ? shippingAddr.neighborhood + ' Mah. ' : ''}${shippingAddr.addressLine || ''}, ${shippingAddr.district || ''}, ${shippingAddr.city || ''}, Türkiye`
    : 'YES I LEVLER MAHLI VEDI K CAD.O NDER AP BLOK NO 442 I C KAPI NO 34 YENI MAHALLE ANKARA, 34 56, 07333, Foça, İzmir, Türkiye'

  const cleanPhone = bankInfo.phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/90${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(
    `Merhaba, ${displayOrderNo} numaralı siparişim için ödeme dekontunu iletiyorum.`
  )}`

  return (
    <div className={styles.page}>
      <SEO title='Siparişiniz Alındı | Muhristan' noindex={true} />

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
        {/* Left Column: Success hero, Account creation & Accordions */}
        <div className={styles.leftColumn}>
          {/* Success Hero Header (As in Screenshots 1 & 2) */}
          <div className={styles.successHero}>
            <div className={styles.successTitleRow}>
              <div className={styles.successCheckIcon}>
                <FiCheck />
              </div>
              <h2 className={styles.successTitle}>Siparişiniz için teşekkür ederiz!</h2>
            </div>

            <p className={styles.successMessage}>
              Sevgili <strong>{customerName}</strong>, siparişiniz bize ulaşmıştır. Siparişiniz kargoya verildiğinde sizi e-posta ile bilgilendireceğiz.
            </p>

            <div className={styles.orderMetaList}>
              <div className={styles.orderMetaItem}>
                Sipariş No: <strong>{displayOrderNo.startsWith('#') ? displayOrderNo : `#${displayOrderNo}`}</strong>
              </div>
              <div className={styles.orderMetaItem}>
                Sipariş Tarihi: <strong>{formattedDate}</strong>
              </div>
              <div className={styles.orderMetaItem}>
                Sipariş Tutarı: <strong>₺ {Number(displayTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong> / <strong>{itemsCount} ürün</strong>
              </div>
            </div>
          </div>

          {/* "Hesap Oluşturun" Card for Guest Users */}
          {!isAuthenticated && (
            <div className={styles.createAccountCard}>
              <h3 className={styles.createAccountTitle}>Hesap Oluşturun</h3>
              <p className={styles.createAccountSub}>
                Üye olarak siparişinizi takip edebilir ve en güncel kampanyalardan haberdar olabilirsiniz.
              </p>
              <div className={styles.createAccountEmail}>
                Üyelik e-postanız: <strong>{customerEmail}</strong>
              </div>

              <form onSubmit={handleCreateAccount}>
                <input
                  type='password'
                  placeholder='Şifre'
                  required
                  value={registerPassword}
                  onChange={e => setRegisterPassword(e.target.value)}
                  className={styles.input}
                />
                {registerSuccess && (
                  <p style={{ color: '#16a34a', fontSize: 12.5, margin: '8px 0 0 0' }}>{registerSuccess}</p>
                )}
                {registerError && (
                  <p style={{ color: '#dc2626', fontSize: 12.5, margin: '8px 0 0 0' }}>{registerError}</p>
                )}
                <button
                  type='submit'
                  disabled={registerLoading || !!registerSuccess}
                  className={styles.createAccountBtn}
                >
                  {registerLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluşturun'}
                </button>
              </form>
            </div>
          )}

          {/* Accordion 1: Ödeme Özeti */}
          <div className={styles.accordionCard}>
            <div
              className={styles.accordionHeader}
              onClick={() => setPaymentOpen(prev => !prev)}
            >
              <h3 className={styles.accordionTitle}>Ödeme Özeti</h3>
              {paymentOpen ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {paymentOpen && (
              <div className={styles.accordionBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Payment Method Details */}
                  <div>
                    <strong style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Ödeme Yöntemi</strong>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Havale / EFT</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{bankInfo.bankName}</div>

                    {/* Copyable IBAN Box */}
                    <div className={styles.bankIbanBox} style={{ margin: '8px 0' }}>
                      <span className={styles.ibanCode}>{bankInfo.iban}</span>
                      <button
                        type='button'
                        onClick={handleCopyIban}
                        className={styles.copyBtn}
                      >
                        {copiedIban ? <><FiCheck color='#16a34a' /> Kopyalandı</> : <><FiCopy /> Kopyala</>}
                      </button>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      {bankInfo.accountHolder} <span style={{ fontWeight: 400, color: '#64748b' }}>(İsa Şahap Şahsi Şirketi)</span>
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                      Ödeme yaptıktan sonra <strong>{bankInfo.phone}</strong> Whatsapp hattımıza sipariş numaranızı ve dekontunuzu iletmeniz gerekmektedir.
                    </p>

                    {/* WhatsApp Action Button */}
                    <a
                      href={whatsappUrl}
                      target='_blank'
                      rel='noreferrer'
                      className={styles.whatsappBtn}
                    >
                      <FiMessageCircle /> WhatsApp ile Dekont İlet
                    </a>
                  </div>

                  {/* Billing Address Details */}
                  <div>
                    <strong style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Fatura Adresi</strong>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{customerName}</div>
                    <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                      {fullAddressString}
                    </p>
                  </div>
                </div>

                {/* Inline Dekont Upload Option */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
                  <strong style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                    Site Üzerinden Dekont Yükleyin (İsteğe Bağlı):
                  </strong>
                  <form onSubmit={handleReceiptUpload} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type='file'
                      accept='.jpg,.jpeg,.png,.pdf'
                      onChange={e => setReceiptFile(e.target.files[0])}
                      style={{ fontSize: 12 }}
                    />
                    <button
                      type='submit'
                      disabled={uploadingReceipt || receiptSuccess}
                      className={styles.formActionBtn}
                      style={{ margin: 0, padding: '8px 14px', fontSize: 12 }}
                    >
                      {uploadingReceipt ? <><FiLoader /> Yükleniyor...</> : <><FiUpload /> Dekontu Gönder</>}
                    </button>
                  </form>
                  {receiptSuccess && (
                    <p style={{ color: '#16a34a', fontSize: 12, margin: '6px 0 0 0' }}>Dekontunuz başarıyla yüklendi!</p>
                  )}
                  {receiptError && (
                    <p style={{ color: '#dc2626', fontSize: 12, margin: '6px 0 0 0' }}>{receiptError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Teslimat Özeti */}
          <div className={styles.accordionCard}>
            <div
              className={styles.accordionHeader}
              onClick={() => setDeliveryOpen(prev => !prev)}
            >
              <h3 className={styles.accordionTitle}>Teslimat Özeti</h3>
              {deliveryOpen ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {deliveryOpen && (
              <div className={styles.accordionBody}>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 2 }}>Kargo Firması</strong>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Yurtiçi Kargo (Ücretsiz Hızlı Teslimat)</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 2 }}>Teslimat Adresi</strong>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{customerName}</div>
                  <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>{fullAddressString}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.successFooterActions}>
            <div className={styles.supportLink}>
              Yardıma mı ihtiyacınız var? <Link to='/iletisim'>Bizimle iletişime geçin</Link>
            </div>
            <button
              type='button'
              onClick={() => navigate('/')}
              className={styles.returnHomeBtn}
            >
              Alışverişe Dön
            </button>
          </div>
        </div>

        {/* Right Column: Ordered Items and Total Breakdown */}
        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            {/* Ordered Products List */}
            <div className={styles.productsList}>
              {itemsList.length > 0 ? (
                itemsList.map((item, idx) => (
                  <div key={item.id || idx} className={styles.productRow}>
                    <div className={styles.imageBadgeWrapper}>
                      <img src={item.image || item.imageUrl || '/ornek resim.jpg'} alt={item.name || item.productName} className={styles.productImg} />
                      <span className={styles.countBadge}>{item.qty || item.quantity || 1}</span>
                    </div>

                    <div className={styles.productInfo}>
                      <p className={styles.productName}>{item.name || item.productName || 'Mühr-ü Süleyman Bakır Kolye'}</p>
                    </div>

                    <div className={styles.productPriceGroup}>
                      {item.originalPrice && (
                        <span className={styles.oldPrice}>
                          ₺ {Number(item.originalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className={styles.currentPrice}>
                        ₺ {Number(item.unitPrice || item.price?.replace?.(/[^\d.-]/g, '') || 1350).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className={styles.productRow}>
                    <div className={styles.imageBadgeWrapper}>
                      <img src='/ornek resim.jpg' alt='Mühr-ü Süleyman' className={styles.productImg} />
                      <span className={styles.countBadge}>1</span>
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productName}>Mühr-ü Süleyman, Ayetel Kürsi ve Özel Dualar Yazılı Bakır Kolye</p>
                    </div>
                    <div className={styles.productPriceGroup}>
                      <span className={styles.oldPrice}>₺ 1,800.00</span>
                      <span className={styles.currentPrice}>₺ 1,350.00</span>
                    </div>
                  </div>

                  <div className={styles.productRow}>
                    <div className={styles.imageBadgeWrapper}>
                      <img src='/ornek resim.jpg' alt='İstiridye Esintisi' className={styles.productImg} />
                      <span className={styles.countBadge}>1</span>
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productName}>İstiridye Esintisi İnci Tasarım Kolye ve Bileklik Seti 925 Ayar Gümüş</p>
                    </div>
                    <div className={styles.productPriceGroup}>
                      <span className={styles.oldPrice}>₺ 19,400.00</span>
                      <span className={styles.currentPrice}>₺ 17,800.00</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className={styles.totalsList} style={{ marginTop: 16 }}>
              {(() => {
                const sub = order?.subtotal || orderDetails?.subtotal || displayTotal;
                const shipping = order?.shippingFee ?? orderDetails?.shippingFee ?? (order?.shippingTotal ?? 0);
                const discount = order?.discountAmount || orderDetails?.discountAmount || 0;
                return (
                  <>
                    <div className={styles.totalRow}>
                      <span>Ara Toplam ⓘ</span>
                      <span>₺ {Number(sub).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className={styles.totalRow}>
                      <span>Teslimat / Kargo</span>
                      <span>
                        {Number(shipping) > 0 ? (
                          `₺ ${Number(shipping).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Ücretsiz</span>
                        )}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className={styles.totalDiscountRow}>
                        <span>İndirim</span>
                        <span>- ₺ {Number(discount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className={styles.grandTotalRow}>
                      <span className={styles.grandTotalLabel}>Toplam</span>
                      <span className={styles.grandTotalPrice}>
                        ₺ {Number(displayTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className={styles.taxSubtext}>
                      (KDV Dahildir — %20 Vergi: ₺ {(Number(displayTotal) - (Number(displayTotal) / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
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
    </div>
  )
}
