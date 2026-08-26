import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ id = "theme-toggle" }) {
  const { theme, toggleTheme, isAutoMode } = useTheme();
  const isLight = theme === 'light';

  const tooltipText = isAutoMode
    ? `Otomatik TR Saati Döngüsü: ${isLight ? 'Gündüz' : 'Gece'} Modu Aktif (Manuel değiştirmek için tıklayın)`
    : (isLight ? "Gece Moduna Geç" : "Gündüz Moduna Geç");

  return (
    <div className={styles.wrapper} title={tooltipText}>
      <label className={styles.switch} htmlFor={id} aria-label="Gece/Gündüz Modu Değiştir">
        <input 
          type="checkbox" 
          id={id} 
          checked={isLight} 
          onChange={toggleTheme} 
        />
        <span className={styles.slider}>
          <div className={styles.moonsHole}>
            <div className={styles.moonHole} />
            <div className={styles.moonHole} />
            <div className={styles.moonHole} />
          </div>
          <div className={styles.blackClouds}>
            <div className={styles.blackCloud} />
            <div className={styles.blackCloud} />
            <div className={styles.blackCloud} />
          </div>
          <div className={styles.clouds}>
            <div className={styles.cloud} />
            <div className={styles.cloud} />
            <div className={styles.cloud} />
            <div className={styles.cloud} />
            <div className={styles.cloud} />
            <div className={styles.cloud} />
            <div className={styles.cloud} />
          </div>
          <div className={styles.stars}>
            <svg className={styles.star} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className={styles.star} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className={styles.star} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className={styles.star} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className={styles.star} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
          </div>
        </span>
      </label>
    </div>
  );
}
