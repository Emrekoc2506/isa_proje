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
import PaymentBadges from "../PaymentLogos/PaymentLogos";
import { useProducts } from "../../context/ProductContext";

export default function Footer() {
  let dynamicCategories = [];
  try {
    const prodCtx = useProducts();
    dynamicCategories = prodCtx?.categories || [];
  } catch {
    // Isolated component environment fallback
  }

  const categoryItems = (Array.isArray(dynamicCategories) && dynamicCategories.length > 0)
    ? [
        ...dynamicCategories.slice(0, 8).map(c => ({
          label: c.name || c.label,
          href: `/urunler?kategori=${c.id}`
        })),
        { label: 'Blog', href: '/blog' }
      ]
    : footerLinks.categories;

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
              Mühristan'ın eşsiz dünyasını keşfedin. Yüksek kaliteli özel tasarım mühürler, gümüş yüzükler, kolyeler ve el sanatları ürünleri.
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
            <h4 className={styles.newsletterTitle}>Mühristan Ailesine Katılın</h4>
            <p className={styles.newsletterDesc}>
              Özel teklifler, yeni tasarımlar ve kampanyalardan e-posta ile haberdar olun.
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
              {categoryItems.map((l) => (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', opacity: 0.95 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
              🔒 256-Bit SSL Güvenli Ödeme
            </span>
            <PaymentBadges height={20} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-light)', background: 'rgba(201,162,39,0.1)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(201,162,39,0.25)' }}>
              %100 Güvenli Alışveriş
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
