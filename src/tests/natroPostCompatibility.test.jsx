import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as productApi from '../services/productApi';
import * as categoryApi from '../services/categoryApi';
import * as bannerApi from '../services/bannerApi';
import { getHardDeleteErrorMessage } from '../utils/apiErrorHelpers';

describe('Natro Windows Hosting POST Compatibility Specification Tests', () => {

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true, id: 'test-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API CONTRACT METHOD & ENDPOINT VERIFICATION', () => {

    it('1. updateAdminProduct sends POST to /admin/products/{id}/update', async () => {
      const payload = { name: 'Test Ürün', price: 100 };
      await productApi.updateAdminProduct('prod-123', payload);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/products/prod-123/update'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );
    });

    it('2. deleteAdminProduct sends POST to /admin/products/{id}/hard-delete with { confirm: true }', async () => {
      await productApi.deleteAdminProduct('prod-123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/products/prod-123/hard-delete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ confirm: true })
        })
      );
    });

    it('3. updateAdminCategory sends POST to /admin/categories/{id}/update', async () => {
      const payload = { name: 'Test Kategori', parentCategoryId: null };
      await categoryApi.updateAdminCategory('cat-456', payload);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/categories/cat-456/update'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );
    });

    it('4. deleteAdminCategory sends POST to /admin/categories/{id}/hard-delete with { confirm: true }', async () => {
      await categoryApi.deleteAdminCategory('cat-456');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/categories/cat-456/hard-delete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ confirm: true })
        })
      );
    });

    it('5. updateAdminBanner sends POST to /admin/banners/{id}/update', async () => {
      const payload = { title: 'Test İlan', sortOrder: 1 };
      await bannerApi.updateAdminBanner('banner-789', payload);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/banners/banner-789/update'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );
    });

    it('6. deleteAdminBanner sends POST to /admin/banners/{id}/hard-delete with { confirm: true }', async () => {
      await bannerApi.deleteAdminBanner('banner-789');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/banners/banner-789/hard-delete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ confirm: true })
        })
      );
    });

  });

  describe('HARD-DELETE ERROR MESSAGE HELPER MAPPER', () => {

    it('maps product_has_order_history error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'product_has_order_history' }, 'Ürün');
      expect(msg).toContain('geçmiş siparişlerde kullanıldığı için');
    });

    it('maps category_has_products error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'category_has_products' }, 'Kategori');
      expect(msg).toContain('kategoride ürün bulunuyor');
    });

    it('maps category_has_children error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'category_has_children' }, 'Kategori');
      expect(msg).toContain('alt kategorileri bulunuyor');
    });

    it('maps confirmation_required error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'confirmation_required' }, 'Ürün');
      expect(msg).toContain('Kalıcı silme onayı gönderilemedi');
    });

    it('maps hard_delete_conflict error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'hard_delete_conflict' }, 'Ürün');
      expect(msg).toContain('Ürün bağlı veriler nedeniyle');
    });

    it('maps hard_delete_file_cleanup_failed error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'hard_delete_file_cleanup_failed' }, 'İlan');
      expect(msg).toContain('bazı dosyalar temizlenemedi');
    });

    it('maps not_found error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'not_found' }, 'Kategori');
      expect(msg).toContain('Kategori artık mevcut değil');
    });

    it('maps forbidden / 403 error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'forbidden' }, 'Ürün');
      expect(msg).toContain('admin yetkiniz bulunmuyor');
    });

    it('maps network_error error code correctly', () => {
      const msg = getHardDeleteErrorMessage({ code: 'network_error' }, 'Ürün');
      expect(msg).toContain('Sunucuya bağlanılamadı');
    });

    it('falls back to custom message or entityName default when unknown error occurs', () => {
      const msgCustom = getHardDeleteErrorMessage({ message: 'Özel hata' }, 'Ürün');
      expect(msgCustom).toBe('Özel hata');

      const msgDefault = getHardDeleteErrorMessage({}, 'İlan');
      expect(msgDefault).toBe('İlan silinemedi.');
    });

  });

});
