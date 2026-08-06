import { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import s from './StaticPage.module.css';

const contactDetails = [
  { Icon: FiMapPin, title: 'Adresimiz', text: ['İnönü Mahallesi, Çiçek Sokak No:42', 'Kadıköy / İstanbul'] },
  { Icon: FiPhone, title: 'Telefon', text: ['+90 (216) 555 11 22', '+90 (532) 111 22 33'] },
  { Icon: FiMail, title: 'E-posta', text: ['info@muhristan.com', 'destek@muhristan.com'] },
  { Icon: FiClock, title: 'Çalışma Saatleri', text: ['Hafta içi: 09:00 - 18:00', 'Cumartesi: 10:00 - 16:00'] },
];

export default function IletisimPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>İletişim</h1>
          <p className={s.heroSubtitle}>
            Sorularınız, önerileriniz veya merak ettikleriniz için bize ulaşın. Sizden haber almak bizi mutlu eder.
          </p>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Bize Yazın</h2>
          {sent ? (
            <p style={{ color: 'var(--gold-light)', fontSize: 'var(--text-lg)', textAlign: 'center', padding: '40px 0' }}>
              Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
            </p>
          ) : (
            <form className={s.contactForm} onSubmit={handleSubmit}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Adınız Soyadınız</label>
                <input className={s.formInput} type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Adınız ve soyadınız" />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>E-posta Adresiniz</label>
                <input className={s.formInput} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="ornek@email.com" />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Konu</label>
                <input className={s.formInput} type="text" name="subject" value={form.subject} onChange={handleChange} required placeholder="Mesajınızın konusu" />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Mesajınız</label>
                <textarea className={s.formTextarea} name="message" value={form.message} onChange={handleChange} required placeholder="Mesajınızı buraya yazın..." />
              </div>
              <button type="submit" className={s.formBtn}>Mesajı Gönder</button>
            </form>
          )}
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>İletişim Bilgilerimiz</h2>
          <div className={s.contactInfo}>
            {contactDetails.map(({ Icon, title, text }) => (
              <div key={title} className={s.contactItem}>
                <span className={s.contactItemIcon}><Icon /></span>
                <div>
                  <h4 className={s.contactItemTitle}>{title}</h4>
                  {text.map((line) => (
                    <p key={line} className={s.contactItemText}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionTitle}>Bizi Bulun</h2>
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-gold)', height: 400 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.0!2d29.0!3d41.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDAwJzAwLjAiTiAyOcKwMDAnMDAuMCJF!5e0!3m2!1str!2str!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(0.9) hue-rotate(300deg)' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Konum"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
