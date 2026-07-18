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
            {categories.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0;
              const catName = cat.name || cat.label || '';
              return (
                <li
                  key={cat.id}
                  className={styles.item}
                  onMouseEnter={() => hasChildren && setActiveDropdown(cat.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={`/urunler?kategori=${cat.id}`}
                    className={`${styles.link} ${activeDropdown === cat.id ? styles.active : ''}`}
                  >
                    {catName}
                    {hasChildren && (
                      <FiChevronDown
                        className={`${styles.chevron} ${activeDropdown === cat.id ? styles.chevronOpen : ''}`}
                      />
                    )}
                  </a>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {hasChildren && activeDropdown === cat.id && (
                      <motion.ul
                        className={styles.dropdown}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="menu"
                      >
                        {cat.children.map((child) => {
                          const childName = child.name || child.label || '';
                          const childHref = child.href || `/urunler?kategori=${child.id}`;
                          const hasSubChildren = child.children && child.children.length > 0;

                          return (
                            <li key={child.id || childName} role="menuitem" style={{ position: 'relative' }}>
                              <a href={childHref} className={styles.dropdownLink} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 600 }}>{childName}</span>
                                
                                {/* Render 2nd-level subcategories directly below for a compact tree structure */}
                                {hasSubChildren && (
                                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 10, marginTop: 4, borderLeft: '1px dashed rgba(201,162,39,0.3)', gap: 2 }}>
                                    {child.children.map(subChild => (
                                      <a
                                        key={subChild.id}
                                        href={`/urunler?kategori=${subChild.id}`}
                                        style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none', padding: '2px 0' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        • {subChild.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </a>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
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
                {categories.map((cat) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  const catName = cat.name || cat.label || '';
                  return (
                    <li key={cat.id} className={styles.mobileItem}>
                      <details className={styles.mobileDetails}>
                        <summary className={styles.mobileSummary}>
                          <a href={`/urunler?kategori=${cat.id}`}>{catName}</a>
                          {hasChildren && <FiChevronDown className={styles.mobileChevron} />}
                        </summary>
                        {hasChildren && (
                          <ul className={styles.mobileSub}>
                            {cat.children.map((child) => {
                              const childName = child.name || child.label || '';
                              const childHref = child.href || `/urunler?kategori=${child.id}`;
                              const hasSubChildren = child.children && child.children.length > 0;

                              return (
                                <li key={child.id || childName}>
                                  <a href={childHref} className={styles.mobileSubLink}>
                                    {childName}
                                  </a>
                                  {hasSubChildren && (
                                    <ul style={{ paddingLeft: 16, listStyle: 'none', margin: '4px 0 8px 0' }}>
                                      {child.children.map(subChild => (
                                        <li key={subChild.id}>
                                          <a href={`/urunler?kategori=${subChild.id}`} className={styles.mobileSubLink} style={{ fontSize: '12px', opacity: 0.8 }}>
                                            — {subChild.name}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
