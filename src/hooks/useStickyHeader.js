// useStickyHeader — Scroll pozisyonuna göre header sticky davranışı
import { useState, useEffect, useRef } from 'react';

export function useStickyHeader(threshold = 80) {
  const [isSticky, setIsSticky] = useState(false);
  const [scrollDir, setScrollDir] = useState('up');
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      setIsSticky(currentY > threshold);
      setScrollDir(currentY > lastScrollYRef.current ? 'down' : 'up');
      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isSticky, scrollDir };
}
