import './index.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProductProvider } from './context/ProductContext';
import MainLayout from './layouts/MainLayout/MainLayout';
import HomePage from './pages/HomePage/HomePage';
import AuthPage from './pages/AuthPage/AuthPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import AdminPage from './pages/AdminPage/AdminPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import GuestRoute from './routes/GuestRoute';

// New Pages
import EmailVerifyPage from './pages/EmailVerifyPage/EmailVerifyPage';
import EmailWaitingPage from './pages/EmailVerifyPage/EmailWaitingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ForgotPasswordPage/ResetPasswordPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import PaymentResultPage from './pages/CheckoutPage/PaymentResultPage';
import OrderTrackingPage from './pages/CheckoutPage/OrderTrackingPage';

function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark)', color: 'var(--text-light)', fontFamily: 'var(--font-body)' }}>
      <h2 style={{ color: '#e05594', fontSize: '32px', marginBottom: '8px' }}>Yetkisiz Erişim</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.</p>
      <Link to="/" style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: 'var(--bg-dark)', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>Ana Sayfaya Git</Link>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark)', color: 'var(--text-light)', fontFamily: 'var(--font-body)' }}>
      <h2 style={{ color: 'var(--gold-light)', fontSize: '48px', marginBottom: '8px' }}>404</h2>
      <h3 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Sayfa Bulunamadı</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link to="/" style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold-dark))', color: 'var(--bg-dark)', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>Ana Sayfaya Git</Link>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Kamu Rotaları */}
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/urunler" element={<MainLayout><ProductsPage /></MainLayout>} />
      <Route path="/urun/:id" element={<ProductDetailPage />} />
      <Route path="/siparis-takip" element={<OrderTrackingPage />} />

      {/* Guest Rotaları (Giriş yapanlar giremez) */}
      <Route path="/giris" element={<GuestRoute><AuthPage /></GuestRoute>} />
      <Route path="/uye-ol" element={<GuestRoute><AuthPage /></GuestRoute>} />
      <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
      
      {/* Aktivasyon / Şifre Sıfırlama Rotaları */}
      <Route path="/email-dogrula" element={<EmailVerifyPage />} />
      <Route path="/email-dogrulama-bekleniyor" element={<EmailWaitingPage />} />
      <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />

      {/* Sepet / Ödeme (Auth veya Guest) */}
      <Route path="/sepet" element={<MainLayout><ProductsPage /></MainLayout>} /> {/* Sepet Drawer olarak açılır, yönlendirmede de ürünleri listeler */}
      <Route path="/odeme" element={<CheckoutPage />} />
      <Route path="/odeme/sonuc" element={<PaymentResultPage />} />

      {/* Müşteri Rotaları (Giriş zorunlu) */}
      <Route path="/panel" element={<ProtectedRoute><DashboardPage activeTab="overview" /></ProtectedRoute>} />
      <Route path="/siparislerim" element={<ProtectedRoute><DashboardPage activeTab="orders" /></ProtectedRoute>} />
      <Route path="/siparislerim/:id" element={<ProtectedRoute><DashboardPage activeTab="orders" /></ProtectedRoute>} />
      <Route path="/favorilerim" element={<ProtectedRoute><DashboardPage activeTab="wishlist" /></ProtectedRoute>} />
      <Route path="/adreslerim" element={<ProtectedRoute><DashboardPage activeTab="addresses" /></ProtectedRoute>} />
      <Route path="/profilim" element={<ProtectedRoute><DashboardPage activeTab="profile" /></ProtectedRoute>} />
      <Route path="/ayarlar" element={<ProtectedRoute><DashboardPage activeTab="settings" /></ProtectedRoute>} />

      {/* Yönetici Rotaları (Yalnızca Admin/SuperAdmin) */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* Hata Rotaları */}
      <Route path="/yetkisiz" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <WishlistProvider>
              <CartProvider>
                <NotificationProvider>
                  <AppRoutes />
                </NotificationProvider>
              </CartProvider>
            </WishlistProvider>
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
