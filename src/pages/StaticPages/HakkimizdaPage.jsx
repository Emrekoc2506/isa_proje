import { FiStar, FiHeart, FiShield, FiAward } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import s from './StaticPage.module.css';

const values = [
  { Icon: FiStar, title: 'Ezoterik Bilgelik', text: 'Yüzyıllardır süregelen ezoterik bilgiyi modern dünyayla buluşturuyor, her ürünün arkasındaki kadim hikayeyi sizlere aktarıyoruz.' },
  { Icon: FiHeart, title: 'Yüksek Kalite', text: 'Tüm ürünlerimiz özenle seçilir, en saf ve doğal içeriklerle hazırlanır. Kalitemizden asla ödün vermeyiz.' },
  { Icon: FiShield, title: 'Güvenilirlik', text: 'Müşteri memnuniyeti odaklı hizmet anlayışımızla, her alışverişinizde güven ve huzur içinde olmanızı sağlıyoruz.' },
  { Icon: FiAward, title: 'Özgünlük', text: 'Her bir ürünümüz özgün ve benzersizdir. Ruhsal yolculuğunuzda size eşlik edecek en özel ürünleri sunuyoruz.' },
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
            Özel tasarım ürünleri, kişiye özel mühürleri ve geleneksel el sanatlarını herkes için erişilebilir kılmak, doğal ve kaliteli ürünlerle müşteri memnuniyetini en üst düzeyde tutmak.
          </p>
          <h3 className={s.sectionSubtitle}>Vizyonumuz</h3>
          <p className={s.textSecondary}>
            Türkiye'nin en güvenilir ve kaliteli özel tasarım alışveriş platformu olmak, el sanatları ve mühür kültürünü modern dünyayla buluşturmak.
          </p>
        </div>
      </div>
    </div>
  );
}
