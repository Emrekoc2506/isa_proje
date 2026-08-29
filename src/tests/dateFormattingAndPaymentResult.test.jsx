import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { formatTurkishDate, formatTurkishDateTime, formatShortTurkishDate } from '../utils/dateUtils';
import { translateErrorMessage, translateErrorCode } from '../api/apiError';
import PaymentResultPage from '../pages/CheckoutPage/PaymentResultPage';
import { AuthProvider } from '../context/AuthContext';

describe('Tarih Formatlama, Çeviri ve PaymentResultPage Testleri', () => {
  describe('formatTurkishDate', () => {
    it('Ocak tarihini düzgün formatlar', () => {
      const formatted = formatTurkishDate('2026-01-15T12:00:00Z');
      expect(formatted).toContain('Ocak');
      expect(formatted).toContain('2026');
    });

    it('Ağustos tarihini düzgün formatlar', () => {
      const formatted = formatTurkishDate('2026-08-29T14:30:00Z');
      expect(formatted).toContain('Ağustos');
      expect(formatted).toContain('2026');
    });

    it('Aralık tarihini düzgün formatlar', () => {
      const formatted = formatTurkishDate('2026-12-15T12:00:00Z');
      expect(formatted).toContain('Aralık');
      expect(formatted).toContain('2026');
    });

    it('ISO ve UTC tarih dizelerini kabul eder', () => {
      expect(formatTurkishDate('2026-04-23T09:00:00.000Z')).toContain('Nisan');
      expect(formatTurkishDate(new Date('2026-05-19'))).toContain('Mayıs');
      expect(formatTurkishDate(1777000000000)).not.toBe('-');
    });

    it('null, undefined ve geçersiz girdilerde asla çökmez ve tire döner', () => {
      expect(formatTurkishDate(null)).toBe('-');
      expect(formatTurkishDate(undefined)).toBe('-');
      expect(formatTurkishDate('')).toBe('-');
      expect(formatTurkishDate('gecersiz-tarih')).toBe('-');
      expect(formatTurkishDate(NaN)).toBe('-');
    });
  });

  describe('formatTurkishDateTime', () => {
    it('Tarih ve saat bilgisini birlikte hatasız üretir', () => {
      const result = formatTurkishDateTime('2026-08-29T10:15:00Z');
      expect(result).toContain('Ağustos');
      expect(result).toContain('2026');
      expect(result).not.toBe('-');
    });

    it('Geçersiz girdilerde çökmez', () => {
      expect(formatTurkishDateTime(null)).toBe('-');
      expect(formatTurkishDateTime(undefined)).toBe('-');
      expect(formatTurkishDateTime('hatali')).toBe('-');
    });
  });

  describe('formatShortTurkishDate', () => {
    it('Kısa tarih formatını hatasız üretir', () => {
      const result = formatShortTurkishDate('2026-08-29T10:00:00Z');
      expect(result).toContain('2026');
    });
  });

  describe('PaymentResultPage Render Testleri', () => {
    it('PaymentResultPage RangeError atmadan başarıyla render olur', () => {
      sessionStorage.setItem('lastOrderDetails', JSON.stringify({
        orderNumber: 'MUH-12345',
        totalAmount: 450,
        createdAt: '2026-08-29T12:00:00Z',
        items: [{ productName: 'Beyaz Buhurdanlık', quantity: 1, unitPrice: 450 }]
      }));

      render(
        <MemoryRouter initialEntries={['/odeme/sonuc?orderNumber=MUH-12345']}>
          <AuthProvider>
            <Routes>
              <Route path="/odeme/sonuc" element={<PaymentResultPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Siparişiniz için teşekkür ederiz/i)).toBeDefined();
    });
  });

  describe('translateErrorMessage ve translateErrorCode Testleri', () => {
    it('Guest shipping address is invalid mesajını Türkçeye çevirir', () => {
      expect(translateErrorMessage('Guest shipping address is invalid.')).toBe('Misafir teslimat adresi bilgileri eksik veya geçersiz.');
    });

    it('Insufficient available stock mesajını Türkçeye çevirir', () => {
      expect(translateErrorMessage('Insufficient available stock.')).toBe('Bu ürün için yeterli stok bulunmuyor.');
    });

    it('Kupon, form alanı ve parola hata mesajlarını Türkçeye çevirir', () => {
      expect(translateErrorMessage('The phoneNumber field is required.')).toBe('Telefon numarası zorunlu bir alandır.');
      expect(translateErrorMessage('Coupon code is invalid')).toBe('Kupon kodu geçersiz veya bulunamadı.');
      expect(translateErrorMessage('Passwords do not match')).toBe('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
    });
  });
});
