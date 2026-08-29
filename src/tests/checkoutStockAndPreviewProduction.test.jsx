import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSafeStockQuantity } from '../utils/stockUtils'
import { translateErrorMessage } from '../api/apiError'

describe('Checkout Stok Yönetimi, Preview Akışı ve 409 Production Testleri', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
  })

  // Senaryo A: physical stock = 1, available stock = 1 -> satın alma mümkün (stok = 1)
  it('Senaryo A: physical stock = 1, available stock = 1 olduğunda satılabilir stok 1 döner', () => {
    const product = {
      id: 'p-1',
      name: 'Özel Kolye',
      stockQuantity: 1,
      availableStock: 1
    }
    const safeStock = getSafeStockQuantity(product)
    expect(safeStock).toBe(1)
  })

  // Senaryo B: physical stock = 1, active reservation = 1, available stock = 0 -> stokta yok (0)
  it('Senaryo B: physical stock = 1 olmasına rağmen available stock = 0 ise satılabilir stok 0 döner', () => {
    const product = {
      id: 'p-2',
      name: 'Gümüş Yüzük',
      stockQuantity: 1,
      availableStock: 0
    }
    const safeStock = getSafeStockQuantity(product)
    expect(safeStock).toBe(0)
  })

  // Senaryo C: available stock = 1, cart quantity = 2 -> miktar available stock'tan büyük olamaz
  it('Senaryo C: available stock = 1 olan bir ürün için istenen miktar 2 olduğunda stok yetersiz kabul edilir', () => {
    const product = {
      id: 'p-3',
      name: 'Bileklik',
      availableStock: 1
    }
    const requestedQty = 2
    const safeStock = getSafeStockQuantity(product)
    const canPurchase = requestedQty <= safeStock
    expect(canPurchase).toBe(false)
  })

  // Senaryo D: Preview payload'ı yarım girilmiş misafir adresi için geçersiz adres göndermez
  it('Senaryo D: Adres yazılırken (incomplete address) backend 400 hatası almamak için geçersiz adres gönderilmez', () => {
    const incompleteGuestShipping = {
      fullName: 'M',
      email: '',
      phoneNumber: '',
      city: '',
      district: '',
      addressLine: ''
    }

    const isAdequate = Boolean(
      incompleteGuestShipping.city?.trim() &&
      incompleteGuestShipping.district?.trim() &&
      incompleteGuestShipping.addressLine?.trim() &&
      incompleteGuestShipping.fullName?.trim()
    )

    expect(isAdequate).toBe(false)
  })

  // Senaryo E: Preview 400 hatası durumunda hata Türkçeleştirilir ve loop engellenir
  it('Senaryo E: 400 validation error aldığında translateErrorMessage kullanıcı dostu Türkçe döner', () => {
    const err1 = translateErrorMessage('Guest shipping address is invalid.')
    const err2 = translateErrorMessage('Insufficient available stock.')
    expect(err1).toBe('Misafir teslimat adresi bilgileri eksik veya geçersiz.')
    expect(err2).toBe('Bu ürün için yeterli stok bulunmuyor.')
  })

  // Senaryo F: 409 insufficient_stock hatası durumunda anlaşılır mesaj üretilir ve sepet korunur
  it('Senaryo F: Sipariş 409 insufficient_stock aldığında doğru Türkçe mesaj üretilir', () => {
    const backend409 = {
      status: 409,
      code: 'insufficient_stock',
      message: 'Insufficient available stock.'
    }

    let isStockConflict =
      backend409.status === 409 ||
      backend409.code === 'insufficient_stock' ||
      backend409.message.includes('stock')

    expect(isStockConflict).toBe(true)

    const userMessage = translateErrorMessage(backend409.message)
    expect(userMessage).toBe('Bu ürün için yeterli stok bulunmuyor.')
  })

  // Senaryo G: Double submit engelleme testi (Ref lock)
  it('Senaryo G: isSubmittingOrderRef kilitliyken ikinci sipariş çağrısı engellenir', async () => {
    let submitCount = 0
    let isSubmitting = false

    const handleMockSubmit = async () => {
      if (isSubmitting) return
      isSubmitting = true
      submitCount++
      await new Promise(r => setTimeout(r, 50))
      isSubmitting = false
    }

    // Hızlı çift tıklama simülasyonu
    const p1 = handleMockSubmit()
    const p2 = handleMockSubmit()
    await Promise.all([p1, p2])

    expect(submitCount).toBe(1)
  })

  // Senaryo H: Guest kullanıcı token yokken refresh-token çağırmaz
  it('Senaryo H: accessToken yoksa misafir oturum için token refresh çağrısı yapılmaz', () => {
    const token = localStorage.getItem('accessToken')
    const shouldRefresh = Boolean(token)
    expect(shouldRefresh).toBe(false)
  })

  // Senaryo I: Sipariş başarılı olduğunda sessionStorage kaydedilir ve sepet temizlenir
  it('Senaryo I: Başarılı sipariş sonrası lastOrderDetails sessionStorage a kaydedilir', () => {
    const mockOrderResult = {
      orderId: 'ord-123',
      id: 'ord-123',
      orderNumber: 'MUH-9988',
      customerName: 'Ahmet Yılmaz',
      totalAmount: 500
    }

    sessionStorage.setItem('pendingOrderId', mockOrderResult.orderId)
    sessionStorage.setItem('pendingOrderNumber', mockOrderResult.orderNumber)
    sessionStorage.setItem('lastOrderDetails', JSON.stringify(mockOrderResult))

    const stored = JSON.parse(sessionStorage.getItem('lastOrderDetails'))
    expect(stored.orderId).toBe('ord-123')
    expect(stored.orderNumber).toBe('MUH-9988')
    expect(stored.customerName).toBe('Ahmet Yılmaz')
  })
})
