import styles from './HeroSlider.module.css';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useProducts } from '../../context/ProductContext';

const AUTOPLAY_INTERVAL = 5000;

export default function HeroSlider() {
  const { slides } = useProducts();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((idx, dir = 1) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length, 1);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current - 1 + slides.length) % slides.length, -1);
  }, [current, goTo, slides.length]);

  // Otomatik Oynatma
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next, isPaused, slides.length]);

  if (slides.length === 0) {
    return null; // Slayt yoksa hiçbir şey çizme
  }

  const slide = slides[current];

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <section
      className={styles.slider}
      aria-label="Hero Slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Slides ─────────────────────────────────────────── */}
      <div className={styles.track}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={slide.id}
            className={styles.slide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Arka Plan Görseli */}
            <picture>
              <source media="(max-width: 768px)" srcSet={slide.imageMobile} />
              <img
                src={slide.image}
                alt={slide.title}
                className={styles.slideImg}
                loading={current === 0 ? 'eager' : 'lazy'}
              />
            </picture>

            {/* Overlay gradient */}
            <div className={styles.slideOverlay} />

            {/* Metin İçeriği */}
            <motion.div
              className={styles.slideContent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className={styles.slideSubtitle}>{slide.subtitle}</span>
              <h1 className={styles.slideTitle}>{slide.title}</h1>
              <a href={slide.href} className={styles.slideCta}>
                {slide.cta}
                <span className={styles.ctaArrow}>→</span>
              </a>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Önceki / Sonraki Butonları ─────────────────────── */}
      <button
        className={`${styles.navBtn} ${styles.prevBtn}`}
        onClick={prev}
        aria-label="Previous slide"
      >
        <FiChevronLeft />
      </button>
      <button
        className={`${styles.navBtn} ${styles.nextBtn}`}
        onClick={next}
        aria-label="Next slide"
      >
        <FiChevronRight />
      </button>

      {/* ── Pagination Dots ────────────────────────────────── */}
      <div className={styles.pagination} role="tablist" aria-label="Slide navigation">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
