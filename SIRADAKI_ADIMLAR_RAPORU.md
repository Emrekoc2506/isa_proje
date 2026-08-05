# Sıradaki Adımlar — Uygulama Planı

---

## 1. Stok Bildirimi Sistemi (Stock Notify)

### Frontend
Frontend'de `StockNotifyModal.jsx` zaten yapıldı — API çağrısı atıyor:
```js
POST /products/${product.id}/stock-notify  { email }
```
Backend'e bu endpoint eklenmeli.

### Backend Yapılması Gerekenler

#### 1.1. Veritabanı Tablosu
```sql
CREATE TABLE StockNotifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProductId UNIQUEIDENTIFIER NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    IsNotified BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    NotifiedAt DATETIME2 NULL,
    FOREIGN KEY (ProductId) REFERENCES Products(Id)
);
```

#### 1.2. Domain Entity
`IsaShop.Domain/Entities/StockNotification.cs`:
```csharp
public class StockNotification : BaseEntity
{
    public Guid ProductId { get; private set; }
    public string Email { get; private set; }
    public bool IsNotified { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? NotifiedAt { get; private set; }
    public Product Product { get; private set; }
}
```

#### 1.3. Controller Endpoint'i
`IsaShopAPI/Controllers/StockNotificationController.cs`:
```csharp
[ApiController]
[Route("api/products/{productId:guid}/stock-notify")]
public class StockNotificationController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Subscribe(
        Guid productId,
        [FromBody] StockNotifyRequest request)
    {
        // Validate product exists
        // Validate email format
        // Save to database
        // Return success
    }
}
```

Request DTO:
```csharp
public record StockNotifyRequest(string Email);
```

#### 1.4. Admin Görüntüleme (İsteğe Bağlı)
```csharp
[Authorize(Policy = "AdminOnly")]
[HttpGet("api/admin/stock-notifications")]
// Tüm stok bildirimi taleplerini listele
```

#### 1.5. Arkaplan İşi
Mevcut `BackgroundJobs` yapısına eklenebilir:
- Stok giren ürünlerin bildirimlerini kontrol et
- `IsNotified = false` olan kayıtlara e-posta gönder
- `IsNotified = true` olarak işaretle

---

## 2. Yorum Moderasyonu (Review Moderation)

### Backend
Backend'de hazır endpoint'ler **zaten var**:
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `GET /api/admin/reviews/pending` | GET | Onay bekleyen yorumlar |
| `PUT /api/admin/reviews/{id}/approve` | PUT | Yorumu onayla |
| `PUT /api/admin/reviews/{id}/reject` | PUT | Yorumu reddet |
| `DELETE /api/admin/reviews/{id}` | DELETE | Yorumu sil |

### Frontend Yapılması Gerekenler

#### 2.1. Admin Panel — Yeni Section Ekle
AdminPage.jsx'e yeni bir tab eklenmeli: **"Yorumlar"**

**Dosya:** `src/pages/AdminPage/sections/ReviewsSection.jsx`

```jsx
export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // GET /api/admin/reviews/pending
  // PUT /api/admin/reviews/{id}/approve
  // PUT /api/admin/reviews/{id}/reject

  return (
    <div>
      <h3>Yorum Moderasyonu</h3>
      {/* Tablo: Ürün, Kullanıcı, Puan, Yorum, Tarih, Onayla/Reddet butonları */}
    </div>
  );
}
```

#### 2.2. AdminPage.jsx — Tab Ekle
```jsx
// Sidebar'a yeni link ekle
{ label: 'Yorumlar', icon: <FiMessageSquare />, key: 'reviews' }

// Conditional render
{activeTab === 'reviews' && <ReviewsSection />}
```

#### 2.3. reviewApi.js — Admin Endpoint'lerini Ekle
```js
export function getPendingReviews() {
  return request("/admin/reviews/pending");
}

export function approveReview(id) {
  return request(`/admin/reviews/${id}/approve`, { method: "PUT" });
}

export function rejectReview(id) {
  return request(`/admin/reviews/${id}/reject`, { method: "PUT" });
}

export function deleteAdminReview(id) {
  return request(`/admin/reviews/${id}`, { method: "DELETE" });
}
```

#### 2.4. Review Response DTO (Backend)
Backend'den gelen yanıtta şu alanlar olmalı:
```json
{
  "id": "guid",
  "productId": "guid",
  "productName": "Ürün Adı",
  "userName": "Kullanıcı Adı",
  "rating": 5,
  "title": "Yorum Başlığı",
  "comment": "Yorum içeriği",
  "isVerified": true,
  "isApproved": false,
  "createdAt": "2026-07-27T10:00:00Z"
}
```

---

## 3. Genel Öneriler

### Frontend
- [ ] Admin sidebar'da "Yorumlar" tab'ı ekle
- [ ] `ReviewsSection.jsx` bileşenini oluştur
- [ ] Onay/Red butonları, loading state, hata yönetimi
- [ ] Toplu onay/red özelliği (opsiyonel)

### Backend (Stok Bildirimi İçin)
- [ ] Migration oluştur (`dotnet ef migrations add AddStockNotifications`)
- [ ] Entity + Controller + Service katmanlarını yaz
- [ ] Admin görüntüleme endpoint'i ekle
- [ ] Background job: stok bildirimi e-postası gönderme

---

Bu planı takip ederek sırayla uygulayabilirsin. Başladığında haber ver, kontrol ederim.
