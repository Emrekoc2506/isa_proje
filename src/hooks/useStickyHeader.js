// useStickyHeader — Scroll pozisyonuna göre header sticky davranışı (Hysteresis korumalı)
import { useState, useEffect, useRef } from 'react';

export function useStickyHeader(threshold = 120, offThreshold = 40) {
  const [isSticky, setIsSticky] = useState(false);
  const [scrollDir, setScrollDir] = useState('up');
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      setIsSticky((prev) => {
        if (!prev && currentY > threshold) return true;
        if (prev && currentY < offThreshold) return false;
        return prev;
      });

      setScrollDir(currentY > lastScrollYRef.current ? 'down' : 'up');
      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, offThreshold]);

  return { isSticky, scrollDir };
}
