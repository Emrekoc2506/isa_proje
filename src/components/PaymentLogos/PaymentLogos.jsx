import React from 'react';
import styles from './PaymentLogos.module.css';

/**
 * 1. VISA Logosu — Pixel-perfect Vektörel (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function VisaBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Visa ile Güvenli Ödeme">
      <svg
        viewBox="0 0 66 22"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Visa"
      >
        {/* V Sarı Kanat */}
        <path
          d="M6.2 0.8H0.4L0.3 1.1C5.8 2.5 10.3 5.8 12.2 11.2L10.7 3.2C10.4 1.5 9.1 0.9 7.3 0.8H6.2Z"
          fill="#F59E0B"
        />
        {/* V Harfi */}
        <path
          d="M16.2 0.8L11 14.2L10.4 11.3C9.5 7.7 6.8 4 3.3 2.2L7.9 19.8H13.5L21.7 0.8H16.2Z"
          className={styles.visaBlue}
        />
        {/* I Harfi */}
        <path
          d="M24.9 19.8L28.2 0.8H33.5L30.2 19.8H24.9Z"
          className={styles.visaBlue}
        />
        {/* S Harfi */}
        <path
          d="M46.5 1.2C45.4 0.7 43.6 0.3 41.4 0.3C35.6 0.3 31.6 3.4 31.5 7.8C31.5 11.1 34.4 12.9 36.6 14C38.9 15.1 39.7 15.9 39.7 16.9C39.7 18.4 37.9 19.1 36.2 19.1C33.8 19.1 32.5 18.7 30.6 17.9L29.8 17.5L29 22.2C30.3 22.8 32.8 23.3 35.4 23.3C41.6 23.3 45.6 20.2 45.7 15.5C45.7 12.9 44.2 11 40.7 9.3C38.6 8.3 37.3 7.6 37.3 6.5C37.3 5.5 38.4 4.5 40.8 4.5C42.7 4.5 44.2 4.9 45.3 5.4L45.8 5.6L46.5 1.2Z"
          className={styles.visaBlue}
        />
        {/* A Harfi */}
        <path
          d="M60.1 0.8H56C54.7 0.8 53.7 1.2 53.1 2.6L45.4 19.8H50.9L52 16.8H58.7L59.3 19.8H64.2L60.1 0.8ZM53.5 12.8L56.5 4.6L58.2 12.8H53.5Z"
          className={styles.visaBlue}
        />
      </svg>
    </div>
  );
}

/**
 * 2. MASTERCARD Logosu — İki Geçişli Halka ve Tipografi (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function MastercardBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Mastercard ile Güvenli Ödeme">
      <svg
        viewBox="0 0 68 22"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Mastercard"
      >
        {/* Kırmızı Daire */}
        <circle cx="10" cy="11" r="8.5" fill="#EB001B" />
        {/* Sarı Daire */}
        <circle cx="21" cy="11" r="8.5" fill="#F79E1B" />
        {/* Kesişim Alanı */}
        <path
          d="M15.5 4.5A8.5 8.5 0 0 1 19 11A8.5 8.5 0 0 1 15.5 17.5A8.5 8.5 0 0 1 12 11A8.5 8.5 0 0 1 15.5 4.5Z"
          fill="#FF5F00"
        />
        {/* mastercard Tipografisi */}
        <text
          x="32"
          y="14.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="-0.3px"
          className={styles.brandText}
        >
          mastercard
        </text>
      </svg>
    </div>
  );
}

/**
 * 3. TROY Logosu — tr + turkuaz o + y (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function TroyBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="TROY ile Güvenli Ödeme">
      <svg
        viewBox="0 0 54 22"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="TROY"
      >
        {/* 'tr' */}
        <text
          x="1"
          y="16"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="14.5"
          fontWeight="800"
          letterSpacing="-0.6px"
          className={styles.troyDark}
        >
          tr
        </text>

        {/* 'o' Turkuaz Çember & İç Nokta */}
        <circle cx="21.5" cy="11.2" r="5.2" stroke="#00B2A9" strokeWidth="2.4" fill="none" />
        <circle cx="21.5" cy="11.2" r="1.5" fill="#00B2A9" />

        {/* 'y' */}
        <text
          x="29"
          y="16"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="14.5"
          fontWeight="800"
          letterSpacing="-0.6px"
          className={styles.troyDark}
        >
          y
        </text>
      </svg>
    </div>
  );
}

/**
 * Tüm Logoların Ayrı Ayrı Şeffaf Yan Yana Yerleşimi
 */
export default function PaymentBadges({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badgesGroup} ${className}`}>
      <VisaBadge height={height} />
      <MastercardBadge height={height} />
      <TroyBadge height={height} />
    </div>
  );
}
