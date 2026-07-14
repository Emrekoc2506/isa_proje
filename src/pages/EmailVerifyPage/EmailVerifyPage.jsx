import styles from './EmailVerifyPage.module.css';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { verifyEmail } from '../../services/authApi';
import logoImage from '../../assets/images/logo.png';

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const effectTriggered = useRef(false);

  useEffect(() => {
    if (effectTriggered.current) return;
    effectTriggered.current = true;

    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userId || !token) {
      setStatus('error');
      setErrorMsg('Geçersiz doğrulama bağlantısı.');
      return;
    }

    verifyEmail(userId, token)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        let errorMessage = err.message || 'E-posta doğrulanamadı. Bağlantı süresi dolmuş olabilir.';
        if (err.errors) {
          errorMessage = Object.entries(err.errors)
            .map(([key, value]) => `${key}: ${value.join(', ')}`)
            .join(' | ');
        }
        setErrorMsg(errorMessage);
      });
  }, [searchParams]);

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
          {status === 'loading' && (
            <div className={styles.content}>
              <FiLoader className={styles.spinner} />
              <h2 className={styles.title}>E-posta Doğrulanıyor</h2>
              <p className={styles.sub}>Hesabınız onaylanıyor, lütfen bekleyin...</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.content}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.title}>E-posta Doğrulandı!</h2>
              <p className={styles.sub}>Hesabınız başarıyla aktifleştirildi. Artık giriş yapabilirsiniz.</p>
              <button onClick={() => navigate('/giris')} className={styles.btn}>
                Giriş Yap
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.content}>
              <FiXCircle className={styles.errorIcon} />
              <h2 className={styles.title}>Doğrulama Başarısız</h2>
              <p className={styles.sub}>{errorMsg}</p>
              <button onClick={() => navigate('/giris')} className={styles.btnOutline}>
                Giriş Sayfasına Dön
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
