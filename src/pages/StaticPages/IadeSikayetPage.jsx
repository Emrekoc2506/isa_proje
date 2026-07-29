import { FiRefreshCw, FiShield, FiAlertCircle, FiCheck } from 'react-icons/fi';
import s from './StaticPage.module.css';

const steps = [
  { Icon: FiAlertCircle, title: '1. Talebinizi Oluşturun', text: 'İade veya şikayetinizi müşteri hizmetlerimize bildirin.' },
  { Icon: FiCheck, title: '2. Onay Alın', text: 'Ekibimiz talebinizi değerlendirir ve size dönüş yapar.' },
  { Icon: FiRefreshCw, title: '3. Ürünü Gönderin', text: 'Onay sonrası ürünü anlaşmalı kargo ile gönderin.' },
  { Icon: FiShield, title: '4. Geri Ödeme', text: 'Ürün incelendikten sonra ödemeniz 3-5 iş günü içinde iade edilir.' },
];

export default function IadeSikayetPage() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>İade & Şikayetler</h1>
          <p className={s.heroSubtitle}>
            Memnuniyetiniz bizim için çok önemli. İade ve şikayet süreçlerimiz şeffaf ve hızlıdır.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>İade Koşulları</h2>
          <p className={s.text}>
            Satın aldığınız ürünlerden memnun kalmazsanız, teslimat tarihinden itibaren <strong style={{ color: 'var(--gold-light)' }}>14 (on dört) gün</strong> içinde 
            koşulsuz iade hakkınız bulunmaktadır. İade edilecek ürünlerin kullanılmamış, hasar görmemiş ve orijinal ambalajında olması gerekmektedir.
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>İade talebinizi 14 gün içinde bildirmelisiniz.</li>
            <li className={s.listItem}>Ürün orijinal ambalajında ve kullanılmamış olmalıdır.</li>
            <li className={s.listItem}>Fatura veya sipariş numarası gereklidir.</li>
            <li className={s.listItem}>Kargo ücreti tarafımızdan karşılanır.</li>
            <li className={s.listItem}>İade edilen ürünler 7 gün içinde incelenir.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>İade Süreci</h2>
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

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Geri Ödeme Bilgileri</h2>
          <p className={s.text}>
            İade edilen ürünler tarafımıza ulaştıktan sonra <strong style={{ color: 'var(--gold-light)' }}>3-5 iş günü</strong> içinde 
            ödemeniz iade edilir. Geri ödeme, siparişte kullandığınız ödeme yöntemine göre yapılır:
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>Kredi kartı ile yapılan ödemelerde iade, kartınıza yapılır (banka sürecine bağlı olarak 7-10 iş günü sürebilir).</li>
            <li className={s.listItem}>Havale/EFT ile yapılan ödemelerde iade, banka hesabınıza yapılır.</li>
            <li className={s.listItem}>Kapıda ödeme ile yapılan alışverişlerde iade, IBAN numaranıza yapılır.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>İade Edilemeyecek Ürünler</h2>
          <p className={s.textSecondary}>
            Aşağıdaki ürün grupları hijyen ve yasal düzenlemeler gereği iade edilemez:
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>Açılmış uçucu yağlar ve esanslar</li>
            <li className={s.listItem}>Kişisel bakım ürünleri (kullanılmışsa)</li>
            <li className={s.listItem}>Özel sipariş ve kişiselleştirilmiş ürünler</li>
            <li className={s.listItem}>Dijital ürünler ve hediye kartları</li>
            <li className={s.listItem}>İndirimli ve outlet ürünler (belirtilen durumlarda)</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Şikayet Süreci</h2>
          <p className={s.text}>
            Herhangi bir olumsuz durumda, şikayetinizi destek ekibimize iletebilirsiniz. Şikayetleriniz en kısa sürede 
            değerlendirilir ve tarafınıza dönüş yapılır.
          </p>
          <p className={s.textSecondary}>
            Şikayetlerinizi <strong style={{ color: 'var(--gold-light)' }}>destek@mysticvelora.com</strong> adresine e-posta göndererek veya 
            İletişim sayfamızdaki formu kullanarak iletebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
