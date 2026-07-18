import styles from '../EmailVerifyPage/EmailVerifyPage.module.css'; // Re-use styling
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { resetPassword } from '../../services/authApi';
import logoImage from '../../assets/images/logo.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const userId = searchParams.get('userId') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setErrorMsg("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Şifreler eşleşmiyor.");
      return;
    }

    if (!userId || !token) {
      setErrorMsg("Geçersiz şifre sıfırlama bağlantısı.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await resetPassword({
        userId,
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      let errorMessage = err.message || "Şifreniz sıfırlanamadı. Bağlantının süresi dolmuş olabilir.";
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
          {success ? (
            <div className={styles.content}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.title}>Şifre Değiştirildi!</h2>
              <p className={styles.sub}>
                Şifreniz başarıyla sıfırlandı. Yeni şifrenizle hemen giriş yapabilirsiniz.
              </p>
              <button onClick={() => navigate('/giris')} className={styles.btn}>
                Giriş Yap
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.content} style={{ width: '100%' }}>
              <FiLock className={styles.spinner} style={{ animation: 'none', fontSize: 56 }} />
              <h2 className={styles.title}>Yeni Şifre Belirleyin</h2>
              <p className={styles.sub}>Lütfen hesabınız için yeni şifrenizi girin.</p>

              {errorMsg && (
                <div style={{ color: '#e05594', fontSize: 13, marginBottom: 16 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
                <input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Yeni Şifre"
                  style={{
                    width: '100%',
                    padding: '14px',
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

              <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Yeni Şifre Tekrarı"
                  style={{
                    width: '100%',
                    padding: '14px',
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
                Şifreyi Güncelle
              </button>

              <button type="button" onClick={() => navigate('/giris')} className={styles.btnOutline}>
                İptal Et
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
