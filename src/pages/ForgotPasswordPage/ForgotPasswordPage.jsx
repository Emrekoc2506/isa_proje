import styles from '../EmailVerifyPage/EmailVerifyPage.module.css'; // Re-use styling
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiLoader } from 'react-icons/fi';
import { forgotPassword } from '../../services/authApi';
import logoImage from '../../assets/images/logo.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("Geçersiz e-posta formatı.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await forgotPassword(trimmedEmail);
      setSubmitted(true);
    } catch (err) {
      // Backend generic success or error. Task 4 says to always display the same success screen even if there is an error to hide email existence.
      // But if there's a validation error (like empty email), we show it.
      if (err.code === "validation_error") {
        setErrorMsg("Lütfen geçerli bir e-posta adresi girin.");
      } else {
        let errorMessage = err.message || "";
        if (err.errors) {
          errorMessage = Object.entries(err.errors)
            .map(([key, value]) => `${key}: ${value.join(', ')}`)
            .join(' | ');
          setErrorMsg(errorMessage);
        } else {
          setSubmitted(true); // Treat as success to keep secure
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      
      <div className={styles.wrapper}>
        <a href="/" className={styles.logoLink}>
          <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
          <span className={styles.brandName}>mysticvelora</span>
        </a>

        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {submitted ? (
            <div className={styles.content}>
              <FiMail className={styles.successIcon} style={{ fontSize: 56, color: 'var(--gold-light)' }} />
              <h2 className={styles.title}>Talep Gönderildi</h2>
              <p className={styles.sub}>
                Eğer bu e-posta adresi sistemimizde kayıtlı ise, şifrenizi sıfırlayabilmeniz için gerekli adımları içeren bir e-posta gönderilecektir. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.
              </p>
              <button onClick={() => navigate('/giris')} className={styles.btn}>
                Giriş Sayfasına Dön
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.content} style={{ width: '100%' }}>
              <FiLock className={styles.spinner} style={{ animation: 'none', fontSize: 56 }} />
              <h2 className={styles.title}>Şifremi Unuttum</h2>
              <p className={styles.sub}>Hesap e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>

              {errorMsg && (
                <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
                <FiMail style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-light)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={styles.btn}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}
              >
                {loading && <FiLoader className={styles.spinner} style={{ margin: 0, fontSize: 16 }} />}
                Sıfırlama Bağlantısı Gönder
              </button>

              <button type="button" onClick={() => navigate('/giris')} className={styles.btnOutline}>
                Geri Dön
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
