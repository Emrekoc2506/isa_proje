// useScrollReveal — Kesintisiz ve her zaman görünür içerik sunumu
import { useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('reveal');
    el.classList.add('visible');
  }, []);

  return ref;
}
