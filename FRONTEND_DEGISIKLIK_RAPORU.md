# Frontend Değişiklik Raporu

## 1. `src/services/reviewApi.js` — Admin Review Endpoint'leri Eklendi

**Satır 84-98:** 4 yeni fonksiyon eklendi:
- `getPendingReviews()` → `GET /admin/reviews/pending`
- `approveReview(id)` → `PUT /admin/reviews/{id}/approve`
- `rejectReview(id)` → `PUT /admin/reviews/{id}/reject`
- `deleteAdminReview(id)` → `DELETE /admin/reviews/{id}`

Mevcut mock/hata yönetimi yapısı korundu. API çağrısı başarısız olursa hata fırlatır, çağıran component try/catch ile yönetir.

---

## 2. `src/pages/AdminPage/sections/ReviewsSection.jsx` — Yeni Component

Admin panelinde yorum moderasyonu için tam donanımlı bir bölüm:

### Özellikler
- **Filtreleme:** Tümü / Bekleyenler / Onaylı / Reddedilen sekmeleri
- **Yıldız gösterimi:** `StarRating` alt bileşeni ile 5 yıldız
- **Durum etiketleri:** Bekliyor (sarı), Onaylı (yeşil), Reddedildi (kırmızı)
- **Aksiyonlar:**
  - Bekleyen yorumlar: Onayla / Reddet butonları
  - Tümü: Sil butonu
  - İşlem sırasında butonlar disabled olur
- **Hata yönetimi:** API hatası durumunda kırmızı uyarı banner'ı
- **Yenile butonu:** Manuel refresh
- **Boş durum:** Filtreye göre özel mesajlar

### Kullanılan API'ler:
| Endpoint | Metod | Fonksiyon |
|----------|-------|-----------|
| `/admin/reviews/pending` | GET | `getPendingReviews()` |
| `/admin/reviews/{id}/approve` | PUT | `approveReview(id)` |
| `/admin/reviews/{id}/reject` | PUT | `rejectReview(id)` |
| `/admin/reviews/{id}` | DELETE | `deleteAdminReview(id)` |

---

## 3. `src/pages/AdminPage/AdminPage.jsx` — Tab Eklendi

- **Satır 7:** `FiStar` ikonu import edildi
- **Satır 25:** `ReviewsSection` import edildi
- **Satır 33:** NAV_ITEMS dizisine `{ id: 'reviews', label: 'Yorum Yönetimi', icon: FiStar }` eklendi (blog ile orders arasına)
- **Satır 157:** Conditional render: `{active === 'reviews' && <ReviewsSection />}`

---

## Özet

| Dosya | İşlem |
|-------|-------|
| `src/services/reviewApi.js` | 4 yeni admin endpoint fonksiyonu |
| `src/pages/AdminPage/sections/ReviewsSection.jsx` | Yeni component (130 satır) |
| `src/pages/AdminPage/AdminPage.jsx` | Import + NAV_ITEMS + render eklendi |

**Backend ihtiyacı:** Bu 4 endpoint backend'de mevcut değilse çalışmaz. Ayrı bir raporda backend'de yapılması gerekenler detaylandırılmıştır.
