import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as productApi from '../services/productApi';

describe('Ürün Çoklu Fotoğraf Desteği Entegrasyonu (Max 7 Görsel)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. 1 görsel ile ürün payload\'ı imageUrls dizisi olarak gönderilir', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'p-1', name: 'Tek Görselli Ürün', imageUrls: ['https://cdn.example.com/image-1.jpg'] })
    });

    const payload = {
      name: 'Tek Görselli Ürün',
      price: 150,
      imageUrls: ['https://cdn.example.com/image-1.jpg']
    };

    await productApi.createAdminProduct(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/products'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          imageUrls: ['https://cdn.example.com/image-1.jpg']
        })
      })
    );
  });

  it('2. 3 görsel ile ürün payload\'ı imageUrls dizisi olarak gönderilir', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'p-3' })
    });

    const imageUrls = [
      'https://cdn.example.com/img-1.jpg',
      'https://cdn.example.com/img-2.jpg',
      'https://cdn.example.com/img-3.jpg'
    ];

    const payload = {
      name: '3 Görselli Ürün',
      price: 250,
      imageUrls
    };

    await productApi.createAdminProduct(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/products'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          imageUrls
        })
      })
    );
  });

  it('3. 7 görsel ile ürün güncelleme payload\'ında imageUrls doğru iletilir', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'p-7' })
    });

    const imageUrls = Array.from({ length: 7 }, (_, i) => `https://cdn.example.com/img-${i + 1}.jpg`);

    const payload = {
      name: '7 Görselli Ürün',
      price: 999,
      imageUrls
    };

    await productApi.updateAdminProduct('p-7', payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/products/p-7/update'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          imageUrls
        })
      })
    );
  });
});
