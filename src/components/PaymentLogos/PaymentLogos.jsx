import React from 'react';
import styles from './PaymentLogos.module.css';

/**
 * 1. VISA Logosu — Kusursuz Harf Aralıkları ve Resmi Oranlar (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function VisaBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Visa ile Güvenli Ödeme">
      <svg
        viewBox="0 0 76 24"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Visa"
      >
        {/* V Sarı Vurgu (Sol Üst Kanat) */}
        <path
          d="M6.5 1.5H0.5L0.4 1.8C5.2 3.1 9.4 6.2 11.2 11.2L9.8 3.5C9.5 1.9 8.3 1.5 6.5 1.5Z"
          fill="#F59E0B"
        />
        {/* V Harfi */}
        <path
          d="M15.5 1.5L10.8 14.5L10.2 11.8C9.3 8.3 6.8 4.8 3.5 3.1L7.8 19.8H13.2L20.8 1.5H15.5Z"
          className={styles.visaBlue}
        />
        {/* I Harfi (x: 23 - 29.5) */}
        <path
          d="M23.5 19.8L26.6 1.5H31.8L28.7 19.8H23.5Z"
          className={styles.visaBlue}
        />
        {/* S Harfi (x: 33.5 - 51) — I ile hiçbir teması/çakışması yoktur */}
        <path
          d="M50.2 2.2C49.1 1.7 47.3 1.3 45.2 1.3C39.6 1.3 35.8 4.3 35.7 8.5C35.7 11.7 38.4 13.5 40.6 14.6C42.8 15.7 43.6 16.5 43.6 17.5C43.6 19 41.8 19.7 40.1 19.7C37.8 19.7 36.5 19.3 34.6 18.5L33.8 18.1L33 22.8C34.3 23.4 36.7 23.8 39.2 23.8C45.2 23.8 49.2 20.8 49.3 16.2C49.3 13.6 47.8 11.7 44.4 10C42.4 9 41.2 8.3 41.2 7.3C41.2 6.3 42.3 5.4 44.5 5.4C46.3 5.4 47.7 5.8 48.8 6.3L49.3 6.5L50.2 2.2Z"
          className={styles.visaBlue}
        />
        {/* A Harfi (x: 53 - 75) */}
        <path
          d="M69.8 1.5H65.8C64.5 1.5 63.6 1.9 63 3.3L55.5 19.8H60.8L61.8 16.8H68.3L68.9 19.8H73.6L69.8 1.5ZM63.3 12.8L66.2 4.8L67.8 12.8H63.3Z"
          className={styles.visaBlue}
        />
      </svg>
    </div>
  );
}

/**
 * 2. MASTERCARD Logosu — Kutunun İçinde Mükemmel Ortalanmış ve Dengeli
 */
export function MastercardBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${styles.mastercardBadge} ${className}`} title="Mastercard ile Güvenli Ödeme">
      <svg
        viewBox="0 0 78 24"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Mastercard"
      >
        {/* Sol Kırmızı Daire */}
        <circle cx="12" cy="12" r="9.5" fill="#EB001B" />
        {/* Sağ Sarı/Turuncu Daire */}
        <circle cx="23.5" cy="12" r="9.5" fill="#F79E1B" />
        {/* Kesişim Alanı */}
        <path
          d="M17.75 4.8A9.5 9.5 0 0 1 21.5 12A9.5 9.5 0 0 1 17.75 19.2A9.5 9.5 0 0 1 14 12A9.5 9.5 0 0 1 17.75 4.8Z"
          fill="#FF5F00"
        />
        {/* Ortalanmış mastercard Tipografisi */}
        <text
          x="36"
          y="15.2"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="-0.2px"
          className={styles.brandText}
        >
          mastercard
        </text>
      </svg>
    </div>
  );
}

/**
 * 3. TROY Logosu — Turkuaz Halka & Modern Tipografi
 */
export function TroyBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="TROY ile Güvenli Ödeme">
      <svg
        viewBox="0 0 68 24"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="TROY"
      >
        {/* 'tr' */}
        <text
          x="2"
          y="17"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="15"
          fontWeight="800"
          letterSpacing="-0.5px"
          className={styles.troyDark}
        >
          tr
        </text>

        {/* 'o' Turkuaz Halka & Merkez Nokta */}
        <circle cx="27" cy="12" r="5.8" stroke="#00B2A9" strokeWidth="2.6" fill="none" />
        <circle cx="27" cy="12" r="1.6" fill="#00B2A9" />

        {/* 'y' */}
        <text
          x="36"
          y="17"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="15"
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
export default function PaymentBadges({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badgesGroup} ${className}`}>
      <VisaBadge height={height} />
      <MastercardBadge height={height} />
      <TroyBadge height={height} />
    </div>
  );
}
