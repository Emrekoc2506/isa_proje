import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../pages/AuthPage/AuthPage';
import CheckoutPage from '../pages/CheckoutPage/CheckoutPage';
import CustomersSection from '../pages/AdminPage/sections/CustomersSection';
import OrdersSection from '../pages/AdminPage/sections/OrdersSection';
import AbuseBansSection from '../pages/AdminPage/sections/AbuseBansSection';
import AbuseBanModal from '../components/Admin/AbuseBanModal/AbuseBanModal';
import * as abuseApi from '../services/abuseApi';
import * as customerApi from '../services/customerApi';
import * as orderApi from '../services/orderApi';
import { formatTurkishPhone, normalizeTurkishPhone, isValidTurkishMobile } from '../utils/phoneUtils';
import { translateErrorCode, translateErrorMessage, ApiError } from '../api/apiError';
import { ThemeProvider } from '../context/ThemeContext';

// Mocks
const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockClearCart = vi.fn();
const mockRefreshCart = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@muhristan.com', fullName: 'Yönetici Test' },
    isAuthenticated: true,
    isSuperAdmin: true,
    roles: ['SuperAdmin'],
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout
  })
}));

vi.mock('../context/WishlistContext', () => ({
  useWishlist: () => ({
    mergeGuestWishlist: vi.fn()
  })
}));

vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    items: [{ id: 'p1', productId: 'p1', title: 'Test Ürün', qty: 1, unitPrice: 100 }],
    clearCart: mockClearCart,
    refreshCart: mockRefreshCart
  })
}));

vi.mock('../services/abuseApi', () => ({
  banCustomer: vi.fn(),
  banOrderSource: vi.fn(),
  getAbuseBans: vi.fn(),
  revokeAbuseBan: vi.fn()
}));

vi.mock('../services/customerApi', () => ({
  getAdminCustomers: vi.fn(),
  updateAdminCustomerStatus: vi.fn(),
  updateAdminCustomerRole: vi.fn()
}));

vi.mock('../services/orderApi', () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn(),
  createOrder: vi.fn(),
  createGuestOrder: vi.fn()
}));

vi.mock('../services/bankTransferApi', () => ({
  getBankTransferInfo: vi.fn().mockResolvedValue({ iban: 'TR00', bankName: 'Enpara' }),
  adminConfirmBankTransfer: vi.fn(),
  adminRejectBankTransfer: vi.fn()
}));

vi.mock('../services/accountApi', () => ({
  getAddresses: vi.fn().mockResolvedValue([
    { id: 'addr-1', title: 'Ev', fullName: 'Ali Veli', addressLine: 'Merkez Mah.', district: 'Kadikoy', city: 'Istanbul', isDefaultShipping: true }
  ])
}));

vi.mock('../services/checkoutApi', () => ({
  getOrderPreview: vi.fn().mockResolvedValue({ grandTotal: 100, items: [] })
}));

