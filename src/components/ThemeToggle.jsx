import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={styles.wrapper} title={isLight ? "Gece Moduna Geç" : "Gündüz Moduna Geç"}>
      <label className={styles.switch} aria-label="Gece/Gündüz Modu Değiştir">
        <input 
          type="checkbox" 
          id="theme-toggle" 
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
