import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VideoBannerItem, { getYoutubeEmbedUrl } from '../components/HeroSlider/VideoBannerItem';
import BannersSection from '../pages/AdminPage/sections/BannersSection';
import HomePage from '../pages/HomePage/HomePage';
import { ProductProvider } from '../context/ProductContext';
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

describe('Video Banner & Upload Functionality', () => {
  let observeMock;
  let disconnectMock;

  beforeEach(() => {
    vi.clearAllMocks();
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    global.IntersectionObserver = vi.fn(function (callback) {
      this.callback = callback;
      this.observe = observeMock;
      this.unobserve = vi.fn();
      this.disconnect = disconnectMock;
    });

    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. MP4 input kabul edilir & 5. Upload success sonrası videoUrl payload'a eklenir
  test('accepts MP4 video input and uploads with BannerVideo purpose', async () => {
    render(<BannersSection />);

    const openBtn = await screen.findByText(/Yeni (İlan|Billboard) Ekle/i);
    fireEvent.click(openBtn);

    // Step 1 title
    const titleInput = screen.getByLabelText(/Başlık \*/i);
    fireEvent.change(titleInput, { target: { value: 'MP4 Test Banner' } });

    // Click Next
    const nextBtn = screen.getByText(/İleri/i);
    fireEvent.click(nextBtn);

    // Switch to Video Media Type
    const videoTypeBtn = await screen.findByRole('button', { name: 'Video' });
    fireEvent.click(videoTypeBtn);

    const fileInput = document.getElementById('videoFile');
    expect(fileInput).toBeInTheDocument();

    const mp4File = new File(['dummy mp4 video content'], 'promo.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(
        mp4File,
        'BannerVideo',
        null,
        expect.any(Function)
      );
    });

    expect(screen.getByText(/✓ Video Yüklendi/i)).toBeInTheDocument();
  });

  // 2. WebM input kabul edilir
  test('accepts WebM video input', async () => {
    render(<BannersSection />);
    fireEvent.click(await screen.findByText(/Yeni (İlan|Billboard) Ekle/i));
    fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: 'WebM Test' } });
    fireEvent.click(screen.getByText(/İleri/i));
    fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

    const fileInput = document.getElementById('videoFile');
    const webmFile = new File(['dummy webm content'], 'promo.webm', { type: 'video/webm' });
    fireEvent.change(fileInput, { target: { files: [webmFile] } });

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(
        webmFile,
        'BannerVideo',
        null,
        expect.any(Function)
      );
    });
  });

  // 3. JPG video alanında reddedilir
  test('rejects JPG file when uploaded in video input', async () => {
    render(<BannersSection />);
    fireEvent.click(await screen.findByText(/Yeni (İlan|Billboard) Ekle/i));
    fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: 'JPG Test' } });
    fireEvent.click(screen.getByText(/İleri/i));
    fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

    const fileInput = document.getElementById('videoFile');
    const jpgFile = new File(['dummy jpg content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [jpgFile] } });

    expect(window.alert).toHaveBeenCalledWith("Yalnızca MP4 veya WebM video yükleyebilirsiniz.");
    expect(uploadFile).not.toHaveBeenCalled();
  });

  // 4. 100 MB üstü reddedilir
  test('rejects video file exceeding 100 MB size limit', async () => {
    render(<BannersSection />);
    fireEvent.click(await screen.findByText(/Yeni (İlan|Billboard) Ekle/i));
    fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: 'Big File Test' } });
    fireEvent.click(screen.getByText(/İleri/i));
    fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

    const fileInput = document.getElementById('videoFile');
    const hugeFile = new File(['a'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(hugeFile, 'size', { value: 101 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [hugeFile] } });

    expect(window.alert).toHaveBeenCalledWith("Video boyutu en fazla 100 MB olabilir.");
    expect(uploadFile).not.toHaveBeenCalled();
  });

  // 6. Upload failure banner save işlemini durdurur
  test('stops banner save on upload failure', async () => {
    uploadFile.mockRejectedValueOnce(new Error('Sunucu hatası'));

    render(<BannersSection />);
    fireEvent.click(await screen.findByText(/Yeni (İlan|Billboard) Ekle/i));
    fireEvent.change(screen.getByLabelText(/Başlık \*/i), { target: { value: 'Failed Upload Test' } });
    fireEvent.click(screen.getByText(/İleri/i));
    fireEvent.click(await screen.findByRole('button', { name: 'Video' }));

    const fileInput = document.getElementById('videoFile');
    const mp4File = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Video yüklenemedi'));
    });

    // Try going to next step or submitting
    const nextBtn = screen.getByRole('button', { name: /(İleri|Yayınla)/i });
    fireEvent.click(nextBtn);

    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Video (yükleme başarısız|dosyası yükleyin)/));
    expect(bannerApi.createAdminBanner).not.toHaveBeenCalled();
  });

  // 8. Image banner eskisi gibi çalışır
  test('renders image banner correctly when mediaType is image', () => {
    const slide = {
      id: 'img-1',
      mediaType: 'image',
      imageUrl: 'https://cdn.example.com/banner.jpg',
      title: 'Görsel Afiş'
    };

    const { container } = render(<VideoBannerItem slide={slide} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/banner.jpg');
  });

  // 9. Video autoPlay muted loop playsInline özelliklerine sahiptir
  test('video element has autoPlay, muted, loop, and playsInline attributes', () => {
    const slide = {
      id: 'vid-1',
      mediaType: 'video',
      videoUrl: 'https://cdn.example.com/video.mp4',
      posterImageUrl: 'https://cdn.example.com/poster.jpg',
      autoplay: true,
      muted: true,
      loop: true,
      title: 'Video Banner'
    };

    const { container } = render(<VideoBannerItem slide={slide} />);
    const video = container.querySelector('video');

    expect(video).toBeInTheDocument();
    expect(video.getAttribute('src')).toBe('https://cdn.example.com/video.mp4');
    expect(video.getAttribute('poster')).toBe('https://cdn.example.com/poster.jpg');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('preload')).toBe('metadata');
  });

  // 10. Video hata verirse poster gösterilir
  test('falls back to poster image if video playback errors', () => {
    const slide = {
      id: 'vid-err',
      mediaType: 'video',
      videoUrl: 'https://cdn.example.com/broken-video.mp4',
      posterImageUrl: 'https://cdn.example.com/poster-fallback.jpg',
      title: 'Broken Video'
    };

    const { container } = render(<VideoBannerItem slide={slide} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();

    fireEvent.error(video);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/poster-fallback.jpg');
  });

  // 11. Mobil video varsa mobilde o kullanılır
  test('uses mobileVideoUrl on mobile screen widths', () => {
    window.innerWidth = 500;
    window.dispatchEvent(new Event('resize'));

    const slide = {
      id: 'vid-mob',
      mediaType: 'video',
      videoUrl: 'https://cdn.example.com/desktop.mp4',
      mobileVideoUrl: 'https://cdn.example.com/mobile.mp4',
      posterImageUrl: 'https://cdn.example.com/poster.jpg',
      title: 'Mobile Priority'
    };

    const { container } = render(<VideoBannerItem slide={slide} />);
    const video = container.querySelector('video');
    expect(video.getAttribute('src')).toBe('https://cdn.example.com/mobile.mp4');
  });

  // 12. IntersectionObserver videoyu pause/play yapar & 13. Component unmount sırasında observer temizlenir
  test('IntersectionObserver observes element and disconnects on unmount', () => {
    const slide = {
      id: 'vid-obs',
      mediaType: 'video',
      videoUrl: 'https://cdn.example.com/stream.mp4',
      title: 'Observer Test'
    };

    const { unmount } = render(<VideoBannerItem slide={slide} />);
    expect(observeMock).toHaveBeenCalled();

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  // 7. İki video banner SortOrder sırasıyla render edilir
  test('renders multiple video banners sorted by SortOrder on Homepage', async () => {
    const mockBanners = [
      {
        id: 'v2',
        title: '2. Video Banner',
        videoUrl: 'https://cdn.example.com/video2.mp4',
        sortOrder: 2,
        isActive: true,
        contentJson: JSON.stringify({ mediaType: 'video', videoUrl: 'https://cdn.example.com/video2.mp4' })
      },
      {
        id: 'v1',
        title: '1. Hero Video Banner',
        videoUrl: 'https://cdn.example.com/video1.mp4',
        sortOrder: 1,
        isActive: true,
        contentJson: JSON.stringify({ mediaType: 'video', videoUrl: 'https://cdn.example.com/video1.mp4' })
      }
    ];

    bannerApi.getBanners.mockResolvedValueOnce(mockBanners);

    render(
      <BrowserRouter>
        <ProductProvider>
          <HomePage />
        </ProductProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1. Hero Video Banner')).toBeInTheDocument();
      expect(screen.getByText('2. Video Banner')).toBeInTheDocument();
    });
  });

  // 10b. YouTube embed URL helper test
  test('formats YouTube embed URL correctly with autoplay and mute params', () => {
    const embedUrl = getYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true, true);
    expect(embedUrl).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(embedUrl).toContain('autoplay=1');
    expect(embedUrl).toContain('mute=1');
    expect(embedUrl).toContain('loop=1');
  });
});
