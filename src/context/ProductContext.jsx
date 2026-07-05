import { createContext, useContext, useState, useEffect } from 'react';
import { 
  newsProducts as initialNews, 
  saleProducts as initialSale, 
  featuredProducts as initialFeatured, 
  navCategories as initialCategories 
} from '../data/index';
import { orderHistory as initialOrders } from '../data/dashboard';
import { heroSlides as initialSlides } from '../data/index';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  // Kategorileri localStorage'dan oku veya varsayılanı yükle
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('mv_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  // Ürünleri localStorage'dan oku veya varsayılanı yükle (Tüm ürün gruplarını tek bir state'te yönetelim)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('mv_products');
    if (saved) return JSON.parse(saved);

    // İlk kez yükleniyorsa tüm grupları etiketleyip birleştirelim
    const merged = [
      ...initialNews.map(p => ({ ...p, categoryId: 'dogal-taslar', isNew: true })),
      ...initialSale.map(p => ({ ...p, categoryId: 'ucucu-yaglar', isSale: true })),
      ...initialFeatured.map(p => ({ ...p, categoryId: 'dogal-taslar', isFeatured: true }))
    ];
    return merged;
  });

  // Siparişleri localStorage'dan oku veya varsayılanı yükle
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('mv_orders');
    if (saved) return JSON.parse(saved);
    
    // Varsayılan siparişleri müşteri bilgileriyle zenginleştirelim
    return initialOrders.map(o => ({
      ...o,
      customerName: "Ece Yıldız",
      customerEmail: "ogrenci@gmail.com"
    }));
  });

  // Slaytları (İlan/Banner) localStorage'dan oku veya varsayılanı yükle
  const [slides, setSlides] = useState(() => {
    const saved = localStorage.getItem('mv_slides');
    return saved ? JSON.parse(saved) : initialSlides;
  });

  // Kategoriler değiştikçe localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('mv_categories', JSON.stringify(categories));
  }, [categories]);

  // Ürünler değiştikçe localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('mv_products', JSON.stringify(products));
  }, [products]);

  // Siparişler değiştikçe localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('mv_orders', JSON.stringify(orders));
  }, [orders]);

  // Slaytlar değiştikçe localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('mv_slides', JSON.stringify(slides));
  }, [slides]);

  // Kategori Ekle
  const addCategory = (label) => {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat = { id, label, href: '#' };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  // Kategori Sil
  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Alt Kategori Ekle
  const addSubcategory = (parentCategoryId, label) => {
    setCategories(prev => prev.map(c => {
      if (c.id === parentCategoryId) {
        const currentChildren = c.children || [];
        const newChild = { label, href: `/urunler?kategori=${c.id}&alt=${encodeURIComponent(label)}` };
        return {
          ...c,
          children: [...currentChildren, newChild]
        };
      }
      return c;
    }));
  };

  // Alt Kategori Sil
  const deleteSubcategory = (parentCategoryId, subLabel) => {
    setCategories(prev => prev.map(c => {
      if (c.id === parentCategoryId) {
        const currentChildren = c.children || [];
        return {
          ...c,
          children: currentChildren.filter(ch => ch.label !== subLabel)
        };
      }
      return c;
    }));
  };

  // Ürün Ekle
  const addProduct = (productData) => {
    const newProduct = {
      id: Date.now(),
      name: productData.name,
      price: productData.price + ' €',
      image: productData.image || 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500',
      categoryId: productData.categoryId,
      subcategory: productData.subcategory || null,
      isNew: productData.isNew || false,
      isSale: productData.isSale || false,
      isFeatured: productData.isFeatured || false,
      oldPrice: productData.oldPrice ? productData.oldPrice + ' €' : null,
      discount: productData.oldPrice ? `-%${Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100)}` : null
    };

    setProducts(prev => [newProduct, ...prev]);
  };

  // Ürün Sil
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Sipariş Durumu Güncelle
  const updateOrderStatus = (orderId, nextStatus, nextStatusCode) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus, statusCode: nextStatusCode };
      }
      return o;
    }));
  };

  // Ürün Fiyatı Güncelle
  const updateProductPrice = (id, newPrice) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, price: parseFloat(newPrice).toFixed(2) + ' €' };
      }
      return p;
    }));
  };

  // Slayt (İlan/Banner) Ekle
  const addSlide = (slideData) => {
    const newSlide = {
      id: Date.now(),
      title: slideData.title,
      subtitle: slideData.subtitle,
      cta: slideData.cta || 'Keşfet',
      href: slideData.href || '/urunler',
      image: slideData.image || 'https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg',
      imageMobile: slideData.image || 'https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg'
    };
    setSlides(prev => [...prev, newSlide]);
  };

  // Slayt Sil
  const deleteSlide = (id) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  return (
    <ProductContext.Provider value={{
      categories,
      products,
      orders,
      slides,
      addCategory,
      deleteCategory,
      addSubcategory,
      deleteSubcategory,
      addProduct,
      deleteProduct,
      updateOrderStatus,
      updateProductPrice,
      addSlide,
      deleteSlide
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
