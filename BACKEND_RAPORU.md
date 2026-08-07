# 🛡️ Muhristan Backend (IsaShopAPI) Kapsamlı Teknik & Güvenlik Raporu

**Proje:** IsaShopAPI (.NET 8 Web API - Clean Architecture)  
**Tarih:** 06.08.2026  
**Kapsam:** `IsaShopAPI`, `IsaShop.Application`, `IsaShop.Domain`, `IsaShop.Infrastructure`, `IsaShop.Persistence`, `IsaShop.Contracts`

---

## İÇİNDEKİLER

1. [📌 Yönetici Özeti & Mimari Yapı](#1-yonetici-ozeti--mimari-yapi)
2. [💳 Ödeme Akışı (Online Ödeme Devre Dışı / Opsiyonel)](#2-odeme-akisi-online-odeme-devre-disi--opsiyonel)
3. [🔐 Güvenlik ve Yetkilendirme Denetimi](#3-guvenlik-ve-yetkilendirme-denetimi)
4. [🔌 Controller & Endpoint Detaylı İncelemesi](#4-controller--endpoint-detayli-incelemesi)
5. [🗄️ Veri Katmanı ve İndeks Optimizasyonu](#5-veri-katmani-ve-indeks-optimizasyonu)
6. [⚙️ Arka Plan İşlemleri ve Gerçek Zamanlı Servisler](#6-arka-plan-islemleri-ve-gercek-zamanli-servisler)
7. [🛠️ Canlıya Geçiş Öncelikli Aksiyon Listesi](#7-canliya-gecis-oncelikli-aksiyon-listesi)

---

## 1. 📌 Yönetici Özeti & Mimari Yapı

Backend uygulaması **.NET 8 Web API** teknolojisi kullanılarak **Clean Architecture** prensiplerine tam uygun inşa edilmiştir.

```
[ IsaShopAPI (HTTP / Controllers / SignalR / RateLimiter) ]
                          │
                          ▼
   [ IsaShop.Application (CQRS / Business Logic / FluentValidation) ]
         │                │                 │
         ▼                ▼                 ▼
[ IsaShop.Domain ]  [ IsaShop.Contracts ]  [ IsaShop.Infrastructure (JWT, SignalR, Outbox) ]
                          ▲
                          │
   [ IsaShop.Persistence (EF Core / DbContext / Migrations / Seed Data) ]
```

### Katman Sorumlulukları:
- **`IsaShop.Domain`**: `Product`, `Order`, `Customer`, `Category`, `Coupon`, `Review`, `Notification`, `ChatConversation` varlıkları, enum'lar ve domain event'lerini içerir.
- **`IsaShop.Contracts`**: İstemci ile sunucu arasındaki ortak DTO ve Request/Response modellerini tanımlar.
- **`IsaShop.Application`**: CQRS / Use Case logic, FluentValidation geçerlilik kuralları ve Result pattern arayüzleridir.
- **`IsaShop.Persistence`**: Entity Framework Core `IsaDbContext`, Soft-Delete, Concurrency Tokens ve Seed Data katmanıdır.
- **`IsaShop.Infrastructure`**: JWT üretimi, e-posta gönderimi, SMS/WhatsApp servisleri ve Outbox Background Worker'ları yürütür.
- **`IsaShopAPI`**: RESTful API uç noktaları, SignalR canlı sohbet ve bildirim Hub'ları, Rate Limiter ve Global Exception Handling middleware'ini barındırır.

---

## 2. 💳 Ödeme Akışı (Online Ödeme Devre Dışı / Opsiyonel)

Kullanıcı tercihine istinaden **İyzipay / Sanal POS online ödeme entegrasyonu şu aşamada zorunlu tutulmamaktadır**:
- Online Kart seçilirse backend yapılandırılmış Iyzico akışı kullanılır; initialization başarısızlığı manuel ödeme başarısı gibi gizlenmez ve sipariş gerçek ödeme durumu ile gösterilir.
- Havale/EFT veya Kapıda Ödeme seçildiğinde Iyzico ve `/api/payments/init` çağrılmaz; sipariş `Unpaid` olarak oluşturulur, stok commit edilir ve sipariş sonucu başarı olarak gösterilir.
- İleride online kredi kartı ödemesi (İyzipay / Stripe) açılmak istendiğinde tek tıkla sanal POS modülü aktif edilebilir.

---

## 3. 🔐 Güvenlik ve Yetkilendirme Denetimi

### 3.1 Kimlik Doğrulama (JWT & RBAC)
- **Roller:** `SuperAdmin`, `Admin`, `Customer` rollerini kapsar.
- **Sahiplik Kontrolü (Ownership Validation):** Kullanıcılar sadece kendi sepetlerini (`CartController`), siparişlerini (`CheckoutController`), bildirimlerini (`NotificationContext`) ve mesajlaşmalarını (`ChatHub`) görebilir.
- **Şifre Politikası:** ASP.NET Core Identity’nin yapılandırılmış `PasswordHasher` implementasyonu kullanılır; bu repository’de ayrı bir Argon2 custom implementasyonu yoktur.

### 3.2 Rate Limiting (Oran Sınırlama)
`Program.cs` içerisinde `PartitionedRateLimiter` kullanılarak `User ID`, `Guest Session ID` veya `Remote IP` bazlı kısıtlamalar yapılmıştır:
- `AuthRegister` / `AuthLogin` / `AuthForgotPassword` / `AuthResetPassword` için istek limitleri aktif.
- `ChatMessage` (dakikada 30 mesaj) ve `StockNotification` (dakikada 10 istek) korumalı.

---

## 4. 🔌 Controller & Endpoint Detaylı İncelemesi

### 4.1 AdminControllers (`AdminControllers.cs`, `AdminFileController.cs`, `AdminReportsController.cs`, `AdminInventoryController.cs`)
- **İşlev:** Ürün, kategori, kupon, müşteri yetkilendirme, stok, billboard ve rapor yönetimi.
- **Yetki:** `[Authorize(Roles = "Admin,SuperAdmin")]` attribute ile korumalıdır.
- **Müşteri Rol Yönetimi:** `SuperAdmin` olan yöneticiler `POST /api/admin/customers/{id}/role` endpoint'i üzerinden diğer kullanıcıları `Admin` yapabilir veya adminliğini kaldırabilir.

### 4.2 PublicControllers (`PublicControllers.cs`)
- **İşlev:** Ürün listeleme (`GET /api/products`), detay (`GET /api/products/{slug}`), kategori ağacı (`GET /api/categories/tree`), billboard slides ve genel site verileri.

### 4.3 CouponController (`CouponController.cs`)
- **İşlev:** Kupon doğrulama (`POST /api/coupons/validate`) ve admin kupon CRUD.

### 4.4 StockNotificationController (`StockNotificationController.cs`)
- **İşlev:** Stokta kalmayan ürünler için e-posta stok bildirimi isteği oluşturma (`POST /api/products/{id}/stock-notify`).

### 4.5 BlogControllers (`BlogControllers.cs`)
- **İşlev:** Kamu blog listeleme (`GET /api/blog`), makale detayı (`GET /api/blog/{slug}`) ve Admin Blog Yönetimi (`POST/PUT/DELETE /api/admin/blog`).

---

## 5. 🗄️ Veri Katmanı ve İndeks Optimizasyonu

### 5.1 Veritabanı Yapısı
- **DbContext:** `IsaDbContext` SQL Server üzerinde çalışır.
- **Soft Delete:** Ürünler ve kategoriler silindiğinde veritabanından fiziksel olarak silinmez, `IsDeleted = true` flag'i ile arşivlenir.
- **Concurrency Check:** Sepet ve stok güncellemelerinde çakışmaları önlemek için `ConcurrencyToken` / `RowVersion` mekanizması mevcuttur.

### 5.2 Önerilen Veritabanı İndeksleri (Performance Indexing)
1. `Products(IsActive, CategoryId, Price)` -> Kategori ve fiyat filtreli aramalarda 10x hızlanma sağlar.
2. `Orders(CustomerId, CreatedAt DESC)` -> Müşteri geçmiş sipariş sorgularını hızlandırır.
3. `Notifications(UserId, IsRead)` -> Okunmamış bildirim getirme sorgularını hızlandırır.

---

## 6. ⚙️ Arka Plan İşlemleri ve Gerçek Zamanlı Servisler

1. **Outbox Pattern Worker (`OutboxProcessorJob`)**: E-posta gönderimi, SMS veya webhook çağrılarını transactional outbox tablosundan okuyarak garantili teslimat sağlar.
2. **SignalR Hubs**:
   - `ChatHub`: Kullanıcı ve Admin canlı destek yazışmaları. Ziyaretçiler için `GuestSessionId` desteği mevcuttur.
   - `NotificationHub`: Sipariş durumu değişikliği veya stok güncellemelerinde istemciye anlık bildirim basar.

---

## 7. 🛠️ Canlıya Geçiş Öncelikli Aksiyon Listesi

| # | Aksiyon | Öncelik | Açıklama |
|---|---------|---------|----------|
| 1 | **SSL & Secure Cookies** | 🔴 Yüksek | Production sunucusunda SSL açıldığında Refresh Token'lar `HttpOnly`, `Secure` Cookie'ye taşınmalı. |
| 2 | **Database Index Migration** | 🟡 Orta | `Products`, `Orders`, `Notifications` için performans indeksleri eklenmeli. |
| 3 | **Medya Storage Entegrasyonu** | 🟡 Orta | `wwwroot/uploads` yerine FTP veya Cloud Storage (S3) ortamına dinamik resim yükleme hattı bağlanmalı. |
| 4 | **Production Logging & Monitoring** | 🟢 Düşük | Serilog ile Loggly/Sentry veya Elasticsearch (ELK) merkezi loglama entegrasyonu. |

---

## 🎯 Sonuç ve Değerlendirme

Muhristan projesinin frontend ve backend mimarisi sanal POS bağımlılığından izole edilmiştir. Sipariş oluşturma akışı online ödeme sağlayıcısına (İyzipay vb.) gerek duymaksızın doğrudan tamamlanabilir durumdadır.
