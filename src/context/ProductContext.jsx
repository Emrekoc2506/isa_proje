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
  navCategories as mockCategories
} from '../data/index';

const INITIAL_SLIDES = [];

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  // İlk yüklemede boş gelmemesi için mock verilerle başlatıyoruz (Stale-While-Revalidate)
  const [categories, setCategories] = useState(mockCategories || []);
  const [products, setProducts] = useState([]);
  const [slides, setSlides] = useState(INITIAL_SLIDES);
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
        getBanners(),
        getProducts({ pageSize: 100 }).catch(() => ({ items: [] }))
      ]);

      setCategories(categoriesData || []);
      setProducts(productsData?.items || []);
      
      // Slaytları/Bannerları map edelim (backend formatı -> frontend formatı)
      const mappedSlides = (bannersData || [])
        .map(b => ({
          id: b.id,
          title: b.title ?? "",
          subtitle: b.subtitle ?? "",
          imageUrl: b.imageUrl ?? b.image ?? "",
          mobileImageUrl: b.imageMobile ?? b.imageMobileUrl ?? "",
          href: b.href ?? b.linkUrl ?? "",
          cta: b.cta ?? "",
          sortOrder: Number(b.sortOrder ?? 0),
          isActive: b.isActive ?? true
        }))
        .filter(item => item.imageUrl)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      setSlides(mappedSlides);
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
