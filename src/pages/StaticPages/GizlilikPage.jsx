import { FiLock, FiEye, FiDatabase, FiMail } from 'react-icons/fi';
import s from './StaticPage.module.css';

export default function GizlilikPage() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>Gizlilik Politikası</h1>
          <p className={s.heroSubtitle}>
            Kişisel verilerinizin güvenliği bizim için en önemli önceliktir.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiLock style={{ marginRight: 8 }} /> Veri Güvenliği</h2>
          <p className={s.text}>
            Mysticvelora olarak, kişisel verilerinizin güvenliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması 
            Kanunu'na (KVKK) tam uyumlulukla hareket ediyor, verilerinizi en üst düzeyde koruyoruz.
          </p>
          <p className={s.textSecondary}>
            Web sitemiz 256-bit SSL sertifikası ile korunmaktadır. Tüm ödeme işlemleri PCI DSS standartlarına uygun 
            olarak gerçekleştirilir. Kredi kartı bilgileriniz sistemimizde saklanmaz, yalnızca ödeme anında kullanılır.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiDatabase style={{ marginRight: 8 }} /> Toplanan Bilgiler</h2>
          <p className={s.text}>Size daha iyi hizmet verebilmek için aşağıdaki bilgileri toplayabiliriz:</p>
          <ul className={s.list}>
            <li className={s.listItem}>Ad, soyad, e-posta adresi, telefon numarası</li>
            <li className={s.listItem}>Teslimat ve fatura adresi bilgileri</li>
            <li className={s.listItem}>Sipariş geçmişi ve alışveriş alışkanlıkları</li>
            <li className={s.listItem}>IP adresi, tarayıcı bilgileri ve çerez verileri</li>
            <li className={s.listItem}>Ödeme yöntemi tercihleri (kart bilgileri saklanmaz)</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiEye style={{ marginRight: 8 }} /> Bilgilerin Kullanımı</h2>
          <p className={s.text}>Topladığımız bilgiler aşağıdaki amaçlarla kullanılır:</p>
          <ul className={s.list}>
            <li className={s.listItem}>Siparişlerinizin işlenmesi ve teslimatı</li>
            <li className={s.listItem}>Müşteri hizmetleri ve destek sağlanması</li>
            <li className={s.listItem}>Hesap güvenliğinin sağlanması</li>
            <li className={s.listItem}>Kişiselleştirilmiş alışveriş deneyimi sunulması</li>
            <li className={s.listItem}>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}><FiMail style={{ marginRight: 8 }} /> İletişim İzinleri</h2>
          <p className={s.text}>
            Kayıt sırasında veya alışveriş esnasında vermiş olduğunuz onay doğrultusunda, size özel teklifler, 
            kampanyalar ve yenilikler hakkında e-posta gönderebiliriz. İstediğiniz zaman bu e-postaların altındaki 
            "abonelikten çık" bağlantısını kullanarak veya müşteri hizmetlerimize başvurarak bu iletişimi durdurabilirsiniz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Çerez Politikası</h2>
          <p className={s.text}>
            Web sitemiz, kullanıcı deneyimini iyileştirmek ve site trafiğini analiz etmek için çerezler (cookies) kullanmaktadır. 
            Çerez kullanımını tarayıcı ayarlarınızdan kontrol edebilir veya tamamen devre dışı bırakabilirsiniz.
          </p>
          <p className={s.textSecondary}>
            Detaylı bilgi için Çerez Politikamızı inceleyebilirsiniz.
          </p>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Haklarınız</h2>
          <p className={s.text}>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className={s.list}>
            <li className={s.listItem}>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li className={s.listItem}>Kişisel verileriniz hakkında bilgi talep etme</li>
            <li className={s.listItem}>Kişisel verilerinizin düzeltilmesini isteme</li>
            <li className={s.listItem}>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
            <li className={s.listItem}>Kişisel verilerinizin üçüncü kişilere aktarılmamasını isteme</li>
          </ul>
          <p className={s.textSecondary}>
            Haklarınızı kullanmak için <strong style={{ color: 'var(--gold-light)' }}>info@mysticvelora.com</strong> adresine e-posta gönderebilirsiniz.
          </p>
        </div>

        <div className={s.section}>
          <p className={s.textSecondary}>
            Son güncelleme: 2026. Bu gizlilik politikası önceden bildirilmeksizin değiştirilebilir. Güncellemeler web sitemizde 
            yayınlandığı anda yürürlüğe girer.
          </p>
        </div>
      </div>
    </div>
  );
}
