import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

export default function MesafeliSatisPage() {
  return (
    <div className={s.page}>
      <SEO
        title="Mesafeli Satış Sözleşmesi | Muhristan"
        description="Muhristan mesafeli satış sözleşmesi. Tarafların hak ve yükümlülükleri, 14 gün cayma hakkı ve 1 saatlik hızlı iptal koşulları."
        canonical="https://muhristan.com/mesafeli-satis-sozlesmesi"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Mesafeli Satış Sözleşmesi</h1>
          <p className={s.heroSubtitle}>
            Muhristan üzerinden gerçekleştirilen alışverişlere ilişkin yasal sözleşme ve şartlar.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 1 – Taraflar</h2>
          <h3 className={s.sectionSubtitle}>SATICI</h3>
          <p className={s.text}>
            <strong>İşletme Sahibi / Resmî Unvan:</strong> İsa Şahap<br />
            <strong>Marka:</strong> Muhristan<br />
            <strong>İşletme Türü:</strong> Şahıs İşletmesi<br />
            <strong>Vergi Numarası:</strong> 7890939339<br />
            <strong>Vergi Dairesi:</strong> Şehitlik Vergi Dairesi<br />
            <strong>Adres:</strong> Akpıyar Mahallesi, 4094. Sokak, Karaköprü / Şanlıurfa<br />
            <strong>E-posta:</strong> <a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a><br />
            <strong>Telefon / WhatsApp:</strong> 0542 790 68 63
          </p>

          <h3 className={s.sectionSubtitle}>ALICI</h3>
          <p className={s.textSecondary}>
            Muhristan internet sitesi üzerinden sipariş veren ve işbu sözleşmeyi elektronik ortamda onaylayan gerçek veya tüzel kişidir. ALICI'nın sipariş sırasında sisteme girmiş olduğu ad, soyad veya unvan, telefon numarası, e-posta adresi, teslimat adresi, fatura bilgileri ve diğer sipariş bilgileri işbu sözleşmenin ve sipariş kayıtlarının ayrılmaz parçasıdır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 2 – Sözleşmenin Konusu</h2>
          <p className={s.text}>
            İşbu Mesafeli Satış Sözleşmesi'nin konusu, ALICI'nın Muhristan internet sitesi üzerinden elektronik ortamda sipariş verdiği özel tasarım takı, mühür, aksesuar ve el sanatları ürünlerinin satışı, hazırlanması, ifası ve/veya teslimine ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.
          </p>
          <p className={s.textSecondary}>
            İşbu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun, Mesafeli Sözleşmeler Yönetmeliği ve yürürlükte bulunan ilgili mevzuat hükümleri çerçevesinde uygulanır. Muhristan bünyesinde sunulan bazı ürün ve çalışmalar, ALICI'nın talebi ve kişisel ihtiyaçları doğrultusunda kişiye özel olarak hazırlanabilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 3 – Ürün, Hizmet ve Sipariş Bilgileri</h2>
          <p className={s.text}>Siparişe konu ürün veya hizmetin;</p>
          <ul className={s.list}>
            <li className={s.listItem}>Temel nitelikleri, türü ve miktarı</li>
            <li className={s.listItem}>Varsa kişiselleştirme bilgileri</li>
            <li className={s.listItem}>Vergiler dahil satış bedeli ve kargo masrafları</li>
            <li className={s.listItem}>Ödeme yöntemi ve teslimat / ifa bilgileri</li>
            <li className={s.listItem}>Varsa hazırlanma ve tahmini teslimat süresi</li>
          </ul>
          <p className={s.textSecondary}>
            sipariş oluşturulmadan önce ALICI'ya internet sitesi üzerinden gösterilir. Sipariş özeti, ön bilgilendirme metni ve elektronik kayıtlar işbu sözleşmenin ayrılmaz parçasıdır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 4 – Ön Bilgilendirme ve Sözleşmenin Kurulması</h2>
          <p className={s.text}>
            ALICI, sipariş vermeden önce ürün veya hizmetin temel nitelikleri, toplam fiyatı, ödeme ve teslimat koşulları, cayma hakkı ve cayma hakkının kullanılamayacağı durumlar hakkında elektronik ortamda bilgilendirilir. ALICI, siparişin ödeme yükümlülüğü doğurduğunu kabul ederek siparişini onaylar.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 5 & 6 – Hak ve Yükümlülükler</h2>
          <h3 className={s.sectionSubtitle}>SATICI'nın Yükümlülükleri</h3>
          <p className={s.text}>
            SATICI; siparişi özenle hazırlamak, kişiye özel ürünleri ALICI'nın verdiği bilgiler doğrultusunda üretmek, uygun paketleme yapmak ve tüketicinin kanuni haklarına riayet etmekle yükümlüdür.
          </p>
          <h3 className={s.sectionSubtitle}>ALICI'nın Yükümlülükleri</h3>
          <p className={s.textSecondary}>
            ALICI; sipariş esnasında verdiği bilgilerin doğruluğunu, kişiselleştirme verilerinin kendi sorumluluğunda olduğunu ve siparişe ilişkin ödeme yükümlülüğünü yerine getireceğini kabul eder.
          </p>
        </div>

        <div className={s.section} style={{ borderColor: 'var(--gold-light)' }}>
          <h2 className={s.sectionTitle}>Madde 7 – Kargo ve İade Koşulları</h2>
          <p className={s.text}>
            <strong>Anlaşmalı İade Kargo Firması:</strong> Yurtiçi Kargo<br />
            <strong>Sabit Kargo Ücreti:</strong> 170.00 TL<br />
            ALICI, cayma hakkını kullandığı takdirde ürünleri SATICI'nın belirlediği anlaşmalı kargo firması vasıtasıyla ücretsiz veya sözleşmede belirtilen kargo şartlarıyla iade etmekle yükümlüdür.
          </p>
        </div>

        <div className={s.section} style={{ borderColor: 'var(--gold-light)' }}>
          <h2 className={s.sectionTitle}>Madde 8 – Muhristan'ın Sunduğu 1 Saatlik İptal İmkânı</h2>
          <p className={s.text}>
            SATICI, ALICI'ya ödeme işleminin tamamlanmasından itibaren <strong>1 saat içerisinde</strong>, sipariş henüz üretim, kişiselleştirme veya hizmetin ifası aşamasına alınmamışsa sipariş iptali talebinde bulunma imkânı sağlar.
          </p>
          <p className={s.textSecondary}>
            İptal talebininin <strong>WhatsApp (0542 790 68 63)</strong> veya <strong>e-posta (info@muhristan.com)</strong> üzerinden iletilmesi gerekir. Bu 1 saatlik iptal imkânı, tüketicinin kanuni 14 günlük cayma hakkını kısıtlamaz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 9 & 10 – Cayma Hakkı ve İstisnaları</h2>
          <p className={s.text}>
            Tüketici, 14 gün içerisinde gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir.
          </p>
          <h3 className={s.sectionSubtitle}>Kişiye Özel Ürün İstisnası</h3>
          <p className={s.textSecondary}>
            Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak hazırlanan kişiye özel tasarım yüzükler, mühürler, özel isim/harf işlenmiş kolyeler ve kişiselleştirilmiş ürünlerde mevzuat gereği cayma hakkı istisnası uygulanabilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Madde 19 & 20 – Uyuşmazlıklar ve Yürürlük</h2>
          <p className={s.text}>
            Uyuşmazlık durumunda parateller çerçevesinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. İşbu sözleşme elektronik ortamda onaylanmasıyla yürürlüğe girer.
          </p>
        </div>
      </div>
    </div>
  );
}
