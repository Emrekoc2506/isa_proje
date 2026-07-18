import styles from './EmailVerifyPage.module.css'; // Reuse verify styles
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { resendVerification } from '../../services/authApi';
import logoImage from '../../assets/images/logo.png';

export default function EmailWaitingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer efekti
  useState(() => {
    // initialize cooldown if needed
  });

  // Cooldown geri sayım logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      setErrorMsg("E-posta adresi bulunamadı. Lütfen giriş yapmayı deneyin.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccess(false);
      await resendVerification(email);
      setSuccess(true);
      setCooldown(60); // 60 saniye bekleme süresi
    } catch (err) {
      let errorMessage = err.message || "Doğrulama e-postası tekrar gönderilemedi.";
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      setErrorMsg(errorMessage);
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
          <div className={styles.content}>
            <FiMail className={styles.spinner} style={{ animation: 'none', fontSize: 56 }} />
            <h2 className={styles.title}>E-postanızı Onaylayın</h2>
            <p className={styles.sub}>
              {email ? (
                <><strong>{email}</strong> adresine bir doğrulama e-postası gönderdik. Hesabınızı aktifleştirmek için e-postadaki bağlantıya tıklayın.</>
              ) : (
                <>Kaydı tamamlamak için e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.</>
              )}
            </p>

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2ecc71', marginBottom: 20, fontSize: 13 }}>
                <FiCheckCircle /> Yeni doğrulama bağlantısı e-postanıza gönderildi.
              </div>
            )}

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e05594', marginBottom: 20, fontSize: 13 }}>
                <FiAlertCircle /> {errorMsg}
              </div>
            )}

            <button 
              onClick={handleResend} 
              disabled={loading || cooldown > 0}
              className={styles.btn}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12, opacity: (loading || cooldown > 0) ? 0.5 : 1 }}
            >
              {loading && <FiLoader className={styles.spinner} style={{ margin: 0, fontSize: 16 }} />}
              {cooldown > 0 ? `Tekrar Gönder (${cooldown}s)` : 'Tekrar E-posta Gönder'}
            </button>

            <button onClick={() => navigate('/giris')} className={styles.btnOutline}>
              Giriş Sayfasına Dön
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
