import { useState, useEffect, useRef } from 'react';

export function getYoutubeEmbedUrl(url, autoplay, muted, loop) {
  if (!url) return '';

  // Google Drive URL Desteği (https://drive.google.com/file/d/FILE_ID/preview)
  if (url.includes('drive.google.com')) {
    if (url.includes('/file/d/')) {
      const driveId = url.split('/file/d/')[1]?.split('/')[0];
      if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    return url.replace(/\/view.*$/, '/preview');
  }

  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/watch')) {
    const searchParams = new URLSearchParams(url.split('?')[1] || '');
    videoId = searchParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
  }

  if (url.includes('vimeo.com/')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&muted=${(muted || autoplay) ? 1 : 0}&loop=${loop ? 1 : 0}`;
  }

  if (!videoId) return url;

  const autoParam = autoplay ? 1 : 0;
  const muteParam = (muted || autoplay) ? 1 : 0;
  const loopParam = loop ? 1 : 0;
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoParam}&mute=${muteParam}&loop=${loopParam}&playlist=${videoId}&playsinline=1`;
}

export default function VideoBannerItem({
  slide,
  className = '',
  isFirst = false,
  onVideoEnd,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mediaType = slide?.mediaType || (slide?.videoUrl ? 'video' : 'image');
  const isVideo = Boolean(slide) && (mediaType === 'video' || Boolean(slide?.videoUrl));

  // Mobil öncelik sıralaması:
  // mobileVideoUrl -> videoUrl -> mobilePosterImageUrl -> posterImageUrl
  const videoSrc = isMobile && slide?.mobileVideoUrl ? slide.mobileVideoUrl : (slide?.videoUrl || '');
  const posterSrc = isMobile
    ? (slide?.mobilePosterImageUrl || slide?.mobileImageUrl || slide?.posterImageUrl || slide?.imageUrl || '')
    : (slide?.posterImageUrl || slide?.imageUrl || slide?.mobilePosterImageUrl || slide?.mobileImageUrl || '');

  const isExternalVideo = Boolean(
    videoSrc && (
      videoSrc.includes('youtube') || 
      videoSrc.includes('youtu.be') || 
      videoSrc.includes('vimeo') || 
      videoSrc.includes('drive.google.com')
    )
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // IntersectionObserver ile ekrandan çıkınca pause, ekrana girince play
  useEffect(() => {
    if (!slide || !isVideo || isExternalVideo || hasError || !containerRef.current) return;

    const element = containerRef.current;
    let observer;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (videoRef.current) {
              if (entry.isIntersecting) {
                videoRef.current.play().catch(() => {});
              } else {
                videoRef.current.pause();
              }
            }
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(element);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [slide, isVideo, isExternalVideo, hasError, videoSrc]);

  if (!slide) return null;

  // Görsel banner veya video hatası durumunda poster render et
  if (!isVideo || hasError || !videoSrc) {
    return (
      <picture style={{ width: '100%', height: '100%', display: 'block' }}>
        <source media="(max-width: 768px)" srcSet={slide.mobilePosterImageUrl || slide.mobileImageUrl || posterSrc} />
        <img
          src={posterSrc || slide.imageUrl}
          alt={slide.title || 'Banner'}
          className={className}
          loading={isFirst ? 'eager' : 'lazy'}
          fetchPriority={isFirst ? 'high' : 'auto'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </picture>
    );
  }

  // Harici YouTube / Vimeo videosu
  if (isExternalVideo) {
    const embedUrl = getYoutubeEmbedUrl(videoSrc, slide.autoplay, slide.muted || slide.autoplay, slide.loop);
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <iframe
          src={embedUrl}
          title={slide.title || 'Video Banner'}
          className={className}
          style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  const autoplay = Boolean(slide.autoplay);
  const muted = Boolean(slide.muted || slide.autoplay);
  const loop = Boolean(slide.loop);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        playsInline
        preload={isFirst ? 'auto' : 'metadata'}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setHasError(true)}
        onEnded={onVideoEnd}
      />
    </div>
  );
}
