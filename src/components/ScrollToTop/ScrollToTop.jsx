import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const root = document.getElementById('root');
  if (root) root.scrollTop = 0;
}

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  // 1. Rota veya URL parametresi değiştiğinde en üste kaydır
  useEffect(() => {
    scrollToTop();
  }, [pathname, search, hash]);

  // 2. Herhangi bir buton veya bağlantıya tıklandığında otomatik en üste kaydır
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const target = e.target.closest('a, button');
      if (target) {
        setTimeout(() => {
          scrollToTop();
        }, 50);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return null;
}
