import React, { useEffect, useRef } from 'react';

/**
 * FocusTrap Bileşeni
 * Açılan modal veya diyaloglarda klavye (Tab) odağını sadece modal içerisinde tutar.
 */
export default function FocusTrap({ children, active = true }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!active || !rootRef.current) return;

    const element = rootRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () => {
      return Array.from(element.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      );
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // İlk odağı modal içindeki ilk elemana ver
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return (
    <div ref={rootRef} style={{ outline: 'none' }} tabIndex={-1}>
      {children}
    </div>
  );
}
