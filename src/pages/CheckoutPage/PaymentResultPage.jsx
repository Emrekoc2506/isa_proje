import styles from "./CheckoutPage.module.css"; // Re-use styling
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiUpload,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import * as orderApi from "../../services/orderApi";
import * as paymentApi from "../../services/paymentApi";
import * as bankTransferApi from "../../services/bankTransferApi";
import logoImage from "../../assets/images/logo-2.png";
import { isManualOrderSuccess, shouldClearCart } from "./paymentFlow";
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

  // Banka bilgisi ve dekont yükleme state'leri
  const [bankInfo, setBankInfo] = useState(null);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
        try {
          data = await orderApi.getMyOrderById(orderId);
        } catch {
          data = { id: orderId, orderNumber: orderNumber || "MHR-SIPARIS", paymentMethod: "BankTransfer", paymentStatus: "Pending" };
        }
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

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId, orderNumber, email, isAuthenticated]);

  // Banka Havalesi bilgilerini yükle
  useEffect(() => {
    bankTransferApi.getBankTransferInfo()
      .then(res => {
        if (res) setBankInfo(res);
      })
      .catch(() => {
        // Fallback default info if endpoint is down
        setBankInfo({
          enabled: true,
          bankName: "Ziraat Bankası",
          accountHolder: "Muhristan Takı ve Esans Tic.",
          iban: "TR12 0001 0000 0000 0000 0000 01",
          currency: "TRY"
        });
      });
  }, []);

  const handleCopy = (text, type) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      if (type === "iban") {
        setCopiedIban(true);
        setTimeout(() => setCopiedIban(false), 2000);
      } else if (type === "desc") {
        setCopiedDesc(true);
        setTimeout(() => setCopiedDesc(false), 2000);
      }
    }).catch(console.error);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceiptError("");
    if (!file) {
      setReceiptFile(null);
      return;
    }

    // Dosya uzantısı kontrolü
    const allowed = ["jpg", "jpeg", "png", "pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setReceiptError("Yalnızca JPG, PNG ve PDF dosyaları yüklenebilir.");
      setReceiptFile(null);
      return;
    }

    // 5 MB boyut kontrolü
    if (file.size > 5 * 1024 * 1024) {
      setReceiptError("Dosya boyutu 5 MB'dan küçük olmalıdır.");
      setReceiptFile(null);
      return;
    }

    setReceiptFile(file);
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setReceiptError("Lütfen bir dekont dosyası seçiniz.");
      return;
    }

    setUploadingReceipt(true);
    setReceiptError("");
    try {
      await bankTransferApi.uploadBankTransferReceipt(orderId, {
        file: receiptFile,
        senderName: senderName || order?.customerName || "",
        transferDate: transferDate || new Date().toISOString().slice(0, 10)
      });
      setReceiptSuccess(true);
      // Siparişi yenile
      await fetchOrderStatus();
    } catch (err) {
      setReceiptError(err.message || "Dekont yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setUploadingReceipt(false);
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
        idempotencyKey: globalThis.crypto?.randomUUID?.() ||
          "idemp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
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

  const paymentMethod = String(order?.paymentMethod || "").toLowerCase();
  const paymentStatus = String(order?.paymentStatus || "").toLowerCase();
  const isPaid = order && (paymentStatus === "paid" || paymentStatus === "ödendi");
  const isPendingVerification = receiptSuccess || paymentStatus === "pendingverification";
  const isBankTransfer = paymentMethod === "banktransfer";
  const isManualSuccess = isManualOrderSuccess(order);
  const isPending = order && paymentMethod === "onlinecard" && paymentStatus === "pending";

  const handleCancelPayment = async () => {
    if (!orderId) return;
    if (!window.confirm("Ödemeyi iptal etmek istediğinize emin misiniz?")) return;

    setCancelling(true);
    try {
      await paymentApi.cancelPayment(orderId, "Kullanıcı iptali");
      alert("Ödemeniz başarıyla iptal edildi.");
      await fetchOrderStatus();
    } catch (err) {
      alert(err.message || "Ödeme iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className={styles.emptyContainer}
      style={{ minHeight: "100vh", padding: "100px 20px" }}
    >
      <SEO title="Sipariş Sonucu | Muhristan" noindex={true} />
      <div className={styles.wrapper} style={{ maxWidth: 620, width: "100%" }}>
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
            padding: "32px 24px",
          }}
        >
          {loading ? (
            <div className={styles.content}>
              <FiLoader className={styles.spinner} />
              <h2 className={styles.title}>Sipariş Durumu Sorgulanıyor</h2>
              <p className={styles.sub}>Bilgiler alınıyor, lütfen bekleyin...</p>
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
          ) : isPaid ? (
            <div className={styles.content}>
              <FiCheckCircle className={styles.successIcon} />
              <h2 className={styles.title}>Ödeme Başarılı!</h2>
              <p className={styles.sub}>
                Siparişiniz başarıyla alındı ve ödemeniz onaylandı.
              </p>
              <div
                style={{
                  background: "var(--bg-dark)",
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  marginBottom: 20,
                  fontSize: 14,
                  textAlign: "left",
                  border: "1px solid rgba(201,162,39,0.2)",
                }}
              >
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Sipariş No:</strong> #{order.orderNumber || orderNumber}
                </p>
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Toplam Tutar:</strong> {order.totalAmount || order.grandTotal} ₺
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Durum:</strong> Ödeme Onaylandı — Hazırlanıyor
                </p>
              </div>
              <button onClick={() => navigate(isAuthenticated ? "/siparislerim" : "/")} className={styles.btn}>
                {isAuthenticated ? "Siparişlerime Git" : "Alışverişe Devam Et"}
              </button>
            </div>
          ) : isBankTransfer || isManualSuccess ? (
            <div className={styles.content}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: isPendingVerification ? "rgba(56, 189, 248, 0.15)" : "rgba(201, 162, 39, 0.15)",
                color: isPendingVerification ? "#38bdf8" : "var(--gold-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 16px auto", border: "1px solid currentColor"
              }}>
                {isPendingVerification ? <FiFileText /> : <FiCheckCircle />}
              </div>

              <h2 className={styles.title} style={{ color: "var(--gold-light)" }}>
                {isPendingVerification ? "Ödeme Kontrol Ediliyor" : "Siparişiniz Alındı — Ödeme Bekleniyor"}
              </h2>

              <p className={styles.sub} style={{ marginBottom: 20 }}>
                {isPendingVerification
                  ? "Dekontunuz başarıyla alındı. Yetkililerimiz banka hesabını kontrol ederek siparişinizi onaylayacaktır."
                  : "Lütfen aşağıdaki banka hesabına havale/EFT yapınız ve dekontunuzu yükleyiniz."}
              </p>

              {/* Sipariş Özeti Kutusu */}
              <div
                style={{
                  background: "var(--bg-dark)",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  textAlign: "left",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span><strong>Sipariş No:</strong> #{order?.orderNumber || orderNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order?.orderNumber || orderNumber, "desc")}
                    style={{ background: "transparent", border: "none", color: "var(--gold-light)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                  >
                    {copiedDesc ? <><FiCheck color="#2ecc71" /> Kopyalandı</> : <><FiCopy /> Kopyala</>}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span><strong>Toplam Tutar:</strong></span>
                  <strong style={{ color: "var(--gold-light)", fontSize: 15 }}>{order?.totalAmount || order?.grandTotal} ₺</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span><strong>Ödeme Durumu:</strong></span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontSize: 11,
                    background: isPendingVerification ? "rgba(56, 189, 248, 0.15)" : "rgba(230, 126, 34, 0.15)",
                    color: isPendingVerification ? "#38bdf8" : "#e67e22"
                  }}>
                    {isPendingVerification ? "Kontrol Ediliyor" : "Ödeme Bekleniyor"}
                  </span>
                </div>
              </div>

              {/* Banka IBAN Bilgileri Kutusu */}
              {bankInfo && (
                <div
                  style={{
                    background: "rgba(201, 162, 39, 0.06)",
                    border: "1.5px dashed var(--gold, #c9a227)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "24px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold-light)", marginBottom: "10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <FiInfo /> Banka Hesap Bilgileri
                  </div>
                  <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Banka: <strong style={{ color: "var(--text-primary)" }}>{bankInfo.bankName}</strong>
                  </p>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Hesap Sahibi: <strong style={{ color: "var(--text-primary)" }}>{bankInfo.accountHolder}</strong>
                  </p>
                  
                  <div style={{
                    background: "var(--bg-dark)",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: "10px",
                    border: "1px solid rgba(201,162,39,0.3)"
                  }}>
                    <code style={{ fontSize: "13px", color: "var(--gold-light)", letterSpacing: "0.5px", wordBreak: "break-all" }}>
                      {bankInfo.iban}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.iban, "iban")}
                      style={{ background: "rgba(201,162,39,0.15)", border: "1px solid var(--border-gold)", color: "var(--gold-light)", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                    >
                      {copiedIban ? <><FiCheck color="#2ecc71" /> Kopyalandı</> : <><FiCopy /> Kopyala</>}
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: "11px", color: "#f87171", lineHeight: "1.4" }}>
                    ⚠️ Havale/EFT açıklamasına mutlaka <strong>#{order?.orderNumber || orderNumber}</strong> sipariş numaranızı yazınız.
                  </p>
                </div>
              )}

              {/* Dekont Yükleme Formu */}
              {!isPendingVerification && (
                <div style={{
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border-gold)",
                  borderRadius: "10px",
                  padding: "18px",
                  marginBottom: "20px",
                  textAlign: "left"
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold-light)", marginBottom: "6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <FiUpload /> Dekont Yükle (İsteğe Bağlı)
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.4" }}>
                    Ödemenizi yaptıktan sonra dekontunuzu buradan yükleyerek onay sürecini hızlandırabilirsiniz. (Maks 5 MB - JPG, PNG, PDF)
                  </p>

                  <form onSubmit={handleReceiptSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      required
                      style={{
                        padding: "8px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border-gold)",
                        borderRadius: "6px",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        outline: "none"
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Gönderen Ad Soyad (İsteğe bağlı)"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border-gold)",
                          borderRadius: "6px",
                          color: "var(--text-primary)",
                          fontSize: "12px",
                          outline: "none"
                        }}
                      />
                      <input
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border-gold)",
                          borderRadius: "6px",
                          color: "var(--text-primary)",
                          fontSize: "12px",
                          outline: "none"
                        }}
                      />
                    </div>

                    {receiptError && (
                      <p style={{ margin: 0, color: "#f87171", fontSize: "12px" }}>{receiptError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={uploadingReceipt}
                      style={{
                        background: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
                        color: "var(--bg-dark)",
                        border: "none",
                        padding: "10px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        marginTop: "4px"
                      }}
                    >
                      {uploadingReceipt ? <><FiLoader className={styles.spinner} /> Dekont Gönderiliyor...</> : <><FiUpload /> Dekontu Gönder</>}
                    </button>
                  </form>
                </div>
              )}

              {/* Bilgilendirme Uyarısı */}
              <div style={{
                fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px",
                lineHeight: "1.5", textAlign: "left", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px"
              }}>
                ℹ️ <strong>Önemli Bilgi:</strong> Ödemeniz banka hesabımızda doğrulandıktan sonra siparişiniz onaylanacaktır. Dekont yüklemek siparişinizi otomatik olarak onaylamaz.
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={() => navigate(isAuthenticated ? "/siparislerim" : "/")} className={styles.btn}>
                  {isAuthenticated ? "Siparişlerime Git" : "Alışverişe Devam Et"}
                </button>
              </div>
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
                {retryLoading ? <FiLoader className={styles.spinner} /> : <FiRefreshCw />}
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
