import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import {
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiTwitter,
  FiMail,
} from "react-icons/fi";
import { footerLinks } from "../../data/index";
import logoImage from "../../assets/images/logo-2.png";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* ── Üst: Logo + Newsletter ────────────────────────── */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="/" className={styles.logoLink}>
              <img src={logoImage} alt="muhristan" className={styles.logo} />
              <span className={styles.brandName}>muhristan</span>
            </a>
            <p className={styles.tagline}>
              Ezoterizmin gizemli dünyasını keşfedin. Yüksek kaliteli ezoterik
              ürünler, uçucu yağlar, tütsüler, kristaller, tarot ve çok daha
              fazlası.
            </p>

            {/* Sosyal Medya */}
            <div className={styles.social}>
              {[
                { Icon: FiFacebook, label: "Facebook", href: "#" },
                { Icon: FiInstagram, label: "Instagram", href: "#" },
                { Icon: FiYoutube, label: "YouTube", href: "#" },
                { Icon: FiTwitter, label: "Twitter/X", href: "#" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className={styles.socialLink}
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className={styles.newsletter}>
            <h4 className={styles.newsletterTitle}>Mistik Çemberde Kalın</h4>
            <p className={styles.newsletterDesc}>
              Özel teklifler, ezoterik içgörüler ve yeni ürünlerden e-posta ile
              haberdar olun.
            </p>
            <form
              className={styles.newsletterForm}
              onSubmit={(e) => e.preventDefault()}
            >
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
              {footerLinks.info.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className={styles.link}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h5 className={styles.colTitle}>Hesabım</h5>
            <ul className={styles.linkList}>
              {footerLinks.customer.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className={styles.link}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkCol}>
            <h5 className={styles.colTitle}>Kategoriler</h5>
            <ul className={styles.linkList}>
              {footerLinks.categories.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className={styles.link}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className={styles.divider} />

        {/* ── Alt: Güvenlik / Ödeme Rozetleri ve Copyright ── */}
        <div className={styles.bottom} style={{ flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', opacity: 0.9 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
              🔒 256-Bit SSL Güvenli Ödeme
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              VISA
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              mastercard
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              troy
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-light)', background: 'rgba(201,162,39,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(201,162,39,0.25)' }}>
              iyzico ile Güvenli Öde
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} muhristan — Tüm hakları saklıdır. (İsa Şahap Şahıs İşletmesi)
            </p>
            <p className={styles.poweredBy}>
              Powered by <span className={styles.highlight}>IdoSell</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
