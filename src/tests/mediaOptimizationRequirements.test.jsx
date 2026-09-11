import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import VideoBannerItem, { getBannerAlt } from '../components/HeroSlider/VideoBannerItem';
import BannersSection, { MAX_BANNER_VIDEO_SIZE } from '../pages/AdminPage/sections/BannersSection';
import MediaOptimizationSection, { formatBytes } from '../pages/AdminPage/sections/MediaOptimizationSection';
import * as mediaApi from '../services/mediaApi';
import { uploadFile } from '../services/fileApi';
import * as bannerApi from '../services/bannerApi';

vi.mock('../services/bannerApi', () => ({
  getAdminBanners: vi.fn().mockResolvedValue([]),
  createAdminBanner: vi.fn().mockResolvedValue({ id: 'b-created' }),
  getBanners: vi.fn().mockResolvedValue([]),
  updateAdminBannerStatus: vi.fn(),
  deleteAdminBanner: vi.fn(),
}));

vi.mock('../services/fileApi', () => ({
  uploadFile: vi.fn().mockImplementation((file, purpose, ownerId, onProgress) => {
    if (onProgress) onProgress(50);
    return Promise.resolve({ url: 'https://cdn.example.com/uploaded-video.mp4' });
  }),
}));

vi.mock('../services/mediaApi', () => ({
  reoptimizeMedia: vi.fn(),
}));

