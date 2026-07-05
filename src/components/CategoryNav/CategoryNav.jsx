import styles from './CategoryNav.module.css';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { useProducts } from '../../context/ProductContext';
import { dropdownVariants } from '../../animations/variants';

export default function CategoryNav({ mobileOpen, onMobileClose }) {
  const { categories } = useProducts();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC ile kapat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* ── Desktop Nav ────────────────────────────────────── */}
      <nav className={styles.nav} ref={navRef} aria-label="Main categories">
        <div className={styles.inner}>
          <ul className={styles.list}>
            {categories.map((cat) => (
              <li
                key={cat.id}
                className={styles.item}
                onMouseEnter={() => cat.children && setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={`/urunler?kategori=${cat.id}`}
                  className={`${styles.link} ${activeDropdown === cat.id ? styles.active : ''}`}
                  onClick={(e) => {
                    if (cat.children) {
                      // e.preventDefault(); // Remove preventDefault to allow navigation, dropdown is on hover anyway on desktop
                    }
                  }}
                >
                  {cat.label}
                  {cat.children && (
                    <FiChevronDown
                      className={`${styles.chevron} ${activeDropdown === cat.id ? styles.chevronOpen : ''}`}
                    />
                  )}
                </a>

                {/* Dropdown */}
                <AnimatePresence>
                  {cat.children && activeDropdown === cat.id && (
                    <motion.ul
                      className={styles.dropdown}
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      role="menu"
                    >
                      {cat.children.map((child) => (
                        <li key={child.label} role="menuitem">
                          <a href={child.href} className={styles.dropdownLink}>
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobil Menü Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Arka plan karartma */}
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />

            {/* Menü Paneli */}
            <motion.div
              className={styles.mobilePanel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className={styles.mobilePanelHeader}>
                <span className={styles.mobilePanelTitle}>Menü</span>
                <button
                  className={styles.mobileClose}
                  onClick={onMobileClose}
                  aria-label="Menüyü kapat"
                >
                  <FiX />
                </button>
              </div>

              <ul className={styles.mobileList}>
                {categories.map((cat) => (
                  <li key={cat.id} className={styles.mobileItem}>
                    <details className={styles.mobileDetails}>
                      <summary className={styles.mobileSummary}>
                        <a href={`/urunler?kategori=${cat.id}`}>{cat.label}</a>
                        {cat.children && <FiChevronDown className={styles.mobileChevron} />}
                      </summary>
                      {cat.children && (
                        <ul className={styles.mobileSub}>
                          {cat.children.map((child) => (
                            <li key={child.label}>
                              <a href={child.href} className={styles.mobileSubLink}>
                                {child.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
