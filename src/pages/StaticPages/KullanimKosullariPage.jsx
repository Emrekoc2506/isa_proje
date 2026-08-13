import { FiFileText, FiShoppingCart, FiUserCheck, FiAlertTriangle } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function KullanimKosullariPage() {
  return (
    <div className={s.page}>
      <SEO
        title="Kullanım Koşulları | Muhristan"
        description="Muhristan web sitesi üyelik ve kullanım koşulları. Kullanıcı hakları, hesap güvenliği ve satış esasları."
        canonical="https://muhristan.com/kullanim-kosullari"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Kullanım Koşulları</h1>
          <p className={s.heroSubtitle}>
            Sitemizi ve hizmetlerimizi kullanmadan önce lütfen kullanım koşullarını dikkatlice okuyunuz.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiFileText style={{ marginRight: 8 }} /> 1. Genel Hükümler</h2>
          <p className={s.text}>
            Bu kullanım koşulları, Muhristan web sitesini ziyaret eden ve alışveriş yapan tüm kullanıcılar için geçerlidir. Muhristan markası <strong>İsa Şahap şahıs işletmesi</strong> tarafından işletilmektedir.
          </p>
          <p className={s.textSecondary}>
            <strong>Vergi Numarası / Dairesi:</strong> 7890939339 / Şehitlik Vergi Dairesi<br />
            <strong>Adres:</strong> Akpıyar Mahallesi, 4094. Sokak, Karaköprü / Şanlıurfa<br />
            <strong>İletişim:</strong> <a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a> | 0542 790 68 63
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiUserCheck style={{ marginRight: 8 }} /> 2. Üyelik ve Hesap Güvenliği</h2>
          <p className={s.text}>
            Kullanıcılar üyelik oluştururken doğru, güncel ve eksiksiz bilgi vermekle yükümlüdür. Hesap parola ve giriş bilgilerinin gizliliği kullanıcının kendi sorumluluğundadır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiShoppingCart style={{ marginRight: 8 }} /> 3. Sipariş ve Kullanım Kuralları</h2>
          <p className={s.text}>
            Sitede sunulan özel tasarım takı, mühür, el sanatları ve aksesuar ürünlerinin siparişinde kullanıcılar sipariş özeti ve sözleşme koşullarını onaylarlar. Kişiye özel ürünlerde verilen ölçü ve kişiselleştirme bilgilerinin doğruluğu kullanıcının sorumluluğundadır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiAlertTriangle style={{ marginRight: 8 }} /> 4. Fikri Mülkiyet ve Değişiklikler</h2>
          <p className={s.textSecondary}>
            Muhristan markası, logo, tasarım ve görseller İsa Şahap işletmesine aittir. Muhristan kullanım koşullarını güncel tutma hakkını saklı tutar.
          </p>
        </div>
      </div>
    </div>
  );
}
