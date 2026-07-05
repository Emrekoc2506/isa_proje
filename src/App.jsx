import './index.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/giris" element={<AuthPage />} />
      <Route path="/uye-ol" element={<AuthPage />} />
      <Route path="/panel" element={<DashboardPage onLogout={() => navigate('/giris')} />} />
      <Route path="/admin" element={<AdminPage onLogout={() => navigate('/giris')} />} />
      <Route path="/urunler" element={<ProductsPage />} />
      <Route path="/urun/:id" element={<ProductDetailPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ProductProvider>
        <WishlistProvider>
          <CartProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </CartProvider>
        </WishlistProvider>
      </ProductProvider>
    </BrowserRouter>
  );
}

export default App;
