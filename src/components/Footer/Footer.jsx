import styles from './Footer.module.css';
import { FiFacebook, FiInstagram, FiYoutube, FiTwitter, FiMail } from 'react-icons/fi';
import { footerLinks } from '../../data/index';
import logoImage from '../../assets/images/logo.png';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* ── Üst: Logo + Newsletter ────────────────────────── */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="/" className={styles.logoLink}>
              <img
                src={logoImage}
                alt="mysticvelora"
                className={styles.logo}
              />
              <span className={styles.brandName}>mysticvelora</span>
            </a>
            <p className={styles.tagline}>
              Ezoterizmin gizemli dünyasını keşfedin. Yüksek kaliteli ezoterik ürünler,
              uçucu yağlar, tütsüler, kristaller, tarot ve çok daha fazlası.
            </p>

            {/* Sosyal Medya */}
            <div className={styles.social}>
              {[
                { Icon: FiFacebook, label: 'Facebook', href: '#' },
                { Icon: FiInstagram, label: 'Instagram', href: '#' },
                { Icon: FiYoutube, label: 'YouTube', href: '#' },
                { Icon: FiTwitter, label: 'Twitter/X', href: '#' },
              ].map(({ Icon, label, href }) => (
                <a key={label} href={href} className={styles.socialLink} aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className={styles.newsletter}>
            <h4 className={styles.newsletterTitle}>Mistik Çemberde Kalın</h4>
            <p className={styles.newsletterDesc}>
              Özel teklifler, ezoterik içgörüler ve yeni ürünlerden e-posta ile haberdar olun.
            </p>
            <form className={styles.newsletterForm} onSubmit={e => e.preventDefault()}>
              <div className={styles.inputGroup}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.newsletterInput}
                  placeholder="eposta@adresiniz.com"
                  aria-label="E-posta adresi"
                />
              </div>
              <button type="submit" className={styles.newsletterBtn}>
                Abone Ol
              </button>
            </form>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className={styles.divider} />

        {/* ── Orta: Link Kolonları ──────────────────────────── */}
        <div className={styles.links}>
          <div className={styles.linkCol}>
            <h5 className={styles.colTitle}>Bilgi</h5>
            <ul className={styles.linkList}>
              {footerLinks.info.map(l => (
                <li key={l.label}>
                  <a href={l.href} className={styles.link}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h5 className={styles.colTitle}>Hesabım</h5>
            <ul className={styles.linkList}>
              {footerLinks.customer.map(l => (
                <li key={l.label}>
                  <a href={l.href} className={styles.link}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h5 className={styles.colTitle}>Kategoriler</h5>
            <ul className={styles.linkList}>
              {footerLinks.categories.map(l => (
                <li key={l.label}>
                  <a href={l.href} className={styles.link}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className={styles.divider} />

        {/* ── Alt: Copyright ────────────────────────────────── */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} mysticvelora — Tüm hakları saklıdır.
          </p>
          <p className={styles.poweredBy}>
            Powered by <span className={styles.highlight}>IdoSell</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
