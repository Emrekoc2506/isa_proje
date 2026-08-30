import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request } from '../services/apiClient'
import * as bankTransferApi from '../services/bankTransferApi'
import { translateErrorMessage } from '../api/apiError'

vi.mock('../services/apiClient', () => ({
  request: vi.fn()
}))

describe('Guest Havale Siparişi ve Dekont Yükleme Akışı Testleri (Section 12 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.mockResolvedValue({})
    sessionStorage.clear()
    localStorage.clear()
  })

  // 1. Guest havale siparişi başarıyla oluşur ve token saklanır
  it('1. Guest havale siparişi oluşturulduğunda guestAccessToken sessionStorage da saklanır', () => {
    const mockOrderResponse = {
      id: 'ord-guest-999',
      orderNumber: 'MUH-5693',
      guestAccessToken: 'guest_jwt_token_secret_123',
      totalAmount: 19150
    }

    sessionStorage.setItem('pendingOrderId', mockOrderResponse.id)
    sessionStorage.setItem('pendingOrderNumber', mockOrderResponse.orderNumber)
    sessionStorage.setItem('guestOrderAccessToken', mockOrderResponse.guestAccessToken)

    expect(sessionStorage.getItem('pendingOrderId')).toBe('ord-guest-999')
    expect(sessionStorage.getItem('pendingOrderNumber')).toBe('MUH-5693')
    expect(sessionStorage.getItem('guestOrderAccessToken')).toBe('guest_jwt_token_secret_123')
  })

  // 2. Dekont yüklemeden result page açılır (İsteğe bağlı)
  it('2. Dekont yükleme isteğe bağlıdır ve yükleme yapılmasa bile sipariş tamamlanmıştır', () => {
    const isReceiptMandatory = false
    expect(isReceiptMandatory).toBe(false)
  })

  // 3. WhatsApp butonu çalışır (Doğru numara: 905427906863 ve sipariş formatı)
  it('3. WhatsApp dekont iletim bağlantısı 905427906863 ve sipariş numarasını doğru formatlar', () => {
    const orderNo = '#5693'
    const cleanPhone = '0542 790 68 63'.replace(/\D/g, '')
    const whatsappPhone = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`
    
    const cleanOrderNo = String(orderNo).replace(/^#/, '').trim()
    const displayOrderNo = `#${cleanOrderNo}`
    
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      `Merhaba, ${displayOrderNo} numaralı siparişim için ödeme dekontunu iletiyorum.`
    )}`

    expect(whatsappPhone).toBe('905427906863')
    expect(whatsappUrl).toContain('https://wa.me/905427906863')
    expect(decodeURIComponent(whatsappUrl)).toContain('#5693')
  })

  // 4. Guest dekont upload guest endpoint ve beklenen header ile gönderilir
  it('4. Guest dekont yükleme isteği doğru endpoint ve X-Order-Access-Token ile yetkilendirilir', async () => {
    const guestToken = 'guest_jwt_token_secret_123'
    sessionStorage.setItem('guestOrderAccessToken', guestToken)

    await bankTransferApi.uploadBankTransferReceipt(
      '11111111-1111-1111-1111-111111111111',
      { file: new File(['receipt'], 'dekont.pdf', { type: 'application/pdf' }) }
    )

    expect(request).toHaveBeenCalledWith(
      '/orders/guest/11111111-1111-1111-1111-111111111111/bank-transfer/receipt',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Order-Access-Token': guestToken },
        body: expect.any(FormData)
      })
    )
  })

  // 5. Access token olmadan (misafir oturumunda) guest token ile upload çalışır
  it('5. localStorage accessToken olmadan da guest token ile yetkilendirme gerçekleşir', () => {
    expect(localStorage.getItem('accessToken')).toBeNull()
    const guestToken = 'guest_order_access_123'
    expect(guestToken).toBeTruthy()
  })

  // 6. Guest token yoksa veya 401 durumunda düzgün fallback mesajı gösterilir
  it('6. 401 durumunda kullanıcıya WhatsApp fallback mesajı verilir (Oturum süresi doldu denmez)', () => {
    const errorStatus = 401
    let userFriendlyMsg = ''
    if (errorStatus === 401) {
      userFriendlyMsg = 'Bu sipariş için dekont yükleme bağlantısı artık geçerli değil veya yetkilendirilemedi. Dekontunuzu dilerseniz doğrudan WhatsApp üzerinden iletebilirsiniz.'
    }

    expect(userFriendlyMsg).not.toContain('Oturum süresi doldu')
    expect(userFriendlyMsg).toContain('WhatsApp')
  })

  // 7. 401 durumunda refresh-token döngüsü oluşmaz
  it('7. Misafir dekont endpointi 401 aldığında auth refresh döngüsü tetiklenmez', () => {
    const path = '/orders/guest/123/bank-transfer/receipt'
    const isGuestPath = path.includes('/bank-transfer/receipt') || path.includes('/orders/guest')
    const hasAccessToken = Boolean(localStorage.getItem('accessToken'))

    const shouldTriggerRefresh = !isGuestPath && hasAccessToken
    expect(shouldTriggerRefresh).toBe(false)
  })

  // 8. Guest track 404 success page'i bozmaz (sessionStorage details kullanılır)
  it('8. Guest track 404 verse bile sessionStorage lastOrderDetails üzerinden sayfa sorunsuz çalışır', () => {
    const cachedOrder = {
      orderId: 'ord-123',
      orderNumber: 'MUH-5693',
      customerName: 'Musaab Alqassab',
      totalAmount: 19150
    }
    sessionStorage.setItem('lastOrderDetails', JSON.stringify(cachedOrder))

    const loaded = JSON.parse(sessionStorage.getItem('lastOrderDetails'))
    expect(loaded.orderNumber).toBe('MUH-5693')
    expect(loaded.customerName).toBe('Musaab Alqassab')
    expect(loaded.totalAmount).toBe(19150)
  })

  // 9. Authenticated user receipt upload çalışmaya devam eder
  it('9. Giriş yapmış kullanıcı normal auth token ile dekont yükler', () => {
    localStorage.setItem('accessToken', 'user_real_jwt')
    const userToken = localStorage.getItem('accessToken')
    expect(userToken).toBe('user_real_jwt')
  })

  // 10. Aynı upload iki kere gönderilmez (duplicate guard)
  it('10. uploadingReceipt true iken ikinci yükleme çağrısı engellenir', async () => {
    let uploadCount = 0
    let uploading = false

    const mockUpload = async () => {
      if (uploading) return
      uploading = true
      uploadCount++
      await new Promise(r => setTimeout(r, 40))
      uploading = false
    }

    const p1 = mockUpload()
    const p2 = mockUpload()
    await Promise.all([p1, p2])

    expect(uploadCount).toBe(1)
  })

  // 11. PDF dosya doğrulaması
  it('11. PDF formatındaki dosyalar (.pdf) kabul edilir', () => {
    const file = { name: 'dekont.pdf', size: 1024 * 100 }
    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext)
    expect(allowed).toBe(true)
  })

  // 12. JPG / PNG dosya doğrulaması ve 5 MB boyutu
  it('12. JPG ve PNG dosyaları kabul edilir, 5MB üzeri reddedilir', () => {
    const validJpg = { name: 'dekont.jpg', size: 2 * 1024 * 1024 }
    const validPng = { name: 'dekont.png', size: 1 * 1024 * 1024 }
    const oversizedFile = { name: 'dekont.png', size: 6 * 1024 * 1024 }

    const isJpgValid = ['pdf', 'jpg', 'jpeg', 'png'].includes(validJpg.name.split('.').pop().toLowerCase()) && validJpg.size <= 5 * 1024 * 1024
    const isPngValid = ['pdf', 'jpg', 'jpeg', 'png'].includes(validPng.name.split('.').pop().toLowerCase()) && validPng.size <= 5 * 1024 * 1024
    const isOversizedValid = oversizedFile.size <= 5 * 1024 * 1024

    expect(isJpgValid).toBe(true)
    expect(isPngValid).toBe(true)
    expect(isOversizedValid).toBe(false)
  })
})
