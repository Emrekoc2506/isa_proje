import { FiRefreshCw, FiShield, FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

const steps = [
  { Icon: FiClock, title: '1. İlk 1 Saat İçinde İptal', text: 'Hazırlık başlamadan önce WhatsApp veya e-posta ile anında iptal talebi iletin.' },
  { Icon: FiAlertCircle, title: '2. İade Talebi Oluşturun', text: 'Müşteri hizmetlerimize e-posta veya WhatsApp ile talebinizi iletin.' },
  { Icon: FiRefreshCw, title: '3. Güvenli Gönderim', text: 'Onaylanan iadeleri anlaşmalı kargo firmamızla ücretsiz/uygun koşullarda gönderin.' },
  { Icon: FiShield, title: '4. Kesintisiz Ücret İadesi', text: 'Ürün kontrolü sonrası ücret iadesi ek masraf yüklenmeden kartınıza yapılır.' },
];

export default function IadeSikayetPage() {
  return (
    <div className={s.page}>
      <SEO
        title="İade ve İptal Şartları | Muhristan"
        description="Muhristan iade, 1 saatlik sipariş iptal hakkı, 14 gün cayma hakkı ve değişim koşulları."
        canonical="https://muhristan.com/iade-sikayet"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>İade & Şikayetler</h1>
          <p className={s.heroSubtitle}>
            Memnuniyetiniz bizim için çok önemli. İade, iptal ve şikayet süreçlerimiz şeffaf ve hızlıdır.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>İade ve İptal Adımları</h2>
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
          <h2 className={s.sectionTitle}>1 Saatlik Hızlı İptal İmkânı</h2>
          <p className={s.text}>
            Muhristan, ödeme işleminin tamamlanmasından itibaren <strong>1 saat içerisinde</strong> sipariş henüz kişiselleştirme veya üretim sürecine alınmamışsa sipariş iptal talebinde bulunma imkânı sağlar.
          </p>
          <p className={s.textSecondary}>
            İptal bildirimini <strong>0542 790 68 63 (WhatsApp)</strong> veya <strong>muhristan@gmail.com</strong> adresinden iletebilirsiniz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>14 Günlük Cayma Hakkı</h2>
          <p className={s.text}>
            Tüketicinin Korunması Hakkında Kanun uyarınca, 14 gün içerisinde gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz. Kişiye özel tılsım, yüzük ve özel hazırlanan ürünlerde cayma hakkı istisnaları uygulanabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
