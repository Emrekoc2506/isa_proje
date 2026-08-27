import React, { lazy, Suspense } from "react";
import "./index.css";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ProductProvider } from "./context/ProductContext";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "./layouts/MainLayout/MainLayout";
import HomePage from "./pages/HomePage/HomePage";

// Lazy Loaded Heavy Pages (Code-Splitting for Optimal Bundle & Performance)
const AuthPage = lazy(() => import("./pages/AuthPage/AuthPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage/ProductDetailPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage/DashboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage/AdminPage"));
const BlogPage = lazy(() => import("./pages/BlogPage/BlogPage"));

// Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import GuestRoute from "./routes/GuestRoute";

// New Pages (Lazy)
const EmailVerifyPage = lazy(() => import("./pages/EmailVerifyPage/EmailVerifyPage"));
const EmailWaitingPage = lazy(() => import("./pages/EmailVerifyPage/EmailWaitingPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ForgotPasswordPage/ResetPasswordPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage/CheckoutPage"));
const PaymentResultPage = lazy(() => import("./pages/CheckoutPage/PaymentResultPage"));

// Statik Sayfalar (Lazy)
const HakkimizdaPage = lazy(() => import("./pages/StaticPages/HakkimizdaPage"));
const IletisimPage = lazy(() => import("./pages/StaticPages/IletisimPage"));
const KargoTeslimatPage = lazy(() => import("./pages/StaticPages/KargoTeslimatPage"));
const IadeSikayetPage = lazy(() => import("./pages/StaticPages/IadeSikayetPage"));
const GizlilikPage = lazy(() => import("./pages/StaticPages/GizlilikPage"));
const KullanimKosullariPage = lazy(() => import("./pages/StaticPages/KullanimKosullariPage"));
const MesafeliSatisPage = lazy(() => import("./pages/StaticPages/MesafeliSatisPage"));
const KvkkAydinlatmaPage = lazy(() => import("./pages/StaticPages/KvkkAydinlatmaPage"));
const GarantiIptalPage = lazy(() => import("./pages/StaticPages/GarantiIptalPage"));
const OnBilgilendirmePage = lazy(() => import("./pages/StaticPages/OnBilgilendirmePage"));
const CerezPolitikasiPage = lazy(() => import("./pages/StaticPages/CerezPolitikasiPage"));

import SEO from "./components/SEO/SEO";

function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--bg-dark)",
        color: "var(--text-light)",
        fontFamily: "var(--font-body)",
      }}
    >
      <SEO title="Yetkisiz Erişim | Muhristan" noindex={true} />
      <h2 style={{ color: "#e05594", fontSize: "32px", marginBottom: "8px" }}>
        Yetkisiz Erişim
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
        Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.
      </p>
      <Link
        to="/"
        style={{
          background:
            "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
          color: "var(--bg-dark)",
          padding: "12px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Ana Sayfaya Git
      </Link>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--bg-dark)",
        color: "var(--text-light)",
        fontFamily: "var(--font-body)",
      }}
    >
      <SEO title="Sayfa Bulunamadı | Muhristan" is404={true} />
      <h2
        style={{
          color: "var(--gold-light)",
          fontSize: "48px",
          marginBottom: "8px",
        }}
      >
        404
      </h2>
      <h3 style={{ color: "#fff", fontSize: "24px", marginBottom: "8px" }}>
        Sayfa Bulunamadı
      </h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        to="/"
        style={{
          background:
            "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
          color: "var(--bg-dark)",
          padding: "12px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Ana Sayfaya Git
      </Link>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Kamu Rotaları */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      <Route
        path="/urunler"
        element={
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        }
      />
      <Route path="/urun/:id" element={<ProductDetailPage />} />
      <Route
        path="/blog"
        element={
          <MainLayout>
            <BlogPage />
          </MainLayout>
        }
      />

      {/* Statik Sayfalar */}
      <Route
        path="/hakkimizda"
        element={
          <MainLayout>
            <HakkimizdaPage />
          </MainLayout>
        }
      />
      <Route
        path="/iletisim"
        element={
          <MainLayout>
            <IletisimPage />
          </MainLayout>
        }
      />
      <Route
        path="/kargo-teslimat"
        element={
          <MainLayout>
            <KargoTeslimatPage />
          </MainLayout>
        }
      />
      <Route
        path="/iade-sikayet"
        element={
          <MainLayout>
            <IadeSikayetPage />
          </MainLayout>
        }
      />
      <Route
        path="/gizlilik-politikasi"
        element={
          <MainLayout>
            <GizlilikPage />
          </MainLayout>
        }
      />
      <Route
        path="/kullanim-kosullari"
        element={
          <MainLayout>
            <KullanimKosullariPage />
          </MainLayout>
        }
      />
      <Route
        path="/mesafeli-satis-sozlesmesi"
        element={
          <MainLayout>
            <MesafeliSatisPage />
          </MainLayout>
        }
      />
      <Route
        path="/kvkk-aydinlatma"
        element={
          <MainLayout>
            <KvkkAydinlatmaPage />
          </MainLayout>
        }
      />
      <Route
        path="/garanti-ve-iptal"
        element={
          <MainLayout>
            <GarantiIptalPage />
          </MainLayout>
        }
      />
      <Route
        path="/on-bilgilendirme-formu"
        element={
          <MainLayout>
            <OnBilgilendirmePage />
          </MainLayout>
        }
      />
      <Route
        path="/cerez-politikasi"
        element={
          <MainLayout>
            <CerezPolitikasiPage />
          </MainLayout>
        }
      />

      {/* Guest Rotaları (Giriş yapanlar giremez) */}
      <Route
        path="/giris"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />
      <Route
        path="/uye-ol"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />
      <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />

      {/* Aktivasyon / Şifre Sıfırlama Rotaları */}
      <Route path="/email-dogrula" element={<EmailVerifyPage />} />
      <Route
        path="/email-dogrulama-bekleniyor"
        element={<EmailWaitingPage />}
      />
      <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />

      {/* Sepet / Ödeme (Auth veya Guest) */}
      <Route path="/sepet" element={<Navigate to="/odeme" replace />} />
      <Route path="/odeme" element={<CheckoutPage />} />
      <Route path="/odeme/sonuc" element={<PaymentResultPage />} />

      {/* Müşteri Rotaları (Giriş zorunlu) */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="overview" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siparislerim"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/siparislerim/:id"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorilerim"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="wishlist" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/adreslerim"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="addresses" />
          </ProtectedRoute>
        }
      />
      <Route path="/profilim" element={<Navigate to="/ayarlar" replace />} />
      <Route
        path="/ayarlar"
        element={
          <ProtectedRoute>
            <DashboardPage activeTab="settings" />
          </ProtectedRoute>
        }
      />

      {/* Yönetici Rotaları (Yalnızca Admin/SuperAdmin) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* Hata Rotaları */}
      <Route path="/yetkisiz" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <ProductProvider>
              <WishlistProvider>
                <CartProvider>
                  <NotificationProvider>
                    <Suspense fallback={
                      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(201,162,39,0.2)', borderTopColor: 'var(--gold-light, #c9a227)', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    }>
                      <AppRoutes />
                    </Suspense>
                  </NotificationProvider>
                </CartProvider>
              </WishlistProvider>
            </ProductProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
