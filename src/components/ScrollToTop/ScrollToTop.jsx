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
  const { pathname } = useLocation();

  // Yalnızca rota/sayfa değiştiğinde sayfanın en üstüne kaydır
  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
}
