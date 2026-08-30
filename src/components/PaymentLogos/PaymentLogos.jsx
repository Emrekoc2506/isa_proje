import React from 'react';
import styles from './PaymentLogos.module.css';
import visaLogo from '../../assets/images/visa-logo.png';
import mastercardLogo from '../../assets/images/mastercard-logo.png';
import troyLogo from '../../assets/images/troy-logo.png';

/**
 * 1. VISA Logosu (Kullanıcının Belirttiği Orijinal PNG)
 */
export function VisaBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Visa ile Güvenli Ödeme">
      <img
        src={visaLogo}
        alt="Visa"
        style={{ height: `${height}px` }}
        className={styles.logoImg}
      />
    </div>
  );
}

/**
 * 2. MASTERCARD Logosu (Kullanıcının Belirttiği Orijinal PNG)
 */
export function MastercardBadge({ height = 20, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="Mastercard ile Güvenli Ödeme">
      <img
        src={mastercardLogo}
        alt="Mastercard"
        style={{ height: `${height}px` }}
        className={styles.logoImg}
      />
    </div>
  );
}

/**
 * 3. TROY Logosu (Kullanıcının Belirttiği Orijinal PNG)
 */
export function TroyBadge({ height = 18, className = '' }) {
  return (
    <div className={`${styles.badge} ${className}`} title="TROY ile Güvenli Ödeme">
      <img
        src={troyLogo}
        alt="TROY"
        style={{ height: `${height}px` }}
        className={styles.logoImg}
      />
    </div>
  );
}

/**
 * Tüm Logoların Ayrı Ayrı Şeffaf Yan Yana Yerleşimi
 */
export default function PaymentBadges({ height = 19, className = '' }) {
  return (
    <div className={`${styles.badgesGroup} ${className}`}>
      <VisaBadge height={height} />
      <MastercardBadge height={height + 2} />
      <TroyBadge height={height} />
    </div>
  );
}