describe('Muhristan Anti-Abuse & Ban Frontend Integration Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Utility & Error Translation Tests
  // -------------------------------------------------------------------------
  describe('Phone Utilities & Error Translations', () => {
    it('formats Turkish phone numbers properly', () => {
      expect(formatTurkishPhone('05321234567')).toBe('532 123 45 67');
      expect(formatTurkishPhone('905321234567')).toBe('532 123 45 67');
      expect(formatTurkishPhone('5321234567')).toBe('532 123 45 67');
    });

    it('normalizes Turkish phone numbers correctly', () => {
      expect(normalizeTurkishPhone('0532 123 45 67')).toBe('5321234567');
      expect(normalizeTurkishPhone('0532 123 45 67', { withCountryCode: true })).toBe('+905321234567');
    });

    it('validates Turkish mobile numbers', () => {
      expect(isValidTurkishMobile('532 123 45 67')).toBe(true);
      expect(isValidTurkishMobile('05321234567')).toBe(true);
      expect(isValidTurkishMobile('02121234567')).toBe(false); // sabit hat (2 ile başlar)
      expect(isValidTurkishMobile('12345')).toBe(false);
    });

    it('translates abuse_blocked code and message correctly', () => {
      expect(translateErrorCode('abuse_blocked')).toBe(
        'Bu işlem gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.'
      );
      expect(translateErrorMessage('Server error: abuse_blocked')).toBe(
        'Bu işlem gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Senaryo A & B & C: Register & Auth Tests
  // -------------------------------------------------------------------------
  describe('A, B, C: AuthPage Registration & Abuse Handling', () => {
    const switchToRegister = async () => {
      render(
        <MemoryRouter>
          <AuthPage />
        </MemoryRouter>
      );
      const tabRegister = screen.getByRole('tab', { name: /Üye Ol/i });
      fireEvent.click(tabRegister);
      return await screen.findByLabelText(/Ad Soyad/i);
    };

    it('A: Register form telefon olmadan submit edilemez', async () => {
      await switchToRegister();

      fireEvent.change(screen.getByLabelText(/Ad Soyad/i), { target: { value: 'Ahmet Yilmaz' } });
      fireEvent.change(screen.getByLabelText(/^E-posta$/i), { target: { value: 'ahmet@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Şifre$/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/Şifre Tekrar/i), { target: { value: 'Password123!' } });

      const submitBtn = screen.getByRole('button', { name: /Üye Ol/i });
      fireEvent.click(submitBtn);

      expect(mockRegister).not.toHaveBeenCalled();
      expect(await screen.findByText('Telefon numarası zorunludur.')).toBeInTheDocument();
    });

    it('B: Register payload phoneNumber içerir', async () => {
      mockRegister.mockResolvedValueOnce({ userId: 'u-123' });
      await switchToRegister();

      fireEvent.change(screen.getByLabelText(/Ad Soyad/i), { target: { value: 'Ahmet Yilmaz' } });
      fireEvent.change(screen.getByLabelText(/^E-posta$/i), { target: { value: 'ahmet@example.com' } });
      fireEvent.change(screen.getByLabelText(/Telefon Numarası/i), { target: { value: '05321234567' } });
      fireEvent.change(screen.getByLabelText(/^Şifre$/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/Şifre Tekrar/i), { target: { value: 'Password123!' } });

      const submitBtn = screen.getByRole('button', { name: /Üye Ol/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
      });

      expect(mockRegister).toHaveBeenCalledWith({
        fullName: 'Ahmet Yilmaz',
        email: 'ahmet@example.com',
        password: 'Password123!',
        phoneNumber: '5321234567'
      });
    });

    it('C: abuse_blocked register hatası genel güvenli mesaj gösterir', async () => {
      mockRegister.mockRejectedValueOnce(
        new ApiError({
          message: 'IP blacklist detection',
          code: 'abuse_blocked',
          status: 403
        })
      );

      await switchToRegister();

      fireEvent.change(screen.getByLabelText(/Ad Soyad/i), { target: { value: 'Ahmet Yilmaz' } });
      fireEvent.change(screen.getByLabelText(/^E-posta$/i), { target: { value: 'ahmet@example.com' } });
      fireEvent.change(screen.getByLabelText(/Telefon Numarası/i), { target: { value: '05321234567' } });
      fireEvent.change(screen.getByLabelText(/^Şifre$/i), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByLabelText(/Şifre Tekrar/i), { target: { value: 'Password123!' } });

      const submitBtn = screen.getByRole('button', { name: /Üye Ol/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Bu işlem gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.')
        ).toBeInTheDocument();
      });

      // Detaylı güvenlik bilgisi (IP, ban türü) asla sızdırılmamalıdır
      expect(screen.queryByText(/IP blacklist/i)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Senaryo D: Checkout Abuse Blocked Handling
  // -------------------------------------------------------------------------
  describe('D: Checkout abuse_blocked Error Handling', () => {
    it('D: abuse_blocked sipariş hatasında sepet temizlenmez ve güvenli mesaj gösterilir', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      orderApi.createOrder.mockRejectedValueOnce(
        new ApiError({
          message: 'Device banned',
          code: 'abuse_blocked',
          status: 403
        })
      );

      render(
        <MemoryRouter>
          <CheckoutPage />
        </MemoryRouter>
      );

      // Adresin yüklenmesini ve 'Bu Adresi Kullan' butonunu bekle
      const useAddrBtn = await screen.findByRole('button', { name: /Bu Adresi Kullan/i });
      fireEvent.click(useAddrBtn);

      // Sayfa yüklenmesini ve 'Siparişi Tamamla' butonunu bekle
      const submitOrderBtn = await screen.findByRole('button', { name: /Siparişi Tamamla/i });
      fireEvent.click(submitOrderBtn);

      await waitFor(() => {
        expect(orderApi.createOrder).toHaveBeenCalledTimes(1);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Sipariş işlemi gerçekleştirilemiyor. Yardım için destek ekibiyle iletişime geçebilirsiniz.'
      );

      // KRİTİK GÜVENLİK/UX: Sepet silinmemelidir!
      expect(mockClearCart).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Senaryo E, F, G, H, I, K: AbuseBanModal & Integration Tests
  // -------------------------------------------------------------------------
  describe('E, F, G, H, I, K: AbuseBanModal Controls & Flows', () => {
    it('E: CustomersSection üzerinde "Engelle" butonuna basılınca modal açılır', async () => {
      customerApi.getAdminCustomers.mockResolvedValueOnce([
        {
          id: 'cust-10',
          fullName: 'Kötü Niyetli Müşteri',
          email: 'abuser@example.com',
          phoneNumber: '05559876543',
          role: 'Customer',
          isActive: true
        }
      ]);

      render(
        <ThemeProvider>
          <CustomersSection />
        </ThemeProvider>
      );

      const banBtn = await screen.findByRole('button', { name: /Kötü Niyetli Müşteri adlı kullanıcıyı engelle/i });
      fireEvent.click(banBtn);

      expect(await screen.findByRole('heading', { name: /Kullanıcıyı Engelle/i })).toBeInTheDocument();
      expect(screen.getAllByText('Kötü Niyetli Müşteri').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('abuser@example.com').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('05559876543').length).toBeGreaterThanOrEqual(2);
    });

    it('F: Reason boşken ban POST gönderilmez', async () => {
      const mockSubmit = vi.fn();
      render(
        <AbuseBanModal
          open={true}
          sourceType="customer"
          source={{ id: 'c1', fullName: 'Test User', email: 'test@mail.com' }}
          onClose={vi.fn()}
          onSubmit={mockSubmit}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Kullanıcıyı Engelle/i });
      fireEvent.click(submitBtn);

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(await screen.findByText('Lütfen bir engelleme sebebi belirtin.')).toBeInTheDocument();
    });

    it('G: Tüm scopes kapatıldığında POST gönderilmez', async () => {
      const mockSubmit = vi.fn();
      render(
        <AbuseBanModal
          open={true}
          sourceType="customer"
          source={{ id: 'c1', fullName: 'Test User', email: 'test@mail.com' }}
          onClose={vi.fn()}
          onSubmit={mockSubmit}
        />
      );

      // Sebep yaz
      fireEvent.change(screen.getByPlaceholderText(/Sipariş notlarında hakaret/i), {
        target: { value: 'Kural ihlali' }
      });

      // Bütün checkboxları kapat
      fireEvent.click(screen.getByLabelText(/Hesabı Engelle/i));
      fireEvent.click(screen.getByLabelText(/Telefon Numarasını Engelle/i));
      fireEvent.click(screen.getByLabelText(/Bilinen Cihazları Engelle/i));
      fireEvent.click(screen.getByLabelText(/IP Adresini Geçici Engelle/i));

      const submitBtn = screen.getByRole('button', { name: /Kullanıcıyı Engelle/i });
      fireEvent.click(submitBtn);

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(await screen.findByText('En az bir engelleme yöntemi seçmelisiniz.')).toBeInTheDocument();
    });

    it('H: Ban request doğru ve eksiksiz payload gönderir', async () => {
      const mockSubmit = vi.fn().mockResolvedValueOnce();
      render(
        <AbuseBanModal
          open={true}
          sourceType="customer"
          source={{ id: 'c1', fullName: 'Test User', email: 'test@mail.com' }}
          onClose={vi.fn()}
          onSubmit={mockSubmit}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Sipariş notlarında hakaret/i), {
        target: { value: 'Sipariş notlarında hakaret ve tehdit' }
      });

      // IP süresini 168 (7 gün) yap
      fireEvent.change(screen.getByLabelText(/IP Engel Süresi:/i), {
        target: { value: '168' }
      });

      const submitBtn = screen.getByRole('button', { name: /Kullanıcıyı Engelle/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        reason: 'Sipariş notlarında hakaret ve tehdit',
        banAccount: true,
        banPhone: true,
        banDevices: true,
        banIp: true,
        ipBanHours: 168
      });
    });

    it('I: Guest order ban modalında account seçeneği uygun şekilde disabled olur', async () => {
      render(
        <AbuseBanModal
          open={true}
          sourceType="order"
          allowAccountBan={false}
          source={{
            id: 'ord-guest-99',
            orderNumber: 'ISH-9999',
            customerName: 'Misafir Kullanici',
            customerEmail: 'guest@example.com',
            customerPhone: '05331112233',
            customerNote: 'Kufurlu not'
          }}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { name: /Sipariş Kaynağını Engelle/i })).toBeInTheDocument();
      expect(screen.getByText(/Bu sipariş misafir kullanıcıya ait olduğu için hesap engeli uygulanamaz./i)).toBeInTheDocument();

      const accountCheckbox = screen.getByLabelText(/Hesabı Engelle/i);
      expect(accountCheckbox).toBeDisabled();

      // Ancak diğer kapsamlar (telefon, cihaz, IP) seçilebilir olmalı
      expect(screen.getByLabelText(/Telefon Numarasını Engelle/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/Bilinen Cihazları Engelle/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/IP Adresini Geçici Engelle/i)).not.toBeDisabled();
    });

    it('K: Ban submit butonuna çift tıklama ikinci bir POST oluşturmaz', async () => {
      let resolvePromise;
      const slowPromise = new Promise((res) => {
        resolvePromise = res;
      });
      const mockSubmit = vi.fn().mockReturnValue(slowPromise);

      render(
        <AbuseBanModal
          open={true}
          sourceType="customer"
          source={{ id: 'c1', fullName: 'Test User', email: 'test@mail.com' }}
          onClose={vi.fn()}
          onSubmit={mockSubmit}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Sipariş notlarında hakaret/i), {
        target: { value: 'Mükerrer istek testi' }
      });

      const submitBtn = screen.getByRole('button', { name: /Kullanıcıyı Engelle/i });

      // Çift tıklama simülasyonu
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);

      expect(mockSubmit).toHaveBeenCalledTimes(1);

      // Asenkron işlemi tamamla
      resolvePromise();
    });
  });

  // -------------------------------------------------------------------------
  // Senaryo J & L: AbuseBansSection List & Revoke Tests
  // -------------------------------------------------------------------------
  describe('J & L: AbuseBansSection List & Revoke', () => {
    it('L: Ban listesi boş olduğunda düzgün empty-state gösterir', async () => {
      abuseApi.getAbuseBans.mockResolvedValueOnce({ items: [], totalPages: 1 });

      render(
        <ThemeProvider>
          <AbuseBansSection />
        </ThemeProvider>
      );

      expect(await screen.findByText('Kayıtlı güvenlik engeli bulunmamaktadır.')).toBeInTheDocument();
    });

    it('J: Ban revoke çağrısı onaylandıktan sonra doğru endpoint servisine gider', async () => {
      const banRecord = {
        id: 'ban-abc-123',
        type: 'Ip',
        userFullName: 'Kötü IP Kaynağı',
        reason: 'Saldırı girişimi',
        createdAt: '2026-09-01T10:00:00Z',
        expiresAt: '2026-09-08T10:00:00Z',
        isRevoked: false
      };

      abuseApi.getAbuseBans.mockResolvedValue({
        items: [banRecord],
        totalPages: 1
      });
      abuseApi.revokeAbuseBan.mockResolvedValueOnce({ success: true });

      render(
        <ThemeProvider>
          <AbuseBansSection />
        </ThemeProvider>
      );

      const revokeBtn = await screen.findByRole('button', { name: /Engeli Kaldır/i });
      fireEvent.click(revokeBtn);

      // Onay modalı açılır
      expect(await screen.findByText(/Bu güvenlik engelini \(IP Adresi\) kaldırmak istediğinize emin misiniz\?/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Evet, Engeli Kaldır/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(abuseApi.revokeAbuseBan).toHaveBeenCalledTimes(1);
      });

      expect(abuseApi.revokeAbuseBan).toHaveBeenCalledWith('ban-abc-123');
    });
  });
});
