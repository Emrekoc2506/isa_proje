import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function CerezPolitikasiPage() {
  return (
    <div className={s.page}>
      <SEO
        title="Çerez Politikası | Muhristan"
        description="Muhristan çerez politikası. İnternet sitemizde kullanılan zorunlu, işlevsel ve analitik çerezler ve yönetimi."
        canonical="https://muhristan.com/cerez-politikasi"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Çerez Politikası</h1>
          <p className={s.heroSubtitle}>
            Sitemizde çerezlerin kullanımı, türleri ve tercihlerinizin yönetilmesi hakkında bilgilendirme.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>1. Çerez (Cookie) Nedir?</h2>
          <p className={s.text}>
            Çerezler, bir internet sitesini ziyaret ettiğinizde cihazınıza kaydedilen küçük metin dosyalarıdır. Sitenin güvenli çalışması, sepetinizin hatırlanması ve kullanıcı deneyiminin iyileştirilmesi için kullanılır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>2. Kullanılan Çerez Türleri</h2>
          <ul className={s.list}>
            <li className={s.listItem}><strong>Zorunlu Çerezler:</strong> Sitenin oturum açma, alışveriş sepeti ve ödeme gibi temel işlevleri için gereklidir.</li>
            <li className={s.listItem}><strong>İşlevsel Çerezler:</strong> Tercihlerinizi ve site ayarlarınızı hatırlamaya yarar.</li>
            <li className={s.listItem}><strong>Analitik Çerezler:</strong> Sitenin performansını ve ziyaret istatistiklerini ölçmek amacıyla kullanılır.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>3. Çerez Tercihlerinin Yönetimi</h2>
          <p className={s.textSecondary}>
            Tarayıcı ayarlarınız üzerinden dilediğiniz zaman çerezleri engelleyebilir veya silebilirsiniz. Ancak zorunlu çerezlerin engellenmesi sitemizdeki bazı alışveriş işlevlerinin çalışmamasına neden olabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
