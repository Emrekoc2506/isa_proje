import { FiLock, FiEye, FiDatabase, FiMail, FiShield, FiCreditCard } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function GizlilikPage() {
  return (
    <div className={s.page}>
      <SEO
        title="Gizlilik Politikası | Muhristan"
        description="Muhristan gizlilik politikası. Kullanıcı verilerinin güvenliği, ödeme güvenliği ve veri sorumlusu İsa Şahap işletmesi gizlilik esasları."
        canonical="https://muhristan.com/gizlilik-politikasi"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Gizlilik Politikası</h1>
          <p className={s.heroSubtitle}>
            Kullanıcı bilgilerinizin gizliliği ve güvenliği bizim için en yüksek önceliktir.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiLock style={{ marginRight: 8 }} /> 1. İşletme Bilgileri</h2>
          <p className={s.text}>
            Muhristan markası <strong>İsa Şahap şahıs işletmesi</strong> tarafından işletilmektedir.
          </p>
          <p className={s.textSecondary}>
            <strong>Vergi Numarası / Dairesi:</strong> 7890939339 / Şehitlik Vergi Dairesi<br />
            <strong>Adres:</strong> Akpıyar Mahallesi, 4094. Sokak, Karaköprü / Şanlıurfa<br />
            <strong>E-posta:</strong> <a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a><br />
            <strong>Telefon / WhatsApp:</strong> 0542 790 68 63
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiEye style={{ marginRight: 8 }} /> 2. Toplanan Bilgiler ve Kullanımı</h2>
          <p className={s.text}>
            Sitemizi ziyaret ettiğinizde, üye olduğunuzda veya sipariş verdiğinizde kimlik, iletişim, teslimat, fatura, sipariş tercihleri ve güvenlik verileri işlenebilir.
          </p>
          <p className={s.textSecondary}>
            Bu bilgiler siparişlerin hazırlanması, teslimatı, faturalandırılması, müşteri desteği ve yasal yükümlülüklerin ifası amacıyla kullanılır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiCreditCard style={{ marginRight: 8 }} /> 3. Ödeme ve Hesap Güvenliği</h2>
          <p className={s.text}>
            Ödeme işlemleri BDDK lisanslı ödeme kuruluşları (örn. İyzico) ve bankaların 256-bit SSL korumalı altyapıları üzerinden gerçekleştirilir. Kredi kartı bilgileriniz Muhristan sunucularında saklanmaz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiShield style={{ marginRight: 8 }} /> 4. Üçüncü Taraf Paylaşımları</h2>
          <p className={s.textSecondary}>
            Kişisel verileriniz yalnızca siparişinizin tamamlanması için zorunlu olan kargo şirketleri, bankalar ve yasal mercilerle paylaşılır. Üçüncü taraflara pazarlama amacıyla satılmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
