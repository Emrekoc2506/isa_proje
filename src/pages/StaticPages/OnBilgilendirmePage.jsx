import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function OnBilgilendirmePage() {
  return (
    <div className={s.page}>
      <SEO
        title="Ön Bilgilendirme Formu | Muhristan"
        description="Muhristan ön bilgilendirme formu. Satıcı bilgileri, sipariş süreci, teslimat, cayma hakkı ve yasal hususlar."
        canonical="https://muhristan.com/on-bilgilendirme-formu"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Ön Bilgilendirme Formu</h1>
          <p className={s.heroSubtitle}>
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca ön bilgilendirme metni.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>1. Satıcı Bilgileri</h2>
          <p className={s.text}>
            <strong>İşletme Sahibi / Resmî Unvan:</strong> İsa Şahap<br />
            <strong>Marka:</strong> Muhristan<br />
            <strong>İşletme Türü:</strong> Şahıs İşletmesi<br />
            <strong>Vergi Numarası / Dairesi:</strong> 7890939339 / Şehitlik Vergi Dairesi<br />
            <strong>Adres:</strong> Akpıyar Mahallesi, 4094. Sokak, Karaköprü / Şanlıurfa<br />
            <strong>E-posta:</strong> <a href="mailto:muhristan@gmail.com" style={{ color: 'var(--gold)' }}>muhristan@gmail.com</a><br />
            <strong>Telefon / WhatsApp:</strong> 0542 790 68 63
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>2. Ürün / Hizmet Bilgileri ve Fiyatlandırma</h2>
          <p className={s.text}>
            Siparişe konu ürün veya hizmetin temel nitelikleri, miktarı, vergiler dahil toplam satış fiyatı ve kargo bedelleri sipariş onayından önce tüketiciye gösterilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>3. Ödeme, Teslimat ve İfa</h2>
          <p className={s.text}>
            Ödeme, sitede sunulan güvenli yöntemlerle (Kredi Kartı / Havale / Kapıda Ödeme) yapılır. Fiziksel ürünler belirtilen teslimat adresine gönderilir. Kişiye özel ürünlerde hazırlık süresi sipariş öncesi bildirilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>4. Cayma Hakkı ve İstisnaları</h2>
          <p className={s.text}>
            Tüketici 14 gün içinde cayma hakkına sahiptir. Ancak kişiye özel olarak hazırlanan tılsımlı ürünlerde mevzuattaki cayma hakkı istisnaları uygulanabilir. Ayrıca Muhristan ek olarak ödeme sonrası <strong>1 saatlik hızlı sipariş iptali</strong> seçeneği sunmaktadır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>5. Şikâyet ve Uyuşmazlık Çözümü</h2>
          <p className={s.textSecondary}>
            Tüketiciler şikâyetlerini satıcı iletişim kanallarına iletebilir. Uyuşmazlık halinde Tüketici Hakem Heyetleri ve Tüketici Mahkemelerine başvurulabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
