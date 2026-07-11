import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getProducts, 
  createAdminProduct, 
  deleteAdminProduct, 
  updateAdminProductPrice, 
  updateAdminProductStatus 
} from '../services/productApi';
import { 
  getCategories, 
  getCategoryTree, 
  createAdminCategory, 
  deleteAdminCategory 
} from '../services/categoryApi';
import { 
  getBanners, 
  createAdminBanner, 
  deleteAdminBanner, 
  updateAdminBannerStatus 
} from '../services/bannerApi';
import { 
  getAdminOrders, 
  updateAdminOrderStatus 
} from '../services/orderApi';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tüm kamu ve admin (varsa) verilerini yükleme
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Kategori ve Banner (Afiş) verileri her zaman public'tir
      const [categoriesData, bannersData, productsData] = await Promise.all([
        getCategoryTree().catch(() => getCategories().catch(() => [])),
        getBanners().catch(() => []),
        getProducts({ pageSize: 100 }).catch(() => ({ items: [] }))
      ]);

      setCategories(categoriesData || []);
      setProducts(productsData?.items || []);
      
      // Slaytları/Bannerları map edelim (backend formatı -> frontend formatı)
      const mappedSlides = (bannersData || []).map(b => ({
        id: b.id,
        title: b.title || b.cta || "Kampanya",
        subtitle: b.subtitle || "",
        cta: b.cta || "Keşfet",
        href: b.href || "/urunler",
        image: b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        imageMobile: b.imageMobile || b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        isActive: b.isActive ?? true
      }));
      setSlides(mappedSlides);

      // Eğer admin token varsa siparişleri de çekelim
      const token = localStorage.getItem("accessToken");
      if (token) {
        // Token'ın rolünü kontrol edelim (admin ise siparişleri yükle)
        const adminOrders = await getAdminOrders().catch(() => null);
        if (adminOrders) {
          const ordersList = adminOrders.items || (Array.isArray(adminOrders) ? adminOrders : []);
          // Admin siparişlerini map edelim
          const mappedOrders = ordersList.map(o => ({
            id: o.id,
            customerName: o.customerName || "Misafir Müşteri",
            customerEmail: o.customerEmail || "",
            customerPhone: o.customerPhone || "",
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
            total: (o.totalAmount || 0) + ' ₺',
            status: mapOrderStatusToTurkish(o.status),
            statusCode: String(o.status).toLowerCase(),
            items: (o.items || []).map(it => ({
              name: it.productName || "Ürün",
              qty: it.quantity,
              price: (it.unitPrice || 0) + ' ₺'
            }))
          }));
          setOrders(mappedOrders);
        }
      }
    } catch (err) {
      console.error("Veri yükleme hatası:", err);
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Türkçe Sipariş Durumu Haritalaması
  const mapOrderStatusToTurkish = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'pending') return 'Bekliyor';
    if (s === 'preparing') return 'Hazırlanıyor';
    if (s === 'shipping' || s === 'shipped') return 'Kargoda';
    if (s === 'delivered') return 'Teslim Edildi';
    if (s === 'cancelled') return 'İptal';
    if (s === 'refunded') return 'İade Edildi';
    return status;
  };

  // Kategori Ekle
  const addCategory = async (label) => {
    try {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCat = await createAdminCategory({
        name: label,
        slug: slug,
        isActive: true,
        sortOrder: 0
      });
      // Yenile
      const updatedTree = await getCategoryTree().catch(() => getCategories());
      setCategories(updatedTree || []);
      return newCat;
    } catch (err) {
      console.error("Kategori eklenemedi:", err);
      throw err;
    }
  };

  // Kategori Sil
  const deleteCategory = async (id) => {
    try {
      // id parametresi databaseId (Guid) olmalı
      await deleteAdminCategory(id);
      const updatedTree = await getCategoryTree().catch(() => getCategories());
      setCategories(updatedTree || []);
    } catch (err) {
      console.error("Kategori silinemedi:", err);
      throw err;
    }
  };

  // Alt Kategori Ekle
  const addSubcategory = async (parentCategoryId, label) => {
    try {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await createAdminCategory({
        name: label,
        parentCategoryId: parentCategoryId,
        slug: slug,
        isActive: true,
        sortOrder: 0
      });
      const updatedTree = await getCategoryTree().catch(() => getCategories());
      setCategories(updatedTree || []);
    } catch (err) {
      console.error("Alt kategori eklenemedi:", err);
      throw err;
    }
  };

  // Alt Kategori Sil
  const deleteSubcategory = async (parentCategoryId, subLabel) => {
    try {
      // parent içindeki o alt kategoriyi bulup databaseId'sine ulaşalım
      const parent = categories.find(c => c.databaseId === parentCategoryId || c.id === parentCategoryId);
      if (parent && parent.children) {
        const sub = parent.children.find(ch => ch.label === subLabel || ch.name === subLabel);
        if (sub) {
          const subId = sub.databaseId || sub.id;
          await deleteAdminCategory(subId);
          const updatedTree = await getCategoryTree().catch(() => getCategories());
          setCategories(updatedTree || []);
        }
      }
    } catch (err) {
      console.error("Alt kategori silinemedi:", err);
      throw err;
    }
  };

  // Ürün Ekle
  const addProduct = async (productData) => {
    try {
      const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // Kategori databaseId değerini bulalım
      const categoryObj = categories.find(c => c.id === productData.categoryId);
      const categoryIdGuid = categoryObj ? categoryObj.databaseId : productData.categoryId;

      let subcategoryIdGuid = null;
      if (productData.subcategory && categoryObj && categoryObj.children) {
        const subObj = categoryObj.children.find(ch => ch.label === productData.subcategory || ch.name === productData.subcategory);
        if (subObj) {
          subcategoryIdGuid = subObj.databaseId || subObj.id;
        }
      } else if (productData.subcategoryId) {
        subcategoryIdGuid = productData.subcategoryId;
      }

      await createAdminProduct({
        name: productData.name,
        categoryId: categoryIdGuid,
        subcategoryId: subcategoryIdGuid,
        price: parseFloat(productData.price),
        oldPrice: productData.oldPrice ? parseFloat(productData.oldPrice) : null,
        stockQuantity: productData.stockQuantity ? parseInt(productData.stockQuantity) : 10,
        shortDescription: productData.shortDescription || (productData.name + " şifa dolu mistik ürün."),
        description: productData.description || (productData.name + " şifa dolu mistik ürün."),
        imageUrls: productData.imageUrl ? [productData.imageUrl] : (productData.image ? [productData.image] : []),
        slug: slug,
        isActive: productData.isActive !== false,
        isNew: productData.isNew || false,
        isSale: productData.isSale || false,
        isFeatured: productData.isFeatured || false
      });

      // Yenile
      const productsData = await getProducts({ pageSize: 100 });
      setProducts(productsData?.items || []);
    } catch (err) {
      console.error("Ürün eklenemedi:", err);
      throw err;
    }
  };

  // Ürün Sil
  const deleteProduct = async (id) => {
    try {
      // id parametresi backend tarafında Guid olmalıdır.
      // Eyer id string/Guid değilse, listeden ürünü bulup databaseId'sini alalım
      const prod = products.find(p => String(p.id) === String(id));
      const targetId = prod ? prod.databaseId || prod.id : id;

      await deleteAdminProduct(targetId);
      
      const productsData = await getProducts({ pageSize: 100 });
      setProducts(productsData?.items || []);
    } catch (err) {
      console.error("Ürün silinemedi:", err);
      throw err;
    }
  };

  // Ürün Fiyatı Güncelle
  const updateProductPrice = async (id, newPrice) => {
    try {
      const prod = products.find(p => String(p.id) === String(id));
      const targetId = prod ? prod.databaseId || prod.id : id;

      await updateAdminProductPrice(targetId, parseFloat(newPrice));
      
      const productsData = await getProducts({ pageSize: 100 });
      setProducts(productsData?.items || []);
    } catch (err) {
      console.error("Ürün fiyatı güncellenemedi:", err);
      throw err;
    }
  };

  // Sipariş Durumu Güncelle
  const updateOrderStatusFn = async (orderId, nextStatus, nextStatusCode) => {
    try {
      // nextStatusCode: 'pending', 'preparing', 'shipping', 'delivered', 'cancelled', 'refunded'
      // Backend status'ü C# enum değerleri olarak bekliyor: Pending, Preparing, Shipped, Delivered, Cancelled, Refunded
      let statusEnum = "Pending";
      if (nextStatusCode === 'preparing') statusEnum = "Preparing";
      if (nextStatusCode === 'shipping' || nextStatusCode === 'shipped') statusEnum = "Shipped";
      if (nextStatusCode === 'delivered') statusEnum = "Delivered";
      if (nextStatusCode === 'cancelled') statusEnum = "Cancelled";
      if (nextStatusCode === 'refunded') statusEnum = "Refunded";

      await updateAdminOrderStatus(orderId, statusEnum);

      // Sipariş listesini yenile
      const adminOrders = await getAdminOrders().catch(() => null);
      if (adminOrders) {
        const mappedOrders = adminOrders.map(o => ({
          id: o.id,
          customerName: o.customerName || "Misafir Müşteri",
          customerEmail: o.customerEmail || "",
          customerPhone: o.customerPhone || "",
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
          total: (o.totalAmount || 0) + ' ₺',
          status: mapOrderStatusToTurkish(o.status),
          statusCode: String(o.status).toLowerCase(),
          items: (o.items || []).map(it => ({
            name: it.productName || "Ürün",
            qty: it.quantity,
            price: (it.unitPrice || 0) + ' ₺'
          }))
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Sipariş durumu güncellenemedi:", err);
      throw err;
    }
  };

  // Slayt (İlan/Banner) Ekle
  const addSlide = async (slideData) => {
    try {
      await createAdminBanner({
        title: slideData.title,
        subtitle: slideData.subtitle || "",
        image: slideData.image,
        imageMobile: slideData.image,
        cta: slideData.cta || "Keşfet",
        href: slideData.href || "/urunler",
        sortOrder: 0,
        isActive: true
      });

      // Yenile
      const bannersData = await getBanners();
      const mappedSlides = (bannersData || []).map(b => ({
        id: b.id,
        title: b.title || b.cta || "Kampanya",
        subtitle: b.subtitle || "",
        cta: b.cta || "Keşfet",
        href: b.href || "/urunler",
        image: b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        imageMobile: b.imageMobile || b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        isActive: b.isActive ?? true
      }));
      setSlides(mappedSlides);
    } catch (err) {
      console.error("Afiş eklenemedi:", err);
      throw err;
    }
  };

  // Slayt Sil
  const deleteSlide = async (id) => {
    try {
      await deleteAdminBanner(id);
      
      // Yenile
      const bannersData = await getBanners();
      const mappedSlides = (bannersData || []).map(b => ({
        id: b.id,
        title: b.title || b.cta || "Kampanya",
        subtitle: b.subtitle || "",
        cta: b.cta || "Keşfet",
        href: b.href || "/urunler",
        image: b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        imageMobile: b.imageMobile || b.image || "https://www.aromantra.com/data/include/img/links/1774962684_rwd_desktop.jpg",
        isActive: b.isActive ?? true
      }));
      setSlides(mappedSlides);
    } catch (err) {
      console.error("Afiş silinemedi:", err);
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{
      categories,
      products,
      orders,
      slides,
      loading,
      error,
      refreshData: loadInitialData,
      addCategory,
      deleteCategory,
      addSubcategory,
      deleteSubcategory,
      addProduct,
      deleteProduct,
      updateOrderStatus: updateOrderStatusFn,
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
