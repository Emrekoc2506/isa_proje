// useStickyHeader — Scroll pozisyonuna göre header sticky davranışı
import { useState, useEffect } from 'react';

export function useStickyHeader(threshold = 80) {
  const [isSticky, setIsSticky] = useState(false);
  const [scrollDir, setScrollDir] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      setIsSticky(currentY > threshold);
      setScrollDir(currentY > lastScrollY ? 'down' : 'up');
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold]);

  return { isSticky, scrollDir };
}
