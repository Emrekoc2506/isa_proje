import styles from "../EmailVerifyPage/EmailVerifyPage.module.css"; // Re-use styling
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLock, FiLoader, FiCheckCircle } from "react-icons/fi";
import SEO from "../../components/SEO/SEO";
import { resetPassword } from "../../services/authApi";
import logoImage from "../../assets/images/logo-2.png";
import FieldError, { getFieldAriaProps } from "../../components/common/FieldError";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get("userId") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    const clientErrors = {};
    if (!newPassword) {
      clientErrors.password = "Yeni şifre zorunludur.";
    } else if (newPassword.length < 8) {
      clientErrors.password = "Yeni şifre en az 8 karakter olmalıdır.";
    }

    if (!confirmPassword) {
      clientErrors.confirmPassword = "Şifre tekrarı zorunludur.";
    } else if (newPassword !== confirmPassword) {
      clientErrors.confirmPassword = "Şifreler eşleşmiyor.";
    }

    if (!userId || !token) {
      setErrorMsg("Geçersiz şifre sıfırlama bağlantısı.");
      return;
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        userId,
        token,
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else {
        setErrorMsg(
          err.message || "Şifreniz sıfırlanamadı. Bağlantının süresi dolmuş olabilir."
        );
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
          <img src={logoImage} alt="muhristan" className={styles.logoImg} />
          <span className={styles.brandName}>muhristan</span>
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
                Şifreniz başarıyla sıfırlandı. Yeni şifrenizle hemen giriş
                yapabilirsiniz.
              </p>
              <button onClick={() => navigate("/giris")} className={styles.btn}>
                Giriş Yap
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={styles.content}
              style={{ width: "100%" }}
            >
              <FiLock
                className={styles.spinner}
                style={{ animation: "none", fontSize: 56 }}
              />
              <h2 className={styles.title}>Yeni Şifre Belirleyin</h2>
              <p className={styles.sub}>
                Lütfen hesabınız için yeni şifrenizi girin.
              </p>

              {errorMsg && (
                <div
                  style={{ color: "#e05594", fontSize: 13, marginBottom: 16 }}
                >
                  {errorMsg}
                </div>
              )}

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  marginBottom: 12,
                }}
              >
                <input
                  type="password"
                  required
                  value={newPassword}
                  {...getFieldAriaProps(fieldErrors.password || fieldErrors.newPassword, undefined, "password-error")}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.password || fieldErrors.newPassword) {
                      setFieldErrors(prev => ({ ...prev, password: null, newPassword: null }));
                    }
                  }}
                  placeholder="Yeni Şifre"
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-gold)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-light)",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <FieldError error={fieldErrors.password || fieldErrors.newPassword} id="password-error" />
              </div>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  marginBottom: 20,
                }}
              >
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  {...getFieldAriaProps(fieldErrors, "confirmPassword")}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  placeholder="Yeni Şifre Tekrarı"
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-gold)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-light)",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <FieldError errors={fieldErrors} name="confirmPassword" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.btn}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {loading && (
                  <FiLoader
                    className={styles.spinner}
                    style={{ margin: 0, fontSize: 16 }}
                  />
                )}
                Şifreyi Güncelle
              </button>

              <button
                type="button"
                onClick={() => navigate("/giris")}
                className={styles.btnOutline}
              >
                İptal Et
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
