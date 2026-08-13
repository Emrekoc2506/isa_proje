import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';
import { FiRefreshCw, FiShield, FiAlertCircle, FiCheck, FiClock, FiTruck } from 'react-icons/fi';

const steps = [
  { Icon: FiClock, title: '1. İlk 1 Saat İçinde İptal', text: 'Hazırlık başlamadan önce WhatsApp veya e-posta ile anında iptal talebi verin.' },
  { Icon: FiAlertCircle, title: '2. İade / Bildirim Talebi', text: 'Cayma hakkınız veya ürün durumu ile ilgili bizimle iletişime geçin.' },
  { Icon: FiRefreshCw, title: '3. Güvenli Kargo Gönderimi', text: 'Onaylanan iadeleri anlaşmalı kargo firmamız ile tarafımıza ulaştırın.' },
  { Icon: FiShield, title: '4. Kesintisiz Ücret İadesi', text: 'Geri ödemeler aynı ödeme aracınıza ek masraf yüklenmeden aktarılır.' },
];

export default function GarantiIptalPage() {
  return (
    <div className={s.page}>
      <SEO
        title="Garanti ve İptal Şartları | Muhristan"
        description="Muhristan garanti, 1 saatlik sipariş iptal hakkı, 14 gün cayma hakkı ve iade koşulları."
        canonical="https://muhristan.com/garanti-ve-iptal"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Garanti ve İptal Şartları</h1>
          <p className={s.heroSubtitle}>
            Sipariş iptali, 14 günlük cayma hakkı ve iade süreçlerimiz hakkında tüm detaylar.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Süreç Özeti</h2>
          <div className={s.grid}>
            {steps.map(({ Icon, title, text }) => (
              <div key={title} className={s.card}>
                <span className={s.cardIcon}><Icon /></span>
                <h3 className={s.cardTitle}>{title}</h3>
                <p className={s.cardText}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={s.section} style={{ borderColor: 'var(--gold-light)' }}>
          <h2 className={s.sectionTitle}>Sipariş İptal Koşulları (1 Saatlik Hızlı İptal)</h2>
          <p className={s.text}>
            Muhristan, ödeme işleminin tamamlanmasından itibaren <strong>1 saat içerisinde</strong>, sipariş henüz geri döndürülemeyecek şekilde üretim, kişiselleştirme veya hizmet ifası aşamasına alınmamışsa sipariş iptal talebinde bulunma imkânı sağlamaktadır.
          </p>
          <p className={s.textSecondary}>
            İptal talebinizi <strong>WhatsApp (0542 790 68 63)</strong> veya <strong>e-posta (info@muhristan.com)</strong> üzerinden bize iletebilirsiniz. Bu 1 saatlik imkân, tüketicinin kanuni cayma hakkını kısıtlamaz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Cayma Hakkı ve Kullanımı</h2>
          <p className={s.text}>
            Tüketici, mesafeli sözleşmelerde malın tesliminden itibaren <strong>14 gün içerisinde</strong> herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir.
          </p>
          <p className={s.textSecondary}>
            Cayma bildiriminizi e-posta (<a href="mailto:info@muhristan.com" style={{ color: 'var(--gold)' }}>info@muhristan.com</a>) veya WhatsApp üzerinden iletebilirsiniz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Kişiye Özel Ürünler ve İstisnalar</h2>
          <p className={s.text}>
            Tüketicinin özel istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan kişiye özel tasarım yüzükler, kişiselleştirilmiş kolyeler, mühürler, özel ölçü ve isim içeren ürünlerde mevzuat gereği cayma hakkı istisnası uygulanabilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Kargo ve Hasar Kontrolü</h2>
          <p className={s.text}>
            Kargo teslimatı sırasında pakette belirgin ezilme, yırtılma veya hasar varsa kargo görevlisiyle birlikte hasar tutanağı tutulması önerilir. Teslimat sonrasında fark edilen ayıplı durumlarda fotoğraf veya video ile tarafımıza başvurabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
