import styles from "./CheckoutPage.module.css"; // Re-use styling
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import * as orderApi from "../../services/orderApi";
import * as paymentApi from "../../services/paymentApi";
const logoImage = "/logo.png";
import { isManualOrderSuccess, shouldClearCart } from "./paymentFlow";
import { createSecureRandomId } from "../../utils/guestSession";

import SEO from "../../components/SEO/SEO";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCart();

  const orderId =
    searchParams.get("orderId") ||
    sessionStorage.getItem("pendingOrderId") ||
    "";
  const orderNumber =
    searchParams.get("orderNumber") ||
    sessionStorage.getItem("pendingOrderNumber") ||
    "";
  const email =
    searchParams.get("email") ||
    "";

  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrderStatus = async () => {
    if (!orderId) {
      setLoading(false);
      setErrorMsg("Sipariş bilgisi bulunamadı.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      let data;
      if (isAuthenticated) {
        data = await orderApi.getMyOrderById(orderId);
      } else if (orderNumber && email) {
        data = await orderApi.trackGuestOrder({ orderNumber, email });
      } else {
        // Fallback: try reading it if guest token exists, or show notice
        setLoading(false);
        setErrorMsg(
          "Misafir siparişlerini sorgulamak için doğrulama bilgileri eksik. Lütfen sipariş takip numaranızı kullanın.",
        );
        return;
      }

      setOrder(data);
      if (data && shouldClearCart(data)) {
        await clearCart();
        sessionStorage.removeItem("paymentInitError");
      }
    } catch (err) {
      setErrorMsg(err.message || "Sipariş durumu sorgulanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) {
      alert("Sipariş ID bulunamadı.");
      return;
    }
    setRetryLoading(true);
    try {
      const paymentRes = await paymentApi.initializePayment({
        orderId,
        provider: "online",
        returnUrl: window.location.origin + "/odeme/sonuc",
        idempotencyKey: createSecureRandomId("idemp-"),
      });
      if (paymentRes?.redirectUrl) {
        window.location.assign(paymentRes.redirectUrl);
      } else {
        alert("Ödeme yönlendirme bağlantısı alınamadı.");
      }
    } catch (err) {
      alert("Ödeme yeniden başlatılamadı: " + (err.message || err));
    } finally {
      setRetryLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId, orderNumber, email, isAuthenticated]);

  const paymentMethod = String(order?.paymentMethod || "").toLowerCase();
  const isSuccess = order && String(order.paymentStatus).toLowerCase() === "paid";
  const isManualSuccess = isManualOrderSuccess(order);
  const isPending =
    order && paymentMethod === "onlinecard" && String(order.paymentStatus).toLowerCase() === "pending";

  const [cancelling, setCancelling] = useState(false);

  const handleCancelPayment = async () => {
    if (!orderId) return;
    if (!window.confirm("Ödemeyi iptal etmek istediğinize emin misiniz?"))
      return;

    setCancelling(true);
    try {
      await paymentApi.cancelPayment(orderId, "Kullanıcı iptali");
      alert("Ödemeniz başarıyla iptal edildi.");
      await fetchOrderStatus();
    } catch (err) {
      if (err.code === "payment_already_completed") {
        alert("Bu ödeme zaten tamamlanmış.");
        await fetchOrderStatus();
      } else if (err.code === "payment_cancellation_conflict") {
        alert(
          "Ödeme iptal durumu güncellendi. Sipariş durumu kontrol ediliyor.",
        );
        await fetchOrderStatus();
      } else {
        alert(err.message || "Ödeme iptal edilemedi.");
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className={styles.emptyContainer}
      style={{ minHeight: "100vh", padding: "120px 20px" }}
    >
      <SEO title="Sipariş Sonucu | Muhristan" noindex={true} />
      <div className={styles.wrapper} style={{ maxWidth: 500, width: "100%" }}>
        <a href="/" className={styles.logoLink} style={{ marginBottom: 20 }}>
          <img src={logoImage} alt="muhristan" className={styles.logoImg} />
          <span className={styles.brandName}>muhristan</span>
        </a>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: "100%",
            background: "var(--bg-mid)",
            border: "1px solid var(--border-gold)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
          }}
        >
          {loading ? (
            <div className={styles.content}>
              <FiLoader className={styles.spinner} />
              <h2 className={styles.title}>Ödeme Durumu Sorgulanıyor</h2>
              <p className={styles.sub}>
                Banka onayı kontrol ediliyor, lütfen bekleyin...
              </p>
            </div>
          ) : errorMsg ? (
            <div className={styles.content}>
              <FiXCircle className={styles.errorIcon} />
              <h2 className={styles.title}>Sorgulama Hatası</h2>
              <p className={styles.sub}>{errorMsg}</p>
              <button onClick={() => navigate("/")} className={styles.btn}>
                Ana Sayfaya Dön
              </button>
            </div>
          ) : isSuccess ? (
            <div className={styles.content}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.title}>Ödeme Başarılı!</h2>
              <p className={styles.sub}>
                Siparişiniz başarıyla alındı ve ödemeniz onaylandı.
              </p>

              <div
                style={{
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border-gold)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  width: "100%",
                  marginBottom: 24,
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px 0",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  Sipariş Numarası:{" "}
                  <strong style={{ color: "var(--gold-light)" }}>
                    #{order.orderNumber}
                  </strong>
                </p>
                <p
                  style={{
                    margin: "0 0 6px 0",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  Toplam Tutar:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {order.totalAmount || order.grandTotal}{" "}
                    {order.currency || "TRY"}
                  </strong>
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  Durum:{" "}
                  <span style={{ color: "#2ecc71", fontWeight: 600 }}>
                    {order.statusText || "Sipariş Verildi"}
                  </span>
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/siparislerim" : "/")
                }
                className={styles.btn}
                style={{ marginBottom: 12 }}
              >
                {isAuthenticated ? "Siparişlerime Git" : "Alışverişe Devam Et"}
              </button>
            </div>
          ) : isPending ? (
            <div className={styles.content}>
              <FiLoader
                className={styles.spinner}
                style={{ color: "var(--gold)" }}
              />
              <h2 className={styles.title}>Ödeme Bekleniyor</h2>
              <p className={styles.sub}>
                Ödemeniz henüz onaylanmadı veya işlem askıda. Bankanızdan onay
                geldikten sonra durum güncellenecektir.
              </p>

              <button
                onClick={fetchOrderStatus}
                className={styles.btn}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <FiRefreshCw /> Yeniden Kontrol Et
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={cancelling}
                className={styles.btnOutline}
                style={{
                  marginBottom: 12,
                  color: "#e05594",
                  borderColor: "rgba(224,85,148,0.4)",
                }}
              >
                {cancelling ? <FiLoader className={styles.spinner} /> : null}{" "}
                Ödemeyi İptal Et
              </button>
              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/siparislerim" : "/")
                }
                className={styles.btnOutline}
              >
                {isAuthenticated ? "Siparişlerime Git" : "Ana Sayfaya Dön"}
              </button>
            </div>
          ) : isManualSuccess ? (
            <div className={styles.content}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.title}>Siparişiniz Alındı</h2>
              <p className={styles.sub}>
                Ödeme yöntemi: {paymentMethod === "banktransfer" ? "Havale / EFT" : "Kapıda Ödeme"}.<br />
                {paymentMethod === "banktransfer" ? "Ödeme durumu: Ödeme Bekleniyor." : "Ödeme teslimat sırasında alınacaktır."}
              </p>
              <button onClick={() => navigate(isAuthenticated ? "/siparislerim" : "/")} className={styles.btn}>
                {isAuthenticated ? "Siparişlerime Git" : "Alışverişe Devam Et"}
              </button>
            </div>
          ) : (
            <div className={styles.content}>
              <FiXCircle className={styles.errorIcon} />
              <h2 className={styles.title}>Ödeme Başarısız</h2>
              <p className={styles.sub}>
                {sessionStorage.getItem("paymentInitError") || "Kartınızdan tahsilat yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin."}
              </p>

              <button
                onClick={handleRetryPayment}
                disabled={retryLoading}
                className={styles.btn}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {retryLoading ? (
                  <FiLoader className={styles.spinner} />
                ) : (
                  <FiRefreshCw />
                )}
                Ödemeyi Tekrar Dene
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={cancelling}
                className={styles.btnOutline}
                style={{
                  marginBottom: 12,
                  color: "#e05594",
                  borderColor: "rgba(224,85,148,0.4)",
                }}
              >
                {cancelling ? <FiLoader className={styles.spinner} /> : null}{" "}
                Ödemeyi İptal Et
              </button>
              <button
                onClick={() => navigate("/")}
                className={styles.btnOutline}
              >
                Ana Sayfaya Dön
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
