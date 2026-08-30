import React from 'react';
import styles from './PaymentLogos.module.css';

/**
 * 1. VISA Logosu — Resmi Orijinal Vektörel (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function VisaBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Visa ile Güvenli Ödeme">
      <svg
        viewBox="0 0 100 32"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Visa"
      >
        <path
          className={styles.visaBlue}
          d="M38.86 31.42l5.65-27.4h9.02l-5.65 27.4h-9.02zm33.51-26.75c-1.8-.7-4.6-1.46-8.08-1.46-8.9 0-15.17 4.74-15.22 11.53-.08 5.01 4.46 7.8 7.88 9.47 3.51 1.71 4.69 2.81 4.67 4.33-.05 2.34-2.8 3.41-5.39 3.41-3.6 0-5.52-.54-8.47-1.84l-1.16-.54-1.25 6.06c1.63.75 4.64 1.41 7.78 1.44 9.47 0 15.63-4.68 15.68-11.93.06-3.98-2.37-7.01-7.58-9.5-3.16-1.62-5.09-2.7-5.09-4.35.03-1.49 1.63-3.03 5.14-3.03 2.94-.05 5.07.63 6.72 1.34l.8.38 1.07-5.31zm24.18.08h-6.98c-2.16 0-3.78.62-4.73 2.89L71.4 31.42h9.47l1.89-5.23h11.58l1.09 5.23h8.34L96.55 4.75zm-11.26 18.77l3.54-9.74 2.04 9.74h-5.58zM24.77 4.75L15.93 23.4l-.95-4.88c-1.65-5.6-6.79-11.68-12.54-14.73l8.1 30.22h9.52l14.16-29.26h-9.45z"
          fill="#2563EB"
        />
        <path
          d="M12.44 4.75H0l-.13.62c9.7 2.48 16.12 8.46 18.78 15.64l-2.7-13.69c-.47-1.87-1.8-2.43-3.51-2.57z"
          fill="#F59E0B"
        />
      </svg>
    </div>
  );
}

/**
 * 2. MASTERCARD Logosu — Resmi Orijinal İki Halka ve Metin (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function MastercardBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Mastercard ile Güvenli Ödeme">
      <svg
        viewBox="0 0 100 40"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="Mastercard"
      >
        {/* Kırmızı Daire */}
        <circle cx="18" cy="20" r="18" fill="#EB001B" />
        {/* Sarı Daire */}
        <circle cx="40" cy="20" r="18" fill="#F79E1B" />
        {/* Kesişim Alanı */}
        <path
          d="M29 6.8A17.9 17.9 0 0 1 35.8 20A17.9 17.9 0 0 1 29 33.2A17.9 17.9 0 0 1 22.2 20A17.9 17.9 0 0 1 29 6.8Z"
          fill="#FF5F00"
        />
        {/* mastercard Tipografisi */}
        <text
          x="62"
          y="25.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="14.5"
          fontWeight="700"
          letterSpacing="-0.4px"
          className={styles.brandText}
        >
          mastercard
        </text>
      </svg>
    </div>
  );
}

/**
 * 3. TROY Logosu — Resmi Orijinal Vektörel (Şeffaf / Gece-Gündüz Uyumlu)
 */
export function TroyBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="TROY ile Güvenli Ödeme">
      <svg
        viewBox="0 0 95 38"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgLogo}
        aria-label="TROY"
      >
        {/* 't' */}
        <path
          d="M12.5 10.8V3.6H6.2V10.8H1.5V17H6.2V27.5C6.2 32.5 9.8 35.2 15.5 35.2C17.8 35.2 19.8 34.6 21 33.8L19.4 28.2C18.5 28.7 17.4 29 16.2 29C13.8 29 12.5 27.8 12.5 24.8V17H20.5V10.8H12.5Z"
          className={styles.troyDark}
        />
        {/* 'r' */}
        <path
          d="M23.5 10.8H29.5V15.2C31 12 34.5 10.2 39 10.2C40.5 10.2 41.8 10.5 43 11L41.2 17.2C40 16.8 38.8 16.5 37.5 16.5C33.2 16.5 29.8 19.8 29.8 25.5V35H23.5V10.8Z"
          className={styles.troyDark}
        />
        {/* 'o' Turkuaz Halka & Merkez Nokta */}
        <circle cx="58" cy="22.8" r="11.5" stroke="#00B2A9" strokeWidth="5.2" fill="none" />
        <circle cx="58" cy="22.8" r="3.2" fill="#00B2A9" />
        {/* 'y' */}
        <path
          d="M73 10.8L80.5 27.5L88 10.8H94.8L84.2 32.5C81.8 38 78.2 41.5 72.5 41.5C70.8 41.5 69.2 41.1 68 40.5L69.6 35C70.5 35.4 71.4 35.6 72.5 35.6C75.2 35.6 77 33.8 78.2 31L78.6 30L66.5 10.8H73Z"
          className={styles.troyDark}
        />
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
