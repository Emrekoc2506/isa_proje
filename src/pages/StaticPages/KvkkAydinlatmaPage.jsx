import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function KvkkAydinlatmaPage() {
  return (
    <div className={s.page}>
      <SEO
        title="KVKK Aydınlatma Metni | Muhristan"
        description="Muhristan Kişisel Verilerin Korunmasına İlişkin Aydınlatma Metni. Veri sorumlusu İsa Şahap işletmesi KVKK hakları ve işleme amaçları."
        canonical="https://muhristan.com/kvkk-aydinlatma"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>KVKK Aydınlatma Metni</h1>
          <p className={s.heroSubtitle}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca verilerinizin işlenmesi ve haklarınız hakkında bilgilendirme.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>1. Veri Sorumlusu</h2>
          <p className={s.text}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında kişisel verileriniz bakımından veri sorumlusu <strong>İsa Şahap şahıs işletmesidir.</strong>
          </p>
          <p className={s.textSecondary}>
            <strong>Resmî Unvan:</strong> İsa Şahap (Muhristan)<br />
            <strong>Vergi Numarası / Dairesi:</strong> 7890939339 / Şehitlik Vergi Dairesi<br />
            <strong>Adres:</strong> Akpıyar Mahallesi, 4094. Sokak, Karaköprü / Şanlıurfa<br />
            <strong>E-posta:</strong> <a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a><br />
            <strong>Telefon / WhatsApp:</strong> 0542 790 68 63
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>2. Kişisel Verilerin Toplanma Yöntemleri</h2>
          <p className={s.text}>
            Kişisel verileriniz; web sitemiz, üyelik formu, sipariş işlemleri, kişiye özel çalışma ve müşteri talepleri, iletişim formları, e-posta, WhatsApp ve ödeme altyapıları aracılığıyla otomatik veya otomatik olmayan yöntemlerle toplanmaktadır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>3. İşlenen Kişisel Veriler</h2>
          <ul className={s.list}>
            <li className={s.listItem}>Kimlik ve İletişim Bilgileri (Ad, soyad, e-posta, telefon, adres)</li>
            <li className={s.listItem}>Sipariş ve Fatura Bilgileri (Satın alınan ürünler, ödeme ve kargo kayıtları)</li>
            <li className={s.listItem}>Müşteri İşlem ve Destek Bilgileri (WhatsApp ve e-posta yazışmaları)</li>
            <li className={s.listItem}>Kişiye Özel Ürün / Tasarım Bilgileri (Talep edilen özel ölçü, isim, semboller)</li>
            <li className={s.listItem}>İnternet Sitesi İşlem Kayıtları (IP adresi, güvenlik ve çerez kayıtları)</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>4. İşleme Amaçları ve Hukuki Sebepler</h2>
          <p className={s.text}>
            Verileriniz; sözleşmenin kurulması ve ifası, siparişlerin hazırlanması ve teslimi, ödeme ve muhasebe süreçlerinin yürütülmesi, yasal yükümlülüklerin yerine getirilmesi ve müşteri memnuniyeti amaçlarıyla KVKK Madde 5 çerçevesinde işlenmektedir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>5. Verilerin Aktarılması</h2>
          <p className={s.textSecondary}>
            Kişisel verileriniz işleme amaçlarıyla sınırlı olmak üzere kargo şirketlerine, ödeme kuruluşlarına (örn. İyzico), mali müşavire ve kanunen yetkili kamu kurumlarına KVKK Madde 8 ve 9 uyarınca aktarılabilmektedir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>6. İlgili Kişinin Hakları (KVKK Madde 11)</h2>
          <p className={s.text}>
            KVKK Madde 11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme ve itiraz etme haklarına sahipsiniz. Taleplerinizi <a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a> adresine iletebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