describe('Media Optimization Requirements Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    global.IntersectionObserver = vi.fn(function () {
      this.observe = vi.fn();
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Banner Video Limit (25 MB) & UI Labels', () => {
    it('1.1 Rejects 26 MB video file on client with exact error message', async () => {
      render(<BannersSection />);
      const openBtn = await screen.findByText(/Yeni (İlan|Billboard) Ekle/i);
      fireEvent.click(openBtn);

      const titleInput = screen.getByLabelText(/Başlık \*/i);
      fireEvent.change(titleInput, { target: { value: 'Big File Test' } });

      const nextBtn = screen.getByText(/İleri/i);
      fireEvent.click(nextBtn);

      const videoTypeBtn = await screen.findByRole('button', { name: 'Video' });
      fireEvent.click(videoTypeBtn);

      const fileInput = document.getElementById('videoFile');
      const file26MB = new File(['x'], 'too-large.mp4', { type: 'video/mp4' });
      Object.defineProperty(file26MB, 'size', { value: 26 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [file26MB] } });

      expect(window.alert).toHaveBeenCalledWith('Video boyutu en fazla 25 MB olabilir.');
      expect(uploadFile).not.toHaveBeenCalled();
    });

    it('1.2 Accepts 25 MB or below video file and uploads', async () => {
      render(<BannersSection />);
      const openBtn = await screen.findByText(/Yeni (İlan|Billboard) Ekle/i);
      fireEvent.click(openBtn);

      fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: '25MB Test' } });
      fireEvent.click(screen.getByText(/İleri/i));
      fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

      const fileInput = document.getElementById('videoFile');
      const file25MB = new File(['x'], 'exact-25mb.mp4', { type: 'video/mp4' });
      Object.defineProperty(file25MB, 'size', { value: 25 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [file25MB] } });

      await waitFor(() => {
        expect(uploadFile).toHaveBeenCalledWith(
          file25MB,
          'BannerVideo',
          null,
          expect.any(Function)
        );
      });
      expect(MAX_BANNER_VIDEO_SIZE).toBe(25 * 1024 * 1024);
    });

    it('1.3 UI displays "25 MB" and does not display "100 MB"', async () => {
      const { container } = render(<BannersSection />);
      const openBtn = await screen.findByText(/Yeni (İlan|Billboard) Ekle/i);
      fireEvent.click(openBtn);
      fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: 'UI Text Check' } });
      fireEvent.click(screen.getByText(/İleri/i));
      fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

      // Does not contain 100 MB
      expect(container.textContent).not.toContain('100 MB');
      expect(container.textContent).not.toContain('100MB');

      // Contains 25 MB
      expect(container.textContent).toMatch(/25\s*MB/);
    });
  });

  describe('2. Hero Video Preload & Mobile Fallback', () => {
    it('2.1 Hero video uses preload="metadata" and does NOT use preload="auto"', () => {
      const slide = {
        id: 's1',
        mediaType: 'video',
        videoUrl: 'https://cdn.example.com/banner.mp4',
        posterImageUrl: 'https://cdn.example.com/poster.jpg',
        title: 'Hero Banner',
      };

      // Even when isFirst=true, preload must be 'metadata'
      const { container } = render(<VideoBannerItem slide={slide} isFirst={true} />);
      const video = container.querySelector('video');

      expect(video).toBeInTheDocument();
      expect(video.getAttribute('preload')).toBe('metadata');
      expect(video.getAttribute('preload')).not.toBe('auto');
    });

    it('2.2 On mobile when mobileVideoUrl is missing, does NOT load desktop video, renders poster', () => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));

      const slide = {
        id: 's-mobile-no-vid',
        mediaType: 'video',
        videoUrl: 'https://cdn.example.com/heavy-desktop.mp4',
        mobileVideoUrl: '', // NO mobile video
        posterImageUrl: 'https://cdn.example.com/desktop-poster.jpg',
        mobilePosterImageUrl: 'https://cdn.example.com/mobile-poster.jpg',
        title: 'Mobile No Video Fallback',
      };

      const { container } = render(<VideoBannerItem slide={slide} />);

      // Must NOT render video element with heavy desktop video
      const video = container.querySelector('video');
      expect(video).toBeNull();

      // Must render picture/img with mobile poster
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe('https://cdn.example.com/mobile-poster.jpg');
      expect(img.getAttribute('alt')).toBe('Mobile No Video Fallback');
    });

    it('2.3 On mobile when mobileVideoUrl is present, mobile video is used', () => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));

      const slide = {
        id: 's-mobile-vid',
        mediaType: 'video',
        videoUrl: 'https://cdn.example.com/heavy-desktop.mp4',
        mobileVideoUrl: 'https://cdn.example.com/optimized-mobile.mp4',
        posterImageUrl: 'https://cdn.example.com/poster.jpg',
        title: 'Mobile Has Video',
      };

      const { container } = render(<VideoBannerItem slide={slide} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video.getAttribute('src')).toBe('https://cdn.example.com/optimized-mobile.mp4');
    });

    it('2.4 Semantic alt text: getBannerAlt never outputs generic "Banner"', () => {
      expect(getBannerAlt({ title: 'Tılsımlı Kolye' })).toBe('Tılsımlı Kolye');
      expect(getBannerAlt({ title: '', subtitle: 'Özel Buhur Koleksiyonu' })).toBe('Özel Buhur Koleksiyonu');
      expect(getBannerAlt({ title: '', subtitle: '' })).toBe('');
      expect(getBannerAlt(null)).toBe('');
      expect(getBannerAlt({})).not.toBe('Banner');
    });
  });

  describe('3. Admin Media Optimization Section (Dry Run & Live Optimization)', () => {
    it('3.1 Does NOT call reoptimizeMedia automatically on mount', () => {
      render(<MediaOptimizationSection />);
      expect(mediaApi.reoptimizeMedia).not.toHaveBeenCalled();
    });

    it('3.2 Dry-run button triggers reoptimizeMedia with dryRun=true and displays simulation report', async () => {
      mediaApi.reoptimizeMedia.mockResolvedValueOnce({
        totalScanned: 50,
        alreadyOptimized: 30,
        wouldOptimize: 20,
        skipped: 0,
        failed: 0,
        estimatedBytesBefore: 10485760, // 10 MB
        estimatedBytesAfter: 3145728,   // 3 MB
      });

      render(<MediaOptimizationSection />);

      const dryRunBtn = screen.getByRole('button', { name: /Eski Görselleri Analiz Et/i });
      fireEvent.click(dryRunBtn);

      await waitFor(() => {
        expect(mediaApi.reoptimizeMedia).toHaveBeenCalledWith({
          dryRun: true,
          batchSize: 25,
        });
      });

      // Simulation report rendered
      expect(screen.getByText('Dry-Run Analiz Sonucu (Simülasyon)')).toBeInTheDocument();
      expect(screen.getByText('10 MB')).toBeInTheDocument();
      expect(screen.getByText('3 MB')).toBeInTheDocument();
      expect(screen.getByText('7 MB')).toBeInTheDocument(); // Savings
    });

    it('3.3 Live optimization button is disabled before dry-run is performed', () => {
      render(<MediaOptimizationSection />);

      const liveBtn = screen.getByRole('button', { name: /Optimizasyonu Başlat/i });
      expect(liveBtn).toBeDisabled();
    });

    it('3.4 After dry-run, live optimization button opens confirmation modal with exact text', async () => {
      mediaApi.reoptimizeMedia.mockResolvedValueOnce({
        totalScanned: 25,
        alreadyOptimized: 10,
        wouldOptimize: 15,
        skipped: 0,
        failed: 0,
        estimatedBytesBefore: 5242880,
        estimatedBytesAfter: 1572864,
      });

      render(<MediaOptimizationSection />);

      // Run dry-run first
      fireEvent.click(screen.getByRole('button', { name: /Eski Görselleri Analiz Et/i }));
      await waitFor(() => {
        expect(screen.getByText('Dry-Run Analiz Sonucu (Simülasyon)')).toBeInTheDocument();
      });

      // Live button is now enabled
      const liveBtn = screen.getByRole('button', { name: /Optimizasyonu Başlat/i });
      expect(liveBtn).not.toBeDisabled();

      // Click live button -> modal opens
      fireEvent.click(liveBtn);

      expect(
        screen.getByText(
          'Bu işlem eski ürün, kategori ve banner görsellerinin optimize edilmiş yeni sürümlerini oluşturacaktır. Orijinal dosyalar silinmeyecektir. Devam etmek istiyor musunuz?'
        )
      ).toBeInTheDocument();
    });

    it('3.5 Confirming modal calls reoptimizeMedia with dryRun=false and renders completed report', async () => {
      mediaApi.reoptimizeMedia
        .mockResolvedValueOnce({
          totalScanned: 25,
          alreadyOptimized: 10,
          wouldOptimize: 15,
          skipped: 0,
          failed: 0,
          estimatedBytesBefore: 5000000,
          estimatedBytesAfter: 2000000,
        })
        .mockResolvedValueOnce({
          totalScanned: 25,
          optimized: 15,
          alreadyOptimized: 10,
          skipped: 0,
          failed: 0,
          estimatedBytesBefore: 5000000,
          estimatedBytesAfter: 1800000,
        });

      render(<MediaOptimizationSection />);

      // 1. Dry run
      fireEvent.click(screen.getByRole('button', { name: /Eski Görselleri Analiz Et/i }));
      await waitFor(() => {
        expect(screen.getByText('Dry-Run Analiz Sonucu (Simülasyon)')).toBeInTheDocument();
      });

      // 2. Open modal
      fireEvent.click(screen.getByRole('button', { name: /Optimizasyonu Başlat/i }));

      // 3. Confirm in modal
      const confirmBtn = screen.getByRole('button', { name: /Evet, Başlat/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mediaApi.reoptimizeMedia).toHaveBeenCalledWith({
          dryRun: false,
          batchSize: 25,
        });
      });

      // Completed report rendered
      await waitFor(() => {
        expect(screen.getByText('Optimizasyon Başarıyla Tamamlandı')).toBeInTheDocument();
        expect(screen.getByText('Canlı İşlem')).toBeInTheDocument();
      });
    });

    it('3.6 Prevents double submit and displays loading state during execution', async () => {
      let resolvePromise;
      mediaApi.reoptimizeMedia.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<MediaOptimizationSection />);

      const dryRunBtn = screen.getByRole('button', { name: /Eski Görselleri Analiz Et/i });
      fireEvent.click(dryRunBtn);

      // Button is in loading state and disabled
      expect(screen.getByText('Analiz Ediliyor...')).toBeInTheDocument();
      expect(dryRunBtn).toBeDisabled();

      // Click again while busy -> should NOT call again
      fireEvent.click(dryRunBtn);
      expect(mediaApi.reoptimizeMedia).toHaveBeenCalledTimes(1);

      // Resolve promise
      resolvePromise({ totalScanned: 0 });
      await waitFor(() => {
        expect(screen.queryByText('Analiz Ediliyor...')).not.toBeInTheDocument();
      });
    });

    it('3.7 Backend error displays error message and does not display success report', async () => {
      mediaApi.reoptimizeMedia.mockRejectedValueOnce(new Error('Sunucu optimizasyon hatası'));

      render(<MediaOptimizationSection />);

      fireEvent.click(screen.getByRole('button', { name: /Eski Görselleri Analiz Et/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Sunucu optimizasyon hatası');
      });

      expect(screen.queryByText('Optimizasyon Başarıyla Tamamlandı')).not.toBeInTheDocument();
      expect(screen.queryByText('Dry-Run Analiz Sonucu (Simülasyon)')).not.toBeInTheDocument();
    });

    it('3.8 formatBytes correctly handles bytes, KB, MB, and GB', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(null)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(26214400)).toBe('25 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });
});
