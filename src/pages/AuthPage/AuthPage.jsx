import styles from './AuthPage.module.css';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [regError, setRegError] = useState(null);
  
  const { login, register } = useAuth();
  const { mergeGuestWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = mode === 'login';

  // Giriş formunu gönder → kimlik doğrula
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('#login-email').value;
    const password = e.target.querySelector('#login-password').value;
    
    try {
      setLoginError(null);
      const res = await login({ email, password });

      // Merge guest wishlist after login
      try {
        const raw = localStorage.getItem("isa_guest_wishlist");
        let guestItems = [];
        try {
          guestItems = raw ? JSON.parse(raw) : [];
        } catch {
          guestItems = [];
        }
        if (guestItems.length > 0) {
          await mergeGuestWishlist(guestItems);
        }
      } catch (mergeErr) {
        console.warn("Wishlist merge failed:", mergeErr);
        let errMsg = "Favoriler hesabınıza aktarılamadı. Favorileriniz bu cihazda korunuyor.";
        if (mergeErr.code === "unauthorized") {
          errMsg = "Oturum süreniz doldu. Lütfen yeniden giriş yapın.";
        } else if (mergeErr.code === "validation_error") {
          errMsg = "Favoriler aktarılırken geçersiz veri tespit edildi.";
        } else if (mergeErr.code === "too_many_products") {
          errMsg = "Aynı anda en fazla 100 favori aktarılabilir.";
        } else if (mergeErr.code === "network_error") {
          errMsg = "Favoriler hesabınıza aktarılamadı. Favorileriniz bu cihazda korunuyor.";
        }
        alert(errMsg);
      }
      
      const roles = res.user?.roles || [];
      const from = location.state?.from?.pathname || (roles.includes("SuperAdmin") || roles.includes("Admin") ? '/admin' : '/panel');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === "email_not_confirmed") {
        navigate('/email-dogrulama-bekleniyor', { state: { email } });
      } else {
        setLoginError(err.message || "E-posta veya şifre hatalı.");
      }
    }
  };

  // Kayıt formunu gönder → e-posta doğrulama sayfasına geç
  const handleRegister = async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('#reg-name').value;
    const email = e.target.querySelector('#reg-email').value;
    const password = e.target.querySelector('#reg-password').value;
    const confirm = e.target.querySelector('#reg-confirm').value;

    if (password !== confirm) {
      setRegError("Şifreler uyuşmuyor!");
      return;
    }

    try {
      setRegError(null);
      // Kayıt isteği gönder
      await register({
        fullName: name,
        email: email,
        password: password
      });

      // Kayıt başarılı olduğunda OTP sayfası yerine "bekleniyor" sayfasına e-posta ile yönlendir
      navigate('/email-dogrulama-bekleniyor', { state: { email } });
    } catch (err) {
      setRegError(err.message || "Kayıt işlemi başarısız.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />
      <div className={styles.bgOrb3} aria-hidden="true" />

      <div className={styles.wrapper}>
        {/* ── Logo ─────────────────────────────────────────────── */}
        <a href="/" className={styles.logoLink} aria-label="mysticvelora – Ana Sayfa">
          <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
          <span className={styles.brandName}>mysticvelora</span>
        </a>

        {/* ── Kart ─────────────────────────────────────────────── */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className={styles.tabs}>
            <button
              id="tab-login"
              className={`${styles.tab} ${isLogin ? styles.tabActive : ''}`}
              onClick={() => { setMode('login'); setLoginError(null); setRegError(null); }}
              role="tab"
              aria-selected={isLogin}
            >
              Giriş Yap
            </button>
            <button
              id="tab-register"
              className={`${styles.tab} ${!isLogin ? styles.tabActive : ''}`}
              onClick={() => { setMode('register'); setLoginError(null); setRegError(null); }}
              role="tab"
              aria-selected={!isLogin}
            >
              Üye Ol
            </button>
            <motion.div
              className={styles.tabIndicator}
              animate={{ x: isLogin ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* ── Form İçeriği ───────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* ════ GİRİŞ FORMU ════ */}
            {isLogin ? (
              <motion.form
                key="login"
                className={styles.form}
                onSubmit={handleLogin}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className={styles.formTitle}>Tekrar Hoş Geldiniz</h2>
                <p className={styles.formSub}>Mistik yolculuğunuza devam edin</p>

                <div className={styles.inputBox}>
                  <FiMail className={styles.inputIcon} />
                  <input id="login-email" type="email" className={styles.input} required autoComplete="email" />
                  <span className={styles.label}>E-posta</span>
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input id="login-password" type={showPass ? 'text' : 'password'} className={styles.input} required autoComplete="current-password" />
                  <span className={styles.label}>Şifre</span>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Şifreyi göster/gizle">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <a href="/sifremi-unuttum" className={styles.forgotLink}>Şifremi Unuttum</a>

                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      className={styles.loginErrorMsg}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <FiAlertCircle />
                      <span>{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" id="btn-login-submit" className={styles.submitBtn} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <span>Giriş Yap</span>
                  <span className={styles.btnArrow}>→</span>
                </motion.button>

                <p className={styles.switchText}>
                  Hesabınız yok mu?{' '}
                  <button type="button" className={styles.switchBtn} onClick={() => { setMode('register'); setLoginError(null); setRegError(null); }}>Üye Olun</button>
                </p>
              </motion.form>
            ) : (
              /* ════ KAYIT FORMU ════ */
              <motion.form
                key="register"
                className={styles.form}
                onSubmit={handleRegister}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className={styles.formTitle}>Aramıza Katılın</h2>
                <p className={styles.formSub}>Mistik dünyanın kapılarını aralayın</p>

                <div className={styles.inputBox}>
                  <FiUser className={styles.inputIcon} />
                  <input id="reg-name" type="text" className={styles.input} required autoComplete="name" />
                  <span className={styles.label}>Ad Soyad</span>
                </div>

                <div className={styles.inputBox}>
                  <FiMail className={styles.inputIcon} />
                  <input id="reg-email" type="email" className={styles.input} required autoComplete="email" />
                  <span className={styles.label}>E-posta</span>
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input id="reg-password" type={showPass ? 'text' : 'password'} className={styles.input} required autoComplete="new-password" />
                  <span className={styles.label}>Şifre</span>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Şifreyi göster/gizle">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} className={styles.input} required autoComplete="new-password" />
                  <span className={styles.label}>Şifre Tekrar</span>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} aria-label="Şifreyi göster/gizle">
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <AnimatePresence>
                  {regError && (
                    <motion.div
                      className={styles.loginErrorMsg}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <FiAlertCircle />
                      <span>{regError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" id="btn-register-submit" className={styles.submitBtn} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <span>Üye Ol</span>
                  <span className={styles.btnArrow}>✦</span>
                </motion.button>

                <p className={styles.switchText}>
                  Zaten üye misiniz?{' '}
                  <button type="button" className={styles.switchBtn} onClick={() => { setMode('login'); setLoginError(null); setRegError(null); }}>Giriş Yapın</button>
                </p>
              </motion.form>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
