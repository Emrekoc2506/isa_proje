import { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import SEO from '../../components/SEO/SEO';
import { submitContactForm } from '../../services/authApi';
import FieldError, { getFieldAriaProps } from '../../components/common/FieldError';
import s from './StaticPage.module.css';

const contactDetails = [
  { Icon: FiMapPin, title: 'Adresimiz', text: ['Akpıyar Mahallesi, 4094. Sokak', 'Karaköprü / Şanlıurfa'] },
  { Icon: FiPhone, title: 'Telefon / WhatsApp', text: ['+90 (542) 790 68 63'] },
  { Icon: FiMail, title: 'E-posta', text: ['info@muhristan.com', 'destek@muhristan.com'] },
  { Icon: FiClock, title: 'Çalışma Saatleri', text: ['Hafta içi: 09:00 - 18:00', 'Cumartesi: 10:00 - 16:00'] },
];

export default function IletisimPage() {
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setFieldErrors({});
    setGeneralError('');

    // Basic client validation
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = ['Adınız ve soyadınız zorunludur.'];
    if (!form.email.trim()) errors.email = ['E-posta adresi zorunludur.'];
    if (!form.subject.trim()) errors.subject = ['Konu zorunludur.'];
    if (!form.message.trim()) errors.message = ['Mesaj zorunludur.'];

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await submitContactForm({
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        phone: form.phoneNumber.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ fullName: '', email: '', phoneNumber: '', subject: '', message: '' });
    } catch (err) {
      if (err.code === 'validation_error' || err.fieldErrors) {
        setFieldErrors(err.fieldErrors || {});
      } else {
        setGeneralError(err.message || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <SEO
        title="İletişim | Muhristan"
        description="Muhristan ile iletişime geçin. Sorularınız, sipariş takibi ve destek için bize ulaşın."
        canonical="https://muhristan.com/iletisim"
      />
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
            <form className={s.contactForm} onSubmit={handleSubmit} noValidate>
              {generalError && (
                <div style={{ color: '#dc2626', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }} role="alert">
                  {generalError}
                </div>
              )}

              <div className={s.formGroup}>
                <label className={s.formLabel} htmlFor="contact-fullName">Adınız Soyadınız *</label>
                <input
                  id="contact-fullName"
                  className={s.formInput}
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Adınız ve soyadınız"
                  disabled={loading}
                  {...getFieldAriaProps("contact-fullName", fieldErrors.fullName || fieldErrors.name)}
                />
                <FieldError error={fieldErrors.fullName || fieldErrors.name} id="contact-fullName-error" />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel} htmlFor="contact-email">E-posta Adresiniz *</label>
                <input
                  id="contact-email"
                  className={s.formInput}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="ornek@email.com"
                  disabled={loading}
                  {...getFieldAriaProps("contact-email", fieldErrors.email)}
                />
                <FieldError error={fieldErrors.email} id="contact-email-error" />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel} htmlFor="contact-phoneNumber">Telefon Numaranız</label>
                <input
                  id="contact-phoneNumber"
                  className={s.formInput}
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="05XX XXX XX XX"
                  disabled={loading}
                  {...getFieldAriaProps("contact-phoneNumber", fieldErrors.phoneNumber || fieldErrors.phone)}
                />
                <FieldError error={fieldErrors.phoneNumber || fieldErrors.phone} id="contact-phoneNumber-error" />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel} htmlFor="contact-subject">Konu *</label>
                <input
                  id="contact-subject"
                  className={s.formInput}
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="Mesajınızın konusu"
                  disabled={loading}
                  {...getFieldAriaProps("contact-subject", fieldErrors.subject)}
                />
                <FieldError error={fieldErrors.subject} id="contact-subject-error" />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel} htmlFor="contact-message">Mesajınız *</label>
                <textarea
                  id="contact-message"
                  className={s.formTextarea}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Mesajınızı buraya yazın..."
                  disabled={loading}
                  {...getFieldAriaProps("contact-message", fieldErrors.message)}
                />
                <FieldError error={fieldErrors.message} id="contact-message-error" />
              </div>

              <button type="submit" className={s.formBtn} disabled={loading}>
                {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
              </button>
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
