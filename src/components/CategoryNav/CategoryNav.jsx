import styles from './CategoryNav.module.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi';
import { useProducts } from '../../context/ProductContext';
import { dropdownVariants } from '../../animations/variants';

// Dropdown portal bileşeni — overflow kısıtlamasından kaçmak için
function DropdownPortal({ anchorRect, children, onClose }) {
  if (!anchorRect) return null;

  const style = {
    position: 'fixed',
    top: anchorRect.bottom + 1,
    left: anchorRect.left,
    zIndex: 9999,
    minWidth: Math.max(anchorRect.width, 200),
  };

  return createPortal(
    <div style={style} onMouseLeave={onClose}>
      {children}
    </div>,
    document.body
  );
}

export default function CategoryNav({ mobileOpen, onMobileClose }) {
  const { categories } = useProducts();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showLeftArrow, setShowLeftArrow]   = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navRef  = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // Scroll pozisyonuna göre ok göstergelerini güncelle
  const updateArrows = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const { scrollLeft, scrollWidth, clientWidth } = list;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Mouse ile sürükleyerek yatay kaydırma
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.pageX - list.offsetLeft;
      scrollLeft = list.scrollLeft;
      list.style.cursor = 'grabbing';
    };
    const onMouseUp = () => {
      isDragging = false;
      list.style.cursor = 'grab';
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - list.offsetLeft;
      const walk = (x - startX) * 1.5;
      list.scrollLeft = scrollLeft - walk;
    };
    const onMouseLeave = () => {
      isDragging = false;
      list.style.cursor = 'grab';
    };

    list.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    list.addEventListener('mousemove', onMouseMove);
    list.addEventListener('mouseleave', onMouseLeave);
    list.addEventListener('scroll', updateArrows);

    // İlk render'da kontrol et
    updateArrows();

    return () => {
      list.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      list.removeEventListener('mousemove', onMouseMove);
      list.removeEventListener('mouseleave', onMouseLeave);
      list.removeEventListener('scroll', updateArrows);
    };
  }, [updateArrows]);

  // ESC ile kapat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseEnter = useCallback((catId, hasChildren) => {
    if (!hasChildren) return;
    const el = itemRefs.current[catId];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setActiveDropdown({ id: catId, rect });
  }, []);

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  // Ok butonuyla scroll
  const scrollBy = (dir) => {
    listRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Desktop Nav ────────────────────────────────────── */}
      <nav className={styles.nav} ref={navRef} aria-label="Main categories">
        <div className={styles.scrollWrapper}>

          {/* Sol gradient + geri oku */}
          <div className={`${styles.fadeLeft} ${showLeftArrow ? styles.visible : ''}`}>
            <button
              className={styles.scrollArrowBtn}
              onClick={() => scrollBy(-1)}
              aria-label="Sola kaydır"
              style={{ pointerEvents: showLeftArrow ? 'all' : 'none' }}
            >
              <FiChevronLeft className={styles.scrollArrow} />
            </button>
          </div>

          {/* Sağ gradient + ileri oku */}
          <div className={`${styles.fadeRight} ${!showRightArrow ? styles.hidden : ''}`}>
            <button
              className={styles.scrollArrowBtn}
              onClick={() => scrollBy(1)}
              aria-label="Sağa kaydır"
              style={{ pointerEvents: showRightArrow ? 'all' : 'none' }}
            >
              <FiChevronRight className={styles.scrollArrow} />
            </button>
          </div>

          {/* Kategori listesi */}
          <ul className={styles.list} ref={listRef}>
            {categories.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0;
              const catName = cat.name || cat.label || '';
              const isActive = activeDropdown?.id === cat.id;

              return (
                <li
                  key={cat.id}
                  className={styles.item}
                  ref={(el) => { itemRefs.current[cat.id] = el; }}
                  onMouseEnter={() => handleMouseEnter(cat.id, hasChildren)}
                >
                  <a
                    href={`/urunler?kategori=${cat.id}`}
                    className={`${styles.link} ${isActive ? styles.active : ''}`}
                  >
                    {catName}
                    {hasChildren && (
                      <FiChevronDown
                        className={`${styles.chevron} ${isActive ? styles.chevronOpen : ''}`}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Dropdown Portal ── */}
      <AnimatePresence>
        {activeDropdown && (() => {
          const cat = categories.find(c => c.id === activeDropdown.id);
          if (!cat || !cat.children?.length) return null;
          return (
            <DropdownPortal
              key={activeDropdown.id}
              anchorRect={activeDropdown.rect}
              onClose={closeDropdown}
            >
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
                    <li key={child.id || childName} role="menuitem">
                      <a
                        href={childHref}
                        className={styles.dropdownLink}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        <span style={{ fontWeight: 600 }}>{childName}</span>
                        {hasSubChildren && (
                          <div style={{
                            display: 'flex', flexDirection: 'column',
                            paddingLeft: 10, marginTop: 4,
                            borderLeft: '1px dashed rgba(201,162,39,0.3)', gap: 2
                          }}>
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
            </DropdownPortal>
          );
        })()}
      </AnimatePresence>

      {/* ── Mobil Menü Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.div
              className={styles.mobilePanel}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className={styles.mobilePanelHeader}>
                <span className={styles.mobilePanelTitle}>Menü</span>
                <button className={styles.mobileClose} onClick={onMobileClose} aria-label="Menüyü kapat">
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
                                  <a href={childHref} className={styles.mobileSubLink}>{childName}</a>
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
