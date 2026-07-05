// useScrollReveal — Intersection Observer ile scroll animasyonu
import { useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          if (!options.repeat) observer.unobserve(el);
        } else if (options.repeat) {
          el.classList.remove('visible');
        }
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    el.classList.add('reveal');
    observer.observe(el);

    return () => observer.disconnect();
  }, [options.repeat, options.threshold, options.rootMargin]);

  return ref;
}
