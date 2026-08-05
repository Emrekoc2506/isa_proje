import { FiFileText, FiShoppingCart, FiUserCheck, FiAlertTriangle } from 'react-icons/fi';
import s from './StaticPage.module.css';

export default function KullanimKosullariPage() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Kullanım Koşulları</h1>
          <p className={s.heroSubtitle}>
            Sitemizi kullanmadan önce lütfen kullanım koşullarını dikkatlice okuyun.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiFileText style={{ marginRight: 8 }} /> Genel Hükümler</h2>
          <p className={s.text}>
            Bu kullanım koşulları, Mysticvelora web sitesini ziyaret eden tüm kullanıcılar için geçerlidir. 
            Siteyi kullanarak aşağıda belirtilen koşulları kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız, 
            lütfen sitemizi kullanmayınız.
          </p>
          <p className={s.textSecondary}>
            Mysticvelora, bu kullanım koşullarını önceden bildirim yapmaksızın değiştirme hakkını saklı tutar. 
            Değişiklikler sitede yayınlandığı anda yürürlüğe girer. Sitemizi düzenli olarak ziyaret ederek 
            güncel koşulları kontrol etmeniz önerilir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiShoppingCart style={{ marginRight: 8 }} /> Sipariş ve Sözleşme</h2>
          <p className={s.text}>
            Sipariş verdiğinizde, ürün açıklamaları, fiyatlar ve teslimat bilgilerini doğrulamanız gerekmektedir. 
            Siparişinizin onaylanması, bir bağlayıcı sözleşme niteliği taşır. Mysticvelora, siparişinizi onaylama 
            veya reddetme hakkını saklı tutar.
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>Tüm siparişler stok durumuna bağlıdır.</li>
            <li className={s.listItem}>Fiyatlar önceden bildirilmeksizin değiştirilebilir.</li>
            <li className={s.listItem}>Sipariş onayı e-posta ile bildirilir.</li>
            <li className={s.listItem}>Sözleşme, siparişin onaylanmasıyla kurulmuş sayılır.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiUserCheck style={{ marginRight: 8 }} /> Hesap Güvenliği</h2>
          <p className={s.text}>
            Hesap oluşturduğunuzda, hesap bilgilerinizin gizliliğinden ve hesabınız altında gerçekleşen tüm 
            işlemlerden siz sorumlusunuz. Şifrenizi güvende tutmak ve hesabınıza yetkisiz erişimi önlemek 
            için gerekli önlemleri almalısınız.
          </p>
          <p className={s.textSecondary}>
            Hesabınızda yetkisiz kullanım fark ederseniz, derhal müşteri hizmetlerimizi bilgilendirmelisiniz. 
            Mysticvelora, yetkisiz kullanımdan kaynaklanan kayıplardan sorumlu değildir.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiAlertTriangle style={{ marginRight: 8 }} /> Sorumluluk Reddi</h2>
          <p className={s.text}>
            Mysticvelora, ürünlerimizin ezoterik ve spiritüel amaçlı olduğunu, tıbbi tedavi veya teşhis 
            amacı taşımadığını belirtir. Ürünlerimiz hakkında yapılan açıklamalar, kişisel deneyimlere 
            dayanmaktadır ve herhangi bir tıbbi iddia olarak değerlendirilmemelidir.
          </p>
          <ul className={s.list}>
            <li className={s.listItem}>Ürün açıklamaları bilgilendirme amaçlıdır.</li>
            <li className={s.listItem}>Web sitesi kesintisiz hizmet garantisi vermez.</li>
            <li className={s.listItem}>Üçüncü taraf bağlantılarının içeriğinden sorumlu değiliz.</li>
            <li className={s.listItem}>Mücbir sebeplerden kaynaklanan gecikmelerde sorumluluk kabul edilmez.</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Fikri Mülkiyet Hakları</h2>
          <p className={s.text}>
            Sitede yer alan tüm içerik (metin, görsel, logo, grafik, yazılım) Mysticvelora'ya aittir ve 
            telif hakkı yasaları ile korunmaktadır. İçeriklerin izinsiz kopyalanması, dağıtılması veya 
            ticari amaçla kullanılması yasaktır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Uyuşmazlıkların Çözümü</h2>
          <p className={s.text}>
            Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir. Ortaya çıkabilecek uyuşmazlıkların 
            çözümünde öncelikle müşteri hizmetlerimizle iletişime geçilmesi, çözüm sağlanamaması durumunda 
            İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
          <p className={s.textSecondary}>
            Tüketici uyuşmazlıklarında, Tüketici Hakem Heyeti'ne başvuru hakkınız saklıdır.
          </p>
        </div>

        <div className={s.section}>
          <p className={s.textSecondary} style={{ textAlign: 'center' }}>
            Son güncelleme: 2026 &bull; Mysticvelora &bull; Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
