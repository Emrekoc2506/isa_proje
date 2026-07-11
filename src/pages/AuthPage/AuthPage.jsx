import styles from './AuthPage.module.css';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiEye, FiEyeOff, FiCheckCircle, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import logoImage from '../../assets/images/logo.png';
import { login, register } from '../../services/authApi';

const DEMO_CODE = '000000'; // Demo doğrulama kodu

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verified, setVerified]     = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();

  // OTP giriş kutucukları için state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null),
  ];

  const isLogin = mode === 'login';

  // Giriş formını gönder → kimlik doğrula
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('#login-email').value;
    const password = e.target.querySelector('#login-password').value;
    
    try {
      setLoginError(null);
      const res = await login({ email, password });
      
      const roles = res.user?.roles || [];
      if (roles.includes("SuperAdmin") || roles.includes("Admin")) {
        navigate('/admin');
      } else {
        navigate('/panel');
      }
    } catch (err) {
      setLoginError(err.message || err.Message || "E-posta veya şifre hatalı.");
    }
  };

  // Kayıt formunu gönder → doğrulama ekranına geç
  const handleRegister = async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('#reg-name').value;
    const email = e.target.querySelector('#reg-email').value;
    const password = e.target.querySelector('#reg-password').value;
    const confirm = e.target.querySelector('#reg-confirm').value;

    if (password !== confirm) {
      alert("Şifreler uyuşmuyor!");
      return;
    }

    try {
      // Kayıt isteği gönder
      await register({
        fullName: name,
        email: email,
        password: password,
        phoneNumber: "+905550000000"
      });

      setOtp(['', '', '', '', '', '']);
      setVerifyError(false);
      setVerified(false);
      setMode('verify');
      // İlk kutuya odaklan
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err) {
      alert(err.message || err.Message || "Kayıt işlemi başarısız.");
    }
  };

  // OTP kutucuk değişimi
  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setVerifyError(false);
    if (digit && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs[idx - 1].current?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  // OTP yapıştırma desteği
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs[focusIdx].current?.focus();
  };

  // Doğrulama kontrolü
  const handleVerify = (e) => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered === DEMO_CODE) {
      setVerified(true);
      setVerifyError(false);
    } else {
      setVerifyError(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 50);
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
          {/* Doğrulama ekranında sekmeler gizlenir */}
          {mode !== 'verify' && (
            <div className={styles.tabs}>
              <button
                id="tab-login"
                className={`${styles.tab} ${isLogin ? styles.tabActive : ''}`}
                onClick={() => setMode('login')}
                role="tab"
                aria-selected={isLogin}
              >
                Giriş Yap
              </button>
              <button
                id="tab-register"
                className={`${styles.tab} ${!isLogin ? styles.tabActive : ''}`}
                onClick={() => setMode('register')}
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
          )}

          {/* ── Form İçeriği ───────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* ════ GİRİŞ FORMU ════ */}
            {mode === 'login' && (
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

                <a href="#" className={styles.forgotLink}>Şifremi Unuttum</a>

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
                  <button type="button" className={styles.switchBtn} onClick={() => setMode('register')}>Üye Olun</button>
                </p>
              </motion.form>
            )}

            {/* ════ KAYIT FORMU ════ */}
            {mode === 'register' && (
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

                <motion.button type="submit" id="btn-register-submit" className={styles.submitBtn} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <span>Üye Ol</span>
                  <span className={styles.btnArrow}>✦</span>
                </motion.button>

                <p className={styles.switchText}>
                  Zaten üye misiniz?{' '}
                  <button type="button" className={styles.switchBtn} onClick={() => setMode('login')}>Giriş Yapın</button>
                </p>
              </motion.form>
            )}

            {/* ════ E-POSTA DOĞRULAMA ════ */}
            {mode === 'verify' && (
              <motion.div
                key="verify"
                className={styles.form}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Geri butonu */}
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setMode('register')}
                  aria-label="Kayıt formuna geri dön"
                >
                  <FiArrowLeft /> Geri
                </button>

                {/* Başarı ekranı */}
                {verified ? (
                  <motion.div
                    className={styles.successBox}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <div className={styles.successIcon}>
                      <FiCheckCircle />
                    </div>
                    <h2 className={styles.formTitle}>E-posta Doğrulandı!</h2>
                    <p className={styles.formSub}>Hesabınız başarıyla oluşturuldu. Artık giriş yapabilirsiniz.</p>
                    <motion.button
                      className={styles.submitBtn}
                      style={{ display: 'flex', marginTop: '16px', justifyContent: 'center', width: '100%' }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Zaten token'larımız var, doğrudan panele (müşteri) yönlendir
                        navigate('/panel');
                      }}
                    >
                      <span>Hesabıma Git</span>
                      <span className={styles.btnArrow}>→</span>
                    </motion.button>
                  </motion.div>
                ) : (
                  /* Doğrulama formu */
                  <form onSubmit={handleVerify}>
                    {/* E-posta ikonu */}
                    <div className={styles.verifyIconWrap}>
                      <div className={styles.verifyIconBg}>
                        <FiMail className={styles.verifyIcon} />
                      </div>
                    </div>

                    <h2 className={styles.formTitle}>E-posta Doğrulama</h2>
                    <p className={styles.formSub}>
                      E-posta adresinize 6 haneli doğrulama kodu gönderdik.
                    </p>

                    {/* Demo uyarısı */}
                    <div className={styles.demoBadge}>
                      <span className={styles.demoBadgeIcon}>✦</span>
                      <span>Demo mod — kodu girin: <strong>000 000</strong></span>
                    </div>

                    {/* OTP kutucukları */}
                    <div
                      className={`${styles.otpRow} ${verifyError ? styles.otpShake : ''}`}
                      role="group"
                      aria-label="Doğrulama kodu girişi"
                    >
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpRefs[idx]}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          className={`${styles.otpInput} ${digit ? styles.otpFilled : ''} ${verifyError ? styles.otpError : ''}`}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          autoComplete="one-time-code"
                          aria-label={`Hane ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {/* Hata mesajı */}
                    <AnimatePresence>
                      {verifyError && (
                        <motion.p
                          className={styles.errorMsg}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          Geçersiz kod. Demo için <strong>000000</strong> kullanın.
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      id="btn-verify-submit"
                      className={styles.submitBtn}
                      disabled={otp.join('').length < 6}
                      whileHover={otp.join('').length === 6 ? { scale: 1.03, y: -2 } : {}}
                      whileTap={otp.join('').length === 6 ? { scale: 0.97 } : {}}
                    >
                      <span>Doğrula</span>
                      <span className={styles.btnArrow}>✓</span>
                    </motion.button>

                    <p className={styles.switchText}>
                      Kod gelmedi mi?{' '}
                      <button type="button" className={styles.switchBtn} onClick={() => { setOtp(['','','','','','']); setVerifyError(false); }}>
                        Tekrar Gönder
                      </button>
                    </p>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
