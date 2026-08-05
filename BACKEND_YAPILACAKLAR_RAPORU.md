# Backend Yapılması Gerekenler

> ⚠ **Domain alınana kadar Brevo/SMTP mail entegrasyonu devre dışı.** Background job, stok bildirimi maili gibi e-posta gerektiren adımlar şimdilik atlanacak.

---

## 1. Stok Bildirimi (Stock Notification)

Frontend'deki `StockNotifyModal` şu an localStorage'a kaydediyor (API fallback). Backend'e eklenince çalışır.

### Yapılacaklar

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
`IsaShop.Domain/Entities/StockNotification.cs`
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

#### 1.3. Controller
`IsaShopAPI/Controllers/StockNotificationController.cs`

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `POST /api/products/{productId:guid}/stock-notify` | POST | Email ile stok bildirimi kaydı oluşturur |

**Request:** `{ "email": "ornek@email.com" }`  
**Response:** `200 OK`  
**Validasyonlar:**
- Ürün mevcut mu?
- Email formatı geçerli mi?
- Aynı email ile daha önce kayıt var mı? (opsiyonel)

---

## 2. Yorum Moderasyonu (Review Moderation) — Admin API

**Frontend hazır.** Backend'de aşağıdaki endpoint'lerin olması gerekiyor:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `GET /api/admin/reviews/pending` | GET | Onay bekleyen yorumları getir |
| `PUT /api/admin/reviews/{id}/approve` | PUT | Yorumu onayla |
| `PUT /api/admin/reviews/{id}/reject` | PUT | Yorumu reddet |
| `DELETE /api/admin/reviews/{id}` | DELETE | Yorumu sil |

### Response DTO Formatı (Beklenen)
```json
{
  "id": "guid",
  "productId": "guid",
  "productName": "Ürün Adı",
  "userName": "Kullanıcı Adı",
  "rating": 5,
  "title": "Yorum Başlığı",
  "comment": "Yorum içeriği",
  "isApproved": false,
  "status": "pending",
  "createdAt": "2026-07-27T10:00:00Z"
}
```
> Frontend `status` alanını `pending | approved | rejected` olarak bekler. Yoksa `isApproved` değerine göre fallback yapar.

### Controller Örneği
```csharp
[ApiController]
[Route("api/admin/reviews")]
[Authorize(Policy = "AdminOnly")]
public class AdminReviewsController : ControllerBase
{
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingReviews() { ... }

    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> ApproveReview(Guid id) { ... }

    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> RejectReview(Guid id) { ... }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteReview(Guid id) { ... }
}
```

---

## 3. Yapılmayacaklar (Domain/Mail Gerektirir)

Şu an domain olmadığı için aşağıdakiler **ertelendi**:
- ❌ Stok bildirimi mail gönderimi (Background job)
- ❌ Brevo/SMTP entegrasyonu ayarları
- ❌ Sipariş onay maili şablonları

Domain alınınca tekrar değerlendirilecek.

---

## Öncelik Sırası

| # | Ne | Neden |
|---|----|-------|
| 1 | **Yorum Moderasyonu API** | Frontend hazır, backend olmazsa çalışmaz |
| 2 | **Stok Bildirimi Controller** | Frontend localStorage fallback yapıyor ama asıl iş backend'de |
