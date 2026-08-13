import { FiStar, FiHeart, FiShield, FiAward } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

const values = [
  { Icon: FiStar, title: 'Ezoterik Bilgelik', text: 'Yüzyıllardır süregelen ezoterik bilgiyi modern dünyayla buluşturuyor, her ürünün arkasındaki kadim hikayeyi sizlere aktarıyoruz.' },
  { Icon: FiHeart, title: 'Yüksek Kalite', text: 'Tüm ürünlerimiz özenle seçilir, en saf ve doğal içeriklerle hazırlanır. Kalitemizden asla ödün vermeyiz.' },
  { Icon: FiShield, title: 'Güvenilirlik', text: 'Müşteri memnuniyeti odaklı hizmet anlayışımızla, her alışverişinizde güven ve huzur içinde olmanızı sağlıyoruz.' },
  { Icon: FiAward, title: 'Özgünlük', text: 'Her bir ürünümüz özgün ve benzersizdir. Ruhsal yolculuğunuzda size eşlik edecek en özel ürünleri sunuyoruz.' },
];

const team = [
  { name: 'Elif Yıldız', role: 'Kurucu & Ezoterik Uzman', image: 'EL' },
  { name: 'Can Güneş', role: 'Ürün Geliştirme Müdürü', image: 'CG' },
  { name: 'Zehra Ay', role: 'Müşteri Deneyimi Yöneticisi', image: 'ZA' },
  { name: 'Mert Taş', role: 'Lojistik & Operasyon', image: 'MT' },
];

export default function HakkimizdaPage() {
  return (
    <div className={s.page}>
      <SEO 
        title="Hakkımızda | Muhristan"
        description="Muhristan hakkında bilgi edinin. Özel tasarım takılar, kişiye özel mühür çalışmaları ve el sanatları mirasımız hakkında detaylar."
        canonical="https://muhristan.com/hakkimizda"
      />
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Hakkımızda</h1>
          <p className={s.heroSubtitle}>
            Ezoterizmin büyülü dünyasını keşfe çıkın. Muhristan olarak, ruhsal yolculuğunuzda size eşlik etmekten gurur duyuyoruz.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Biz Kimiz?</h2>
          <p className={s.text}>
            Muhristan, 2020 yılında ezoterik bilgiye ve doğal ürünlere olan tutkuyla kuruldu. Amacımız, binlerce yıllık kadim bilgelikleri 
            modern yaşamla buluşturarak, ruhsal farkındalık ve içsel dönüşüm yolculuğunda size rehberlik etmek.
          </p>
          <p className={s.textSecondary}>
            Uçucu yağlardan doğal taşlara, tütsülerden kristallere, tarot kartlarından şifa çaylarına kadar geniş ürün yelpazemizle, 
            her bireyin kendine özgü enerjisine hitap eden ürünler sunuyoruz. Her bir ürün, özenle seçilir ve en yüksek kalite standartlarında sizlere ulaştırılır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Değerlerimiz</h2>
          <div className={s.grid}>
            {values.map(({ Icon, title, text }) => (
              <div key={title} className={s.card}>
                <span className={s.cardIcon}><Icon /></span>
                <h3 className={s.cardTitle}>{title}</h3>
                <p className={s.cardText}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Misyonumuz & Vizyonumuz</h2>
          <h3 className={s.sectionSubtitle}>Misyonumuz</h3>
          <p className={s.text}>
            Ezoterik ürünleri ve bilgiyi herkes için erişilebilir kılmak, doğal ve etik kaynaklardan temin edilmiş 
            yüksek kaliteli ürünlerle ruhsal yolculuğunuzu desteklemek.
          </p>
          <h3 className={s.sectionSubtitle}>Vizyonumuz</h3>
          <p className={s.textSecondary}>
            Türkiye'nin en güvenilir ezoterik alışveriş platformu olmak, kadim bilgelikleri modern dünyaya taşıyarak 
            daha bilinçli ve farkındalıklı bir toplum oluşumuna katkı sağlamak.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Ekibimiz</h2>
          <div className={s.grid}>
            {team.map(({ name, role, image }) => (
              <div key={name} className={s.card}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)', fontSize: 24, fontWeight: 700, color: 'var(--bg-deep)' }}>
                  {image}
                </div>
                <h3 className={s.cardTitle}>{name}</h3>
                <p className={s.cardText}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
