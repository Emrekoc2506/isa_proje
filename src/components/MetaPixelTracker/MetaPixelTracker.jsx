import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initMetaPixel, trackPageView } from '../../utils/metaPixel';

/**
 * Meta Pixel SPA Route & Initialization Tracker
 *
 * BrowserRouter içine yerleştirilir. Uygulama başlangıcında Pixel'i init eder
 * ve her gerçek rota değişiminde PageView event'i gönderir.
 * Bileşen re-render olduğunda aynı rota için duplicate PageView gönderimini engeller.
 */
export default function MetaPixelTracker() {
  const location = useLocation();
  const lastTrackedPathRef = useRef(null);

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    if (lastTrackedPathRef.current !== currentPath) {
      lastTrackedPathRef.current = currentPath;
      trackPageView();
    }
  }, [location.pathname, location.search]);

  return null;
}
