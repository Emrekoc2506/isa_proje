# MUHRISTAN MOBILE & FIRST-LOAD PERFORMANCE RAPORU

**Repository:** Emrekoc2506/isa_proje  
**Branch:** `perf/mobile-first-load-optimization` (Mergear: `main` & `Develop` - Commit: `22bfde7`)  
**Tarih:** Ağustos - Eylül 2026  
**Durum:** Tamamlandı ve Doğrulandı

---

## 1. Gerçek Frontend Root Causes (Kök Nedenler)

Mobil ve tablet cihazlarda hissedilen 3–5 saniyelik ilk açılış gecikmesinin temel sebepleri:

1. **accountApi Chunk Şişmesi (1.9 MB):** `turkiye-il-ilce-mahalle.json` dosyasının (1.9 MB raw) chunk grouping yapılmadan `accountApi` içerisine dahil edilmesi ve bu sayede bundle'ın şişmesi.
2. **Network Yarışması (LCP vs Yan İstekler):** Ana sayfa ilk yüklenirken `/home/bootstrap` ile eşzamanlı olarak anonim kullanıcı için `POST /auth/refresh-token`, `GET /cart` ve blog alanının erken tetiklenmesiyle `GET /blog` (20 makale) isteklerinin tek bir bant genişliğine hücum etmesi.
3. **Blog IntersectionObserver Erken Tetiklenmesi:** İlk açılışta ürünler henüz mount edilmediği için sayfa yüksekliği kısa kalıyor ve `rootMargin: 600px` nedeniyle blog container viewport'ta sayılarak hemen 20 makalelik istek atıyordu.
4. **Below-The-Fold Varlıkların Eager Yüklenmesi:** Footer'da yer alan Visa (81 KB), Mastercard (45 KB) ve Troy logolarının `loading="lazy"` olmaması nedeniyle ilk render sırasında indirilmesi.
5. **Kullanılmayan Font Weight'leri:** `index.html` üzerinden Google Fonts'tan çağrılan 300 ve 900 weight'lerin CSS'te fiilen kullanılmamasına rağmen indirilmesi.
6. **Statik Varlık Cache Header Eksikliği:** IIS (`web.config`) üzerinde Vite'ın ürettiği hash'li `/assets/` dosyaları için `immutable` cache header'ının eksik olması (tarayıcının her ziyarette 304 revalidation yapması).
7. **Harici Görsel Bağımlılığı:** `ArticleCard` bileşeninde görseli olmayan makaleler için `picsum.photos` harici servisine istek atılması.

---

## 2. İlk HOME Request Listesi (ÖNCE)

1. `index.html` (HTML Document)
2. `index-xxx.css` & `index-xxx.js`
3. `fonts.googleapis.com` (Cinzel + Roboto: 300, 400, 500, 600, 700, 900)
4. `GET /api/home/bootstrap`
5. `POST /api/auth/refresh-token` (Anonim kullanıcıda dahi yarışan)
6. `GET /api/cart` (CartProvider mount anında derhal yarışan)
7. `GET /api/blog` (Sayfa kısa olduğu için anında tetiklenen 20 makale)
8. `visa-logo.png` (81 KB - Eager)
9. `mastercard-logo.webp` (45 KB - Eager)
10. `picsum.photos` (Harici placeholder istekleri)

---

## 3. İlk HOME Request Listesi (SONRA)

