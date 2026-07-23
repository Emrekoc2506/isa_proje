import styles from './AuthPage.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  
  // Controlled inputs state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [loginLoading, setLoginLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const { login, register } = useAuth();
  const { mergeGuestWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = mode === 'login';

  // Beni Hatırla: Kaydedilen emaili yükle
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Email Önerileri
  const emailDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
  const [emailSuggestions, setEmailSuggestions] = useState([]);

  const handleEmailChange = (val) => {
    setLoginEmail(val);
    const [localPart, domainPart] = val.split("@");
    if (val.includes("@")) {
      if (!domainPart) {
        setEmailSuggestions(emailDomains.map((domain) => `${localPart}@${domain}`));
      } else {
        const filtered = emailDomains
          .filter((domain) => domain.startsWith(domainPart))
          .map((domain) => `${localPart}@${domain}`);
        setEmailSuggestions(filtered);
      }
    } else {
      setEmailSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLoginEmail(suggestion);
    setEmailSuggestions([]);
  };

  // Şifre Gücü Hesaplama
  const getPasswordStrength = useCallback((pass) => {
    if (!pass) return { score: 0, text: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, text: 'Zayıf Şifre', color: '#e05594' };
    if (score <= 4) return { score, text: 'Orta Derece Şifre', color: '#f39c12' };
    return { score, text: 'Güçlü Şifre', color: '#2ecc71' };
  }, []);

  // Giriş formunu gönder → kimlik doğrula
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      setLoginError("Geçersiz e-posta formatı.");
      return;
    }

    if (loginPassword.length < 6) {
      setLoginError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    
    try {
      setLoginLoading(true);
      const res = await login({ email: loginEmail, password: loginPassword });

      // Beni hatırla kaydı
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", loginEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

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
      if (err.requiresVerification === true && err.userId) {
        setLoginError("E-posta adresiniz henüz doğrulanmamış. Yönlendiriliyorsunuz...");
        setTimeout(() => {
          navigate('/email-dogrulama-bekleniyor', { state: { email: loginEmail, userId: err.userId } });
        }, 1500);
        return;
      }

      if (err.code === "email_not_confirmed") {
        setLoginError("E-posta adresiniz henüz doğrulanmamış. Yönlendiriliyorsunuz...");
        setTimeout(() => {
          navigate('/email-dogrulama-bekleniyor', { state: { email: loginEmail } });
        }, 1500);
      } else {
        setLoginError(err.message || "E-posta veya şifre hatalı.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Kayıt formunu gönder → e-posta doğrulama sayfasına geç
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegError("Geçersiz e-posta formatı.");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (regPassword !== regConfirm) {
      setRegError("Şifreler uyuşmuyor!");
      return;
    }

    try {
      setRegLoading(true);
      // Kayıt isteği gönder
      const res = await register({
        fullName: regName,
        email: regEmail,
        password: regPassword
      });

      // Kayıt başarılı olduğunda otomatik giriş yap ve panele yönlendir
      await login({ email: regEmail, password: regPassword });
      navigate('/panel');
    } catch (err) {
      let errorMessage = err.message || "Kayıt işlemi başarısız.";
      if (err.errors) {
        errorMessage = Object.entries(err.errors)
          .map(([key, value]) => `${key}: ${value.join(', ')}`)
          .join(' | ');
      }
      setRegError(errorMessage);
    } finally {
      setRegLoading(false);
    }
  };

  // Öneri listesi ve eleman stilleri
  const suggestionsListStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(30, 18, 50, 0.98)',
    border: '1px solid var(--border-gold)',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '150px',
    overflowY: 'auto',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
  };

  const suggestionItemStyle = {
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-light)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'left',
    transition: 'background-color 0.2s'
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />
      <div className={styles.bgOrb3} aria-hidden="true" />

      <div className={styles.wrapper}>
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link to="/" className={styles.logoLink} aria-label="mysticvelora – Ana Sayfa">
          <img src={logoImage} alt="mysticvelora" className={styles.logoImg} />
          <span className={styles.brandName}>mysticvelora</span>
        </Link>

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
                  <input 
                    id="login-email" 
                    type="email" 
                    className={styles.input} 
                    required 
                    autoComplete="email" 
                    value={loginEmail}
                    onChange={e => {
                      handleEmailChange(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                  />
                  <span className={styles.label}>E-posta</span>

                  {emailSuggestions.length > 0 && (
                    <ul style={suggestionsListStyle}>
                      {emailSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            handleSuggestionClick(suggestion);
                            if (loginError) setLoginError(null);
                          }}
                          style={suggestionItemStyle}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(201, 162, 39, 0.15)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input 
                    id="login-password" 
                    type={showPass ? 'text' : 'password'} 
                    className={styles.input} 
                    required 
                    autoComplete="current-password" 
                    value={loginPassword}
                    onChange={e => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                  />
                  <span className={styles.label}>Şifre</span>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Şifreyi göster/gizle">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)} 
                      style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                    Beni Hatırla
                  </label>
                  <Link to="/sifremi-unuttum" className={styles.forgotLink} style={{ margin: 0 }}>Şifremi Unuttum</Link>
                </div>

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

                <motion.button 
                  type="submit" 
                  id="btn-login-submit" 
                  className={styles.submitBtn} 
                  disabled={loginLoading}
                  whileHover={loginLoading ? {} : { scale: 1.03, y: -2 }} 
                  whileTap={loginLoading ? {} : { scale: 0.97 }}
                >
                  <span>{loginLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
                  {!loginLoading && <span className={styles.btnArrow}>→</span>}
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
                  <input 
                    id="reg-name" 
                    type="text" 
                    className={styles.input} 
                    required 
                    autoComplete="name" 
                    value={regName}
                    onChange={e => {
                      setRegName(e.target.value);
                      if (regError) setRegError(null);
                    }}
                  />
                  <span className={styles.label}>Ad Soyad</span>
                </div>

                <div className={styles.inputBox}>
                  <FiMail className={styles.inputIcon} />
                  <input 
                    id="reg-email" 
                    type="email" 
                    className={styles.input} 
                    required 
                    autoComplete="email" 
                    value={regEmail}
                    onChange={e => {
                      setRegEmail(e.target.value);
                      if (regError) setRegError(null);
                    }}
                  />
                  <span className={styles.label}>E-posta</span>
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input 
                    id="reg-password" 
                    type={showPass ? 'text' : 'password'} 
                    className={styles.input} 
                    required 
                    autoComplete="new-password" 
                    value={regPassword}
                    onChange={e => {
                      setRegPassword(e.target.value);
                      if (regError) setRegError(null);
                    }}
                  />
                  <span className={styles.label}>Şifre</span>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Şifreyi göster/gizle">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                  
                  {regPassword && (() => {
                    const strength = getPasswordStrength(regPassword);
                    return (
                      <div style={{ marginTop: 6, paddingLeft: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600', transition: 'color 0.3s' }}>
                            {strength.text}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${(strength.score / 5) * 100}%`, 
                            height: '100%', 
                            backgroundColor: strength.color, 
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                            boxShadow: `0 0 8px ${strength.color}`
                          }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className={styles.inputBox}>
                  <FiLock className={styles.inputIcon} />
                  <input 
                    id="reg-confirm" 
                    type={showConfirm ? 'text' : 'password'} 
                    className={styles.input} 
                    required 
                    autoComplete="new-password" 
                    value={regConfirm}
                    onChange={e => {
                      setRegConfirm(e.target.value);
                      if (regError) setRegError(null);
                    }}
                  />
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

                <motion.button 
                  type="submit" 
                  id="btn-register-submit" 
                  className={styles.submitBtn} 
                  disabled={regLoading}
                  whileHover={regLoading ? {} : { scale: 1.03, y: -2 }} 
                  whileTap={regLoading ? {} : { scale: 0.97 }}
                >
                  <span>{regLoading ? 'Üye Yapılıyor...' : 'Üye Ol'}</span>
                  {!regLoading && <span className={styles.btnArrow}>✦</span>}
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
