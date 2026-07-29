import { FiTruck, FiPackage, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import s from './StaticPage.module.css';

const features = [
  { Icon: FiTruck, title: 'Hızlı Kargo', text: 'Siparişleriniz en geç 1-3 iş günü içerisinde kargoya teslim edilir.' },
  { Icon: FiPackage, title: 'Güvenli Paketleme', text: 'Tüm ürünleriniz özel koruyucu malzemelerle özenle paketlenir.' },
  { Icon: FiCreditCard, title: 'Güvenli Ödeme', text: '256-bit SSL sertifikası ile ödemeleriniz %100 güvende.' },
  { Icon: FiCheckCircle, title: 'Kolay İade', text: 'Memnun kalmazsanız 14 gün içinde kolayca iade edin.' },
];

export default function KargoTeslimatPage() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Kargo & Teslimat</h1>
          <p className={s.heroSubtitle}>
            Siparişleriniz en hızlı ve güvenli şekilde kapınıza kadar geliyor.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Teslimat Süreci</h2>
          <p className={s.text}>
            Siparişiniz onaylandıktan sonra en geç <strong style={{ color: 'var(--gold-light)' }}>1-3 iş günü</strong> içerisinde kargoya teslim edilir. 
            Kargo firması, teslimat sürecinde size SMS ve e-posta yoluyla bilgilendirme yapar.
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>Sipariş onayı anında e-posta olarak gönderilir.</li>
            <li className={s.listItem}>Kargo takip numaranız SMS ve e-posta ile paylaşılır.</li>
            <li className={s.listItem}>Teslimat genellikle 2-5 iş günü içinde tamamlanır.</li>
            <li className={s.listItem}>Kurye teslimat öncesi sizi arayarak bilgilendirir.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Kargo Ücretleri</h2>
          <div className={s.grid}>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Standart Teslimat</h3>
              <p className={s.cardText} style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold-light)', margin: '12px 0' }}>49.90 ₺</p>
              <p className={s.cardText}>2-5 iş günü içinde teslimat</p>
            </div>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Ücretsiz Kargo</h3>
              <p className={s.cardText} style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold-light)', margin: '12px 0' }}>0 ₺</p>
              <p className={s.cardText}>500 ₺ ve üzeri alışverişlerde ücretsiz kargo</p>
            </div>
            <div className={s.card}>
              <h3 className={s.cardTitle}>Hızlı Teslimat</h3>
              <p className={s.cardText} style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold-light)', margin: '12px 0' }}>79.90 ₺</p>
              <p className={s.cardText}>1-2 iş günü içinde teslimat</p>
            </div>
          </div>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Özelliklerimiz</h2>
          <div className={s.grid}>
            {features.map(({ Icon, title, text }) => (
              <div key={title} className={s.card}>
                <span className={s.cardIcon}><Icon /></span>
                <h3 className={s.cardTitle}>{title}</h3>
                <p className={s.cardText}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Sıkça Sorulan Sorular</h2>

          <h3 className={s.sectionSubtitle}>Kargomu nasıl takip edebilirim?</h3>
          <p className={s.textSecondary}>
            Siparişiniz kargoya verildiğinde e-posta adresinize ve telefonunuza gönderilen kargo takip numarası ile 
            kargo firmasının web sitesi veya mobil uygulaması üzerinden siparişinizi takip edebilirsiniz.
          </p>

          <h3 className={s.sectionSubtitle}>Teslimat adresini değiştirebilir miyim?</h3>
          <p className={s.textSecondary}>
            Siparişiniz kargoya verilmeden önce adres değişikliği yapabilirsiniz. Bunun için müşteri hizmetlerimizle 
            iletişime geçmeniz yeterlidir.
          </p>

          <h3 className={s.sectionSubtitle}>Kargo sırasında ürün hasar görürse ne yapmalıyım?</h3>
          <p className={s.textSecondary}>
            Kargo teslim anında paketin hasarlı olduğunu fark ederseniz, tutanak tutturun ve bizimle iletişime geçin. 
            En kısa sürede mağduriyetinizi gidereceğiz.
          </p>
        </div>
      </div>
    </div>
  );
}
