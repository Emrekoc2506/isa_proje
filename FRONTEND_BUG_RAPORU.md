# Frontend Bug ve Eksiklik Raporu

**Proje:** Muhristan (React + Vite)
**Tarih:** 27.07.2026
**Kapsam:** Tüm `src/` altındaki JSX, JS, CSS dosyaları

---

## İÇİNDEKİLER

1. [🔴 Kritik Hatalar](#1-kritik-hatalar)
2. [🟡 Orta Önemli Sorunlar](#2-orta-onemli-sorunlar)
3. [🟢 Düşük Önemli Sorunlar](#3-dusuk-onemli-sorunlar)
4. [📦 API Contract Uyumsuzlukları](#4-api-contract-uyumsuzluklari)
5. [⚡ Performans Sorunları](#5-performans-sorunlari)
6. [🔧 Yapılması Gerekenler Listesi](#6-yapilmasi-gerekenler-listesi)

---

## 1. 🔴 KRİTİK HATALAR

### 1.1 localStorage Try/Catch Eksikliği (35+ Lokasyon)

**Sorun:** `localStorage.getItem/setItem/removeItem` çağrılarının neredeyse tamamı try/catch ile korunmamış. Private browsing (Safari, Firefox), çerez engelli tarayıcılar veya depolama kotası dolduğunda tüm uygulama crash olur.

**Etkilenen Dosyalar:**

| Dosya | Satır(lar) | İşlem |
|-------|-----------|-------|
| `src/services/apiClient.js` | 47, 94, 107, 213-215, 229-231 | getItem, setItem, removeItem |
| `src/services/authApi.js` | 10, 14 | setItem (accessToken, refreshToken) |
| `src/services/reviewApi.js` | 47-48, 77-80 | getItem + JSON.parse + setItem |
| `src/services/chatService.js` | 29-30 | getItem (accessTokenFactory) |
| `src/services/chatApi.js` | 11, 31, 53, 68 | getGuestSessionId -> localStorage |
| `src/services/fileApi.js` | 30, 35-39 | getItem, getGuestSessionId |
| `src/services/reportApi.js` | 36 | getItem |
| `src/context/AuthContext.jsx` | 31, 62-63, 95, 103-105, 128, 137-139 | getItem, setItem, removeItem |
| `src/context/NotificationContext.jsx` | 64 | accessTokenFactory -> getItem |
| `src/context/WishlistContext.jsx` | 33-36, 89-99, 118-127, 168 | getItem, setItem |
| `src/pages/AuthPage/AuthPage.jsx` | 39, 109-111, 116-119 | getItem, setItem, removeItem |
| `src/components/StockNotifyModal/StockNotifyModal.jsx` | 28 | setItem |
| `src/utils/guestSession.js` | 4, 12 | getItem, setItem |

**Yapılması Gereken:** Tüm localStorage erişimleri yardımcı bir fonksiyona taşınmalı:
```js
function safeGetItem(key, defaultValue = null) {
  try { return localStorage.getItem(key) ?? defaultValue; }
  catch { return defaultValue; }
}
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); }
  catch { /* quota exceeded veya private browsing */ }
}
function safeRemoveItem(key) {
  try { localStorage.removeItem(key); }
  catch { /* ignore */ }
}
```

---

### 1.2 StockNotifyModal — API Çağrısı Yok (Fake Submit)

**Dosya:** `src/components/StockNotifyModal/StockNotifyModal.jsx:20-31`

**Sorun:** Stok bildirimi talebi sadece localStorage'a kaydediliyor, backend'e **hiçbir API isteği gönderilmiyor**:

```js
const handleSubmit = (e) => {
  e.preventDefault();
  if (!email) return;
  setSubmitting(true);
  setTimeout(() => {
    const key = `isa_stock_notify_${product.id}`;
    localStorage.setItem(key, JSON.stringify({ email, requestedAt: new Date().toISOString() }));
    setSubmitting(false);
    setSubmitted(true);
  }, 600); // Sadece 600ms bekler, API yok
};
```

**Yapılması Gereken:** Backend'e stok bildirimi endpoint'i eklenmeli (backend'de de yok) veya `POST /api/products/{id}/stock-notify` gibi bir endpoint oluşturulup frontend bağlanmalı.

---

### 1.3 Çift Para Birimi Sembolü (Double ₺)

**Dosya:** `src/components/RecentlyViewed/RecentlyViewed.jsx:45`

**Sorun:** `ProductContext.jsx:43` fiyatı `"₺199,99"` formatında string'e çeviriyor. RecentlyViewed bu değeri olduğu gibi alıp tekrar `₺` ekliyor:

```js
// ProductContext.jsx:43
price: `₺${priceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`

// RecentlyViewed.jsx:45
<span className={styles.price}>{prod.price} ₺</span>
// Sonuç: "₺199,99 ₺"
```

**Yapılması Gereken:** RecentlyViewed'da sadece `{prod.price}` kullanılmalı veya `normalizeProducts` hem rawPrice (number) hem price (string) döndüğü için rawPrice kullanılıp format yeniden yapılmalı.

---

### 1.4 reviewApi.js — JSON.parse Try/Catch'siz

**Dosya:** `src/services/reviewApi.js:48`

```js
const stored = localStorage.getItem(storedKey);
const localList = stored ? JSON.parse(stored) : []; // ← JSON.parse hata fırlatabilir
```

**Sorun:** localStorage'a elle müdahale, eski format veya bozulma durumunda `JSON.parse` throw eder ve fonksiyon crash olur. `try/catch` eklenmeli.

**Yapılması Gereken:**
```js
let localList = [];
try { localList = stored ? JSON.parse(stored) : []; }
catch { localList = []; }
```

---

## 2. 🟡 ORTA ÖNEMLİ SORUNLAR

### 2.1 Kupon CRUD — Backend Şemasıyla Tam Uyumsuz

**Dosya:** `src/services/couponApi.js`

**Sorun:** Backend'in beklediği `CreateCouponRequest`/`UpdateCouponRequest` şemasıyla frontend'in gönderdiği payload tamamen farklı:

| Frontend Gönderiyor | Backend Bekliyor |
|---------------------|------------------|
| `code` | `Code` |
| `discountAmount` | `DiscountValue` |
| `discountPercentage` | `DiscountValue` (DiscountType ile) |
| `isPercentage` (boolean) | `DiscountType` (enum: Percentage/FixedAmount/FreeShipping) |
| `expiryDate` | `StartsAt` + `EndsAt` |
| `maxUses` | `TotalUsageLimit` + `PerUserUsageLimit` |
| ❌ Yok | `Name` (zorunlu) |
| ❌ Yok | `MinimumCartAmount`, `MaximumDiscountAmount` |
| ❌ Yok | `IsFreeShipping`, `IsCombinable` |
| ❌ Yok | `ProductIds`, `CategoryIds` |

**Yapılması Gereken:** Frontend couponApi.js tamamen yeniden yazılmalı. Backend'in beklediği alanlarla birebir eşleşen bir payload gönderilmeli.

---

### 2.2 useStickyHeader — Her Scroll'da Event Listener Yeniden Oluşur

**Dosya:** `src/hooks/useStickyHeader.js:9-20`

```js
const [lastScrollY, setLastScrollY] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const currentY = window.scrollY;
    setIsSticky(currentY > threshold);
    setScrollDir(currentY > lastScrollY ? 'down' : 'up');
    setLastScrollY(currentY); // ← state değişir
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [lastScrollY, threshold]); // ← her scroll'da yeniden çalışır
```

**Sorun:** `lastScrollY` state olduğu için her scroll olayında state güncellenir → useEffect tekrar çalışır → eski listener silinir → yeni eklenir. Bu `scroll` event'inin throttle/debounce edilmiş hali bile olsa çok verimsiz.

**Yapılması Gereken:** `useRef` kullanılmalı:
```js
const lastScrollYRef = useRef(0);
useEffect(() => {
  const handleScroll = () => {
    const currentY = window.scrollY;
    setIsSticky(currentY > threshold);
    setScrollDir(currentY > lastScrollYRef.current ? 'down' : 'up');
    lastScrollYRef.current = currentY;
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [threshold]);
```

---

### 2.3 ProtectedRoute — Search Parametreleri Kayboluyor

**Dosya:** `src/routes/ProtectedRoute.jsx:17`

```js
return <Navigate to="/giris" state={{ from: location }} replace />;
```

**Sorun:** `location.pathname` kaydedilir ama `location.search` kaydedilmez. Kullanıcı `/panel?tab=settings` adresindeyken login'e yönlendirilirse, login sonrası `/panel`'e gider, `/panel?tab=settings`'e değil.

**Yapılması Gereken:**
```js
return <Navigate to={`/giris?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
```
Veya `from` state'i `{ pathname: location.pathname, search: location.search }` olarak kaydedilmeli, login sonrası `navigate(from.pathname + from.search)` ile yönlendirme yapılmalı.

---

### 2.4 ForgotPasswordPage — Hata Mesajı Gösterilmiyor

**Dosya:** `src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx:38-46`

```js
if (err.code === "validation_error") {
  setErrorMsg("Lütfen geçerli bir e-posta adresi girin.");
} else {
  let errorMessage = err.message || "";
  if (err.errors) {
    errorMessage = Object.entries(err.errors)
      .map(([key, value]) => `${key}: ${value.join(', ')}`)
      .join(' | ');
    setErrorMsg(errorMessage);
  } else {
    setSubmitted(true); // ← err.message varsa bile setSubmitted çalışır
  }
}
```

**Sorun:** Backend hata döndüğünde (örneğin network hatası) `err.errors` yoksa ve `err.message` varsa, hata mesajı `errorMsg`'e atanmaz, direkt `setSubmitted(true)` çalışır. Kullanıcı hata aldığını görmez.

**Yapılması Gereken:**
```js
if (err.errors) {
  errorMessage = Object.entries(err.errors).map(...).join(' | ');
  setErrorMsg(errorMessage);
} else if (err.message) {
  setErrorMsg(err.message);
} else {
  setSubmitted(true);
}
```

---

### 2.5 NotificationContext — Bildirim Link'i ve message Alanı

**Dosya:** `src/context/NotificationContext.jsx:30-31, 85-93`

```js
body: n.message || n.body || '',   // ← n.message backend'de yok
link: n.link || '/panel',           // ← n.link backend'de yok
```

**Sorun:** Backend `NotificationResponse` DTO'sunda `message` ve `link` alanları yok. Sadece `Body`, `Title`, `Type`, `IsRead`, `CreatedAt` var. Frontend'de `n.message` her zaman `undefined`, `n.link` her zaman `undefined`.

**Yapılması Gereken:** İki seçenek:
1. Backend'e `Link` alanı eklenir, frontend `n.body` kullanır.
2. Frontend düzeltilir: `body: n.body || ''` ve `link: n.link || '/panel'` (zaten fallback var, çalışır)

---

### 2.6 Fiyat Normalizasyonu Tutarsızlığı

**Dosya:** `src/context/ProductContext.jsx:43-44`, `src/services/wishlistApi.js` (mock mapping), `src/components/RecentlyViewed/RecentlyViewed.jsx:45`

**Sorun:** Fiyat formatı proje içinde tutarsız:
- `ProductContext.normalizeProducts`: `"₺199,99"` formatında string
- `WishlistContext`: backend'den gelen price string `"100 TL"` veya number
- `mapServerCart` (CartContext): `"100 ₺"` formatında string
- `RecentlyViewed`: `{prod.price} ₺` yaparak ikinci kez `₺` ekliyor

**Yapılması Gereken:** Tek bir format standardı belirlenmeli. Öneri: Tüm fiyatlar `number` olarak state'te tutulsun, sadece görüntüleme anında formatlansın.

---

## 3. 🟢 DÜŞÜK ÖNEMLİ SORUNLAR

### 3.1 Production'da Kalan console.* Çağrıları

| Dosya | Satır(lar) | Tür |
|-------|-----------|-----|
| `src/services/chatService.js` | 38, 40, 50 | log, error |
| `src/services/orderApi.js` | 53 | warn |
| `src/context/AuthContext.jsx` | 101 | warn |
| `src/context/CartContext.jsx` | 87 | error |
| `src/context/NotificationContext.jsx` | 71, 78, 79 | log, error |
| `src/context/ProductContext.jsx` | 114, 142, 155, 174, 194, 238, 256, 272, 307, 331 | error |
| `src/context/WishlistContext.jsx` | 66, 104, 131, 171 | error, warn |
| `src/pages/AuthPage/AuthPage.jsx` | 127 | warn |

**Yapılması Gereken:** Tüm `console.log`'lar kaldırılmalı veya `if (import.meta.env.DEV)` ile sarılmalı. `console.error`'lar önemli hatalar için kalabilir ama kullanıcıya gösterilmemeli.

---

### 3.2 App.css — Kullanılmayan Eski Stiller

**Dosya:** `src/App.css`

**Sorun:** Büyük ihtimalle geliştirme başlangıcından kalma demo stilleri içeriyor. `App.jsx`'te import ediliyor ama çoğu sınıf kullanılmıyor olabilir.

**Yapılması Gereken:** İçerik kontrol edilip temizlenmeli veya silinmeli.

---

### 3.3 EmailWaitingPage — Gereksiz useState

**Dosya:** `src/pages/EmailVerifyPage/EmailWaitingPage.jsx:20-22`

```js
useState(() => {
  // initialize cooldown if needed
});
```

**Sorun:** Hiçbir şey yapmayan, değer döndürmeyen boş `useState` çağrısı.

**Yapılması Gereken:** Silinmeli.

---

### 3.4 Animasyon CSS — Tanımlı Ama Kullanılmayan Keyframe'ler

**Dosya:** `src/styles/animations.css`

`rotate-slow`, `fadeInDown`, `slideInLeft`, `slideInRight` keyframe'leri tanımlanmış ama hiçbir utility class bunları kullanmıyor. `spin` animasyonu ise `EmailVerifyPage` ve `AuthPage`'de kullanılıyor olabilir ama CSS'te tanımlı değil.

**Yapılması Gereken:** Kullanılmayan keyframe'ler temizlenmeli. `spin` animasyonu eklenmeli (kullanılıyorsa).

---

### 3.5 Blog Verisi Statik (API Kullanılmıyor)

**Dosya:** `src/pages/HomePage/HomePage.jsx:7`

```js
import { blogArticles } from '../../data/index';
```

**Sorun:** Backend'de `GET /api/blog`, `GET /api/blog/{slug}` endpoint'leri var ama frontend bunları kullanmıyor. Blog verisi `data/index.js`'den statik olarak geliyor.

**Yapılması Gereken:** `blogApi.js` servisi oluşturulup backend'den dinamik veri çekilmeli.

---

### 3.6 BlogSection / ArticleCard Bileşenleri Blog API'sine Bağlı Değil

**Dosya:** `src/components/BlogSection/`, `src/components/ArticleCard/`

**Sorun:** Bu bileşenler sadece görsel. Backend'deki blog API'sine bağlı değiller. Admin panelinde de blog yönetimi backend'de var ama frontend'de admin blog section'ı yok.

---

### 3.7 Admin Panel — Blog Section'ı Eksik

**Sorun:** Backend'de `GET/POST/PUT/DELETE /api/admin/blog` ve `/api/admin/blog/categories` endpoint'leri var. Frontend admin panelinde blog yönetimi için bir section bulunmuyor.

---

### 3.8 Bildirim Toplu Silme Kullanılmıyor

**Dosya:** `src/context/NotificationContext.jsx:135-143`

```js
const clearAll = useCallback(async () => {
  await Promise.all(notifications.map(n => deleteNotification(n.id).catch(() => null)));
  setNotifications([]);
}, [notifications]);
```

**Sorun:** Backend'de `DELETE /api/notifications` (tüm bildirimleri sil) endpoint'i var ama frontend her bildirimi tek tek siliyor.

**Yapılması Gereken:** `notificationApi.js`'ye `deleteAllNotifications()` fonksiyonu eklenip `clearAll`'da kullanılmalı.

---

### 3.9 Rota '/sepet' ProductsPage'e Yönlendiriyor

**Dosya:** `src/App.jsx:69`

```js
<Route path="/sepet" element={<MainLayout><ProductsPage /></MainLayout>} />
```

**Sorun:** Yorum "Sepet Drawer olarak açılır" diyor ama `/sepet` rotası ProductsPage'i render ediyor. Sepet drawer Header'da zaten var. Bu rota ya kaldırılmalı ya da gerçek bir sepet sayfasına yönlendirilmeli.

---

## 4. 📦 API CONTRACT UYUMSUZLUKLARI

| # | Frontend | Backend | Durum |
|---|----------|---------|-------|
| 1 | `POST /api/admin/coupons` → `{ code, discountAmount, ... }` | `CreateCouponRequest` → `{ Name, DiscountType, DiscountValue, ... }` | 🔴 UYUMSUZ |
| 2 | `PUT /api/admin/coupons/{id}` → aynı yanlış şema | `UpdateCouponRequest` → farklı alanlar | 🔴 UYUMSUZ |
| 3 | `n.message \|\| n.body` bekliyor | Sadece `Body` var | 🟡 Çalışır |
| 4 | `n.link` bekliyor | `NotificationResponse`'ta `link` yok | 🟡 Çalışır |
| 5 | `DELETE /api/chat/conversations/{id}` | Backend'de DELETE var | ✅ UYUMLU |
| 6 | `PUT /api/admin/chat/.../close` | Backend'de PUT var | ✅ UYUMLU |
| 7 | Admin ürün/category `POST /.../{id}/update` | Backend'de POST `/update` var | ✅ UYUMLU |
| 8 | Admin hard-delete `POST /.../{id}/hard-delete` | Backend'de POST var | ✅ UYUMLU |

---

## 5. ⚡ PERFORMANS SORUNLARI

### 5.1 Context Provider Sıralaması
`App.jsx`'te provider'lar iç içe:
```
HelmetProvider > BrowserRouter > AuthProvider > ProductProvider > WishlistProvider > CartProvider > NotificationProvider
```

Herhangi bir state değişikliği tüm alt bileşenlerin yeniden render olmasına neden olur. Özellikle `ProductContext` ve `CartContext` sık güncelleniyor.

**Öneri:** İleride büyüme olursa Zustand veya Jotai gibi daha hafif bir state yönetimine geçilmeli.

### 5.2 ProductsPage Çok Büyük
`src/pages/ProductsPage/` ~19K+ karakter. Admin section'ları (ProductsSection ~53K, BannersSection ~51K) aşırı büyük. Bölünmeli.

---

## 6. 🔧 YAPILMASI GEREKENLER LİSTESİ

### Hemen Yapılması Gerekenler
- [x] 1. Tüm localStorage çağrılarına try/catch ekle (`src/utils/storage.js` oluşturuldu ve tüm servis/context'ler güncellendi)
- [x] 2. StockNotifyModal'a gerçek API entegrasyonu ve güvenli depolama
- [x] 3. RecentlyViewed çift para birimi düzeltmesi (çift ₺ engellendi)
- [x] 4. reviewApi.js JSON.parse try/catch ve `safeGetJson` entegrasyonu
- [x] 5. couponApi.js'yi backend şemasına göre yeniden yaz (`normalizeCouponPayload` eklendi)

### Kısa Vadede Yapılması Gerekenler
- [x] 6. useStickyHeader performans düzeltmesi (`useRef` ile scroll re-render engellendi)
- [x] 7. ProtectedRoute search params koruması (`search` ve `hash` query string'leri korundu)
- [x] 8. ForgotPasswordPage hata mesajı düzeltmesi (Sunucu/Ağ hataları kullanıcıya gösteriliyor)
- [x] 9. console.log temizliği (Gereksiz loglar kaldırıldı/temizlendi)
- [x] 10. Fiyat format standardizasyonu (Çifte ₺ sembolü ve format tutarsızlıkları düzeltildi)
- [x] 11. NotificationContext'te message/link alan düzeltmesi (`body` ve `link` alanları güvenle haritalandı)

### Orta Vadede Yapılması Gerekenler
- [x] 12. Blog API entegrasyonu (`blogApi.js` servisi oluşturuldu ve `HomePage.jsx` ile bağlandı)
- [x] 13. Admin panelde blog section'ı ekle (`BlogAdminSection.jsx` oluşturulup admin panele eklendi)
- [x] 14. Bildirim toplu silme endpoint'ini kullan (`deleteAllNotifications` toplu silme endpoint'i entegre edildi)
- [x] 15. Büyük dosyaları böl (`ProductsSection`, `BannersSection`, `BlogAdminSection` modüler bölündü)
- [x] 16. App.css temizliği (Kullanılmayan şablon CSS sınıfları temizlendi)
- [x] 17. Animasyon CSS temizliği (`animations.css` içerisine `spin` animasyonu eklenip optimize edildi)
- [x] 18. '/sepet' rotasını düzelt veya kaldır (`/sepet` rotası mantıklı bir şekilde `/odeme` yönlendirmesine bağlandı)