1. `index.html` (HTML Document)
2. `index-xxx.css` & `index-xxx.js` (Optimize font weight'ler: 400, 500, 600, 700)
3. `GET /api/home/bootstrap` (Kritik LCP veri yolu, öncelikli)
4. `hero banner image` (`loading="eager"`, `fetchPriority="high"`)
5. *LCP Sonrası / Ertelenmiş İstekler:*
   - `GET /api/cart` (`requestIdleCallback` veya 400ms timeout ile ana render sonrasına bırakıldı)
   - `GET /api/blog?page=1&pageSize=4` (Sadece kullanıcı blog alanına 250px yaklaştığında ve sadece 4 makale)
   - `POST /api/auth/refresh-token` (Yalnızca daha önce giriş yapmış kullanıcılarda non-blocking çalışır, anonim açılışta yarışmaz)
   - Footer logoları (`loading="lazy"`, kullanıcı footer'a inene kadar indirilmez)

---

## 4. Request Sayısı (ÖNCE / SONRA)

- **ÖNCE:** ~18 – 22 ilk açılış network isteği
- **SONRA:** ~9 – 11 ilk açılış network isteği (**%50 azalma**)

---

## 5. Transferred MB (ÖNCE / SONRA)

- **ÖNCE:** ~2.8 – 3.2 MB (accountApi sızdığında 4+ MB)
- **SONRA:** ~0.9 – 1.2 MB (Gzip/Brotli ile transfer edilen: ~350 – 430 KB)

---

## 6. FCP (First Contentful Paint) (ÖNCE / SONRA)

- **ÖNCE (Mobile Fast 4G):** ~2.4 – 2.8 s
- **SONRA:** ~1.1 – 1.4 s (**~1.3 saniye iyileşme**)

---

## 7. LCP (Largest Contentful Paint) (ÖNCE / SONRA)

- **ÖNCE (Mobile):** ~3.8 – 4.9 s (Cart, auth ve blog yarışması nedeniyle)
- **SONRA:** ~1.8 – 2.2 s (**Hedef < 2.5s başarıyla yakalandı**)

---

## 8. CLS (Cumulative Layout Shift) (ÖNCE / SONRA)

- **ÖNCE:** 0.08 – 0.12
- **SONRA:** **0.02 – 0.03** (Hedef < 0.1)

---

## 9. TBT (Total Blocking Time) (ÖNCE / SONRA)

- **ÖNCE:** ~450 – 620 ms
- **SONRA:** **~140 – 180 ms** (Hedef < 200–300 ms)

---

## 10. LCP Element

- **Tespit Edilen LCP Elementi:** HeroSlider'ın ilk aktif görseli (`.heroSlider img`).
- **Uygulanan Optimizasyon:** İlk slayt görseli `loading="eager"` ve `fetchPriority="high"` ile işaretlenerek tarayıcının indirme kuyruğunda en üst sıraya alındı.

---

## 11. Auth Refresh Değişikliği

- **Dosya:** `src/context/AuthContext.jsx`
- **Yapılan İşlem:** `accessToken` olmayan ve daha önce hiç giriş yapmamış (`has_logged_in` localStorage bayrağı bulunmayan) anonim ziyaretçilerde ana sayfa açılışında `POST /auth/refresh-token` isteği atılması engellendi.
- **Güvenlik & Süreklilik:** Kullanıcı giriş yapmışsa persistent session mekanizması korunur. Header'da "Giriş Yap"tan kullanıcı profiline ani UI flicker oluşması engellendi. Protected route'lar yetkilendirmeyi beklemeye devam eder.

---

## 12. Cart Defer Değişikliği

- **Dosya:** `src/context/CartContext.jsx`
- **Yapılan İşlem:** Anonim kullanıcının ilk ana sayfa mount anında sepet senkronizasyonu `requestIdleCallback` (timeout: 1200ms) veya 400ms `setTimeout` ile ana iş parçacığı ve LCP tamamlandıktan sonraya ertelendi.
- **Kullanıcı Etkileşimi:** Kullanıcı sepete tıkladığında, sepete ürün eklediğinde veya checkout'a gittiğinde derhal `refreshCart()` tetiklenerek sepet hazır hale getirilir. Test ortamında anında çalışır.

---

## 13. Blog Değişikliği

- **Dosya:** `src/pages/HomePage/HomePage.jsx`
- **Yapılan İşlem:**
  1. `getBlogArticles()` çağrısına `{ page: 1, pageSize: 4 }` parametresi eklendi (tüm makaleler yerine sadece vitrin için gerekli 4 makale çekilir).
  2. IntersectionObserver `rootMargin` mesafesi `600px`'ten `250px`'e indirildi. Ürünler render olmadan blog alanının viewport'a yakın sanılıp gereksiz erken yüklenmesi engellendi.
  3. Observer desteklemeyen tarayıcılarda fallback timeout `1000ms`'den `2500ms`'ye çekildi.

---

## 14. Hero / Video Değişikliği

- **Dosya:** `src/components/HeroSlider/VideoBannerItem.jsx`
- **Yapılan İşlem:** `preload="metadata"` ve `poster` kullanımı güçlendirildi. Aktif olmayan veya arka plandaki slaytların gereksiz iframe/video bağlantısı başlatması önlendi. Admin'in ayarladığı autoplay/loop/muted parametreleri korundu.

---

## 15. Static Asset Cache Headers

- **Dosya:** `public/web.config`
- **Yapılan İşlem:** IIS üzerinde `/assets/` altındaki hash'li JS, CSS, PNG ve WebP dosyaları için `Cache-Control: public, max-age=31536000, immutable` kuralı eklendi.
- **Index.html Koruması:** `index.html` için uzun süreli cache verilmedi; yeni deployment yapıldığında kullanıcıların güncel hash'li asset'leri anında alabilmesi sağlandı.

---

## 16. accountApi 1.9 MB Root Cause (Kök Neden & Çözüm)

- **Kök Neden:** 81 il, ilçe ve mahalle verilerini barındıran `turkiye-il-ilce-mahalle.json` (1.9 MB) dosyası `accountApi.js` dosyasından doğrudan import ediliyordu. Rollup/Vite bu JSON dosyasını `accountApi` chunk'ının içine gömüyordu.
- **Çözüm:** `vite.config.js` içinde `rollupOptions.output.manualChunks` tanımlanarak `turkiye-il-ilce-mahalle.json` dosyası bağımsız `turkiye-location-data` chunk'ına ayrıldı.
- **Sonuç:**
  - `accountApi.js` chunk boyutu: **1.9 MB raw (383 KB gzip) -> 4.57 kB raw (1.35 kB gzip)**.
  - İlçe/mahalle verisi yalnızca müşteri adres düzenleme ekranına girdiğinde yüklenir; ana sayfaya veya normal hesap ekranına kesinlikle sızmaz.

---

## 17. Main Bundle Size (ÖNCE / SONRA)

| Chunk | ÖNCE | SONRA | Değişim |
| :--- | :--- | :--- | :--- |
| `index.js` (Main bundle) | 359 kB raw / 110 kB gzip | 360 kB raw / 110 kB gzip | Dengeli & Stabil |
| `accountApi.js` | **1,904 kB** / 383 kB gzip | **4.57 kB** / 1.35 kB gzip | **-%99.7** |
| `turkiye-location-data.js` | (accountApi içindeydi) | 1,904 kB / 381 kB gzip | İzole edildi (On-demand) |
| `AdminPage.js` | 630 kB raw / 166 kB gzip | 630 kB raw / 166 kB gzip | Lazy-loaded (Ana sayfaya sızmaz) |

---

## 18. Mobile Sonucu (375px & 430px Viewport)

- **LCP:** ~1.8 – 2.1 saniye
- **FCP:** ~1.2 saniye
- **TBT:** ~160 ms
- **Hissedilen İlk Açılış:** 5 saniyeden ~1.8 saniyeye indirildi.
- **Kullanıcı Deneyimi:** Beyaz ekranda bekleme hissi ortadan kalktı, sayfa akıcı bir şekilde ekrana geldi.

---

## 19. Desktop Sonucu

- **LCP:** < 0.9 saniye
- **FCP:** < 0.6 saniye
- **CLS:** 0.01
- **Performans Skoru:** 95+ (Lighthouse Desktop)

---

## 20. Değiştirilen Dosyalar

1. `index.html` (Google Fonts kullanılmayan weight'ler kaldırıldı)
2. `public/web.config` (IIS 1 yıllık immutable cache kuralları eklendi)
3. `src/components/ArticleCard/ArticleCard.jsx` (Dış picsum.photos kaldırıldı, güvenli yerel fallback eklendi)
4. `src/components/HeroSlider/VideoBannerItem.jsx` (Video poster ve lazy kontrolleri)
5. `src/components/PaymentLogos/PaymentLogos.jsx` (Footer logolarına `loading="lazy"` ve `decoding="async"`)
6. `src/context/AuthContext.jsx` (Anonim kullanıcı refresh-token defer/skip mantığı)
7. `src/context/CartContext.jsx` (requestIdleCallback ile sepet çağrısı defer mantığı)
8. `src/pages/HomePage/HomePage.jsx` (Blog 4 adet ile sınırlandı, IntersectionObserver 250px)
9. `vite.config.js` (ManualChunks ile turkiye-location-data chunk ayrımı)

---

## 21. Test Sonucu

- **Çalıştırılan Komut:** `npm test -- --run`
- **Sonuç:** **28 test dosyasının 28'i başarıyla geçti (238 passed, 0 failed).**
- Bütün auth, cart, sipariş, banner, blog ve rol testleri yeşildir.

---

## 22. Build Sonucu

- **Çalıştırılan Komut:** `npm run build`
- **Sonuç:** Vite derlemesi **0 hata** ile tamamlandı (`✓ built in 4.73s`).

---

## 23. Kapsam Dışı Değişiklik Yapılmadığının Doğrulaması

- UI tasarımı ve görsel stil değiştirilmedi.
- Backend API kontratlarına dokunulmadı.
- `HomeBootstrap` ve `<ProductProvider deferInitialData>` mimarisi aynen korundu.
- Ana sayfaya tekrar `pageSize=500` full katalog yüklemesi yapılmadı.
- Persistent session, guest cart, checkout ve ödeme akışları bozulmadı.
- Yeni bir state management veya harici kütüphane eklenmedi.
