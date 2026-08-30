import React from 'react';
import styles from './PaymentLogos.module.css';

/**
 * 1. VISA Logosu (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function VisaBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Visa ile Güvenli Ödeme">
      <svg
        viewBox="0 0 52 18"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Visa"
      >
        {/* V Sarı Kanat */}
        <path d="M6.2 1.2H0.2L0.1 1.5C4.8 2.7 8.8 5.6 10.4 10.2L9.1 3.2C8.8 1.7 7.7 1.2 6.2 1.2Z" fill="#F59E0B" />
        {/* V Gövdesi */}
        <path d="M14.8 1.2L10.4 12.6L9.9 10.2C9.1 7.2 6.9 3.9 4 2.4L7.8 17.5H12.5L19.5 1.2H14.8Z" className={styles.visaBlue} />
        {/* I */}
        <path d="M22.1 17.5L24.9 1.2H29.3L26.5 17.5H22.1Z" className={styles.visaBlue} />
        {/* S */}
        <path d="M41 1.6C40.1 1.3 38.6 1 36.8 1C32.1 1 28.8 3.5 28.8 7.1C28.8 9.7 31.2 11.2 33 12.1C34.9 13 35.5 13.6 35.5 14.4C35.5 15.6 34.1 16.2 32.7 16.2C30.8 16.2 29.7 15.9 28.2 15.2L27.6 14.9L26.9 18.8C28 19.3 30 19.7 32.1 19.7C37.1 19.7 40.4 17.2 40.4 13.4C40.4 11.3 39.2 9.7 36.4 8.3C34.7 7.5 33.7 6.9 33.7 6C33.7 5.2 34.6 4.4 36.5 4.4C38.1 4.4 39.2 4.7 40.1 5.1L40.5 5.3L41 1.6Z" className={styles.visaBlue} />
        {/* A */}
        <path d="M47.2 1.2H43.8C42.7 1.2 41.8 1.5 41.4 2.6L35.3 17.5H40L40.9 15H46.7L47.2 17.5H51.4L47.2 1.2ZM42.2 11.4L44.7 4.6L46.1 11.4H42.2Z" className={styles.visaBlue} />
      </svg>
    </div>
  );
}

/**
 * 2. MASTERCARD Logosu (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function MastercardBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Mastercard ile Güvenli Ödeme">
      <svg
        viewBox="0 0 60 24"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Mastercard"
      >
        {/* Kırmızı Daire */}
        <circle cx="12" cy="12" r="10" fill="#EB001B" />
        {/* Sarı Daire */}
        <circle cx="24" cy="12" r="10" fill="#F79E1B" />
        {/* Kesişim Alanı */}
        <path
          d="M18 4.27A10 10 0 0 1 22 12A10 10 0 0 1 18 19.73A10 10 0 0 1 14 12A10 10 0 0 1 18 4.27Z"
          fill="#FF5F00"
        />
        {/* mastercard Yazısı */}
        <text
          x="36"
          y="15.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="8.5"
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
 * 3. TROY Logosu (Şeffaf / Gece-Gündüz Uyumlu)
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
          y="16.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="14"
          fontWeight="800"
          letterSpacing="-0.5px"
          className={styles.troyDark}
        >
          tr
        </text>

        {/* 'o' Turkuaz Halka & Merkez */}
        <circle cx="21" cy="11.5" r="5.2" stroke="#00B2A9" strokeWidth="2.4" fill="none" />
        <circle cx="21" cy="11.5" r="1.5" fill="#00B2A9" />

        {/* 'y' */}
        <text
          x="28.5"
          y="16.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="14"
          fontWeight="800"
          letterSpacing="-0.5px"
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
