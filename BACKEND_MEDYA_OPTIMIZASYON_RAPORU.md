# 📋 Backend Ekibine Görev Raporu: Medya (Görsel) Re-optimizasyon Servisi

**Tarih:** 12.09.2026  
**Konu:** Admin Paneli Medya Optimizasyonu İçin `reoptimize` Endpoint Entegrasyonu  
**İlgili Proje:** `IsaShopAPI`  
**Frontend Durumu:** Arayüz, butonlar ve hata yönetimleri hazır; backend endpoint'i (404) bekleniyor.

---

## 1. 📌 Mevcut Durum ve İhtiyaç Özeti

Admin panelinde **"Medya / Foto Optimizasyonu"** sekmesi eklenmiştir. Bu sekme, sunucuda geçmişten kalan büyük boyutlu ürün, kategori ve banner görsellerini (JPG, PNG) tarayıp modern **WebP** formatına dönüştürmeyi ve disk tasarrufu sağlamayı amaçlamaktadır.

Frontend, admin kullanıcısı butona bastığında şu adrese HTTP POST isteği göndermektedir:
```http
POST /api/admin/media/reoptimize?dryRun=true&batchSize=25
```

Mevcut canlı ve yerel backend'de (`IsaShopAPI`) bu endpoint henüz tanımlı olmadığı için sunucu **404 Not Found** dönmektedir ve arayüzde işlem sonucu görüntülenememektedir.

---

## 2. 🛠️ İstenen Endpoint Spesifikasyonu

### **Endpoint Bilgileri**
- **Method:** `POST`
- **URL:** `/api/admin/media/reoptimize`
- **Yetkilendirme:** `[Authorize(Roles = "Admin,SuperAdmin")]`
- **Query Parametreleri:**
  - `dryRun` (boolean, varsayılan: `true`):
    - `true` ise: **Hiçbir dosya veya veritabanı kaydı değiştirilmez.** Yalnızca simülasyon yapılır. Kaç dosyanın optimize edileceği ve tahmini boyut tasarrufu hesaplanıp raporlanır.
    - `false` ise: Gerçek optimizasyon yapılır. Belirtilen `batchSize` kadar dosya WebP'ye dönüştürülür, yeni dosya kaydedilir, veritabanı referansları güncellenir.
  - `batchSize` (int, varsayılan: `25`): Tek seferde işlenecek görsel sayısı (sunucuyu kitlememek için).

---

## 3. 📦 Frontend'in Beklediği JSON Response Formatı

Frontend arayüzünün (`MediaOptimizationSection.jsx`) metrik kartlarını ve tasarruf özetini doğru çizebilmesi için response gövdesi aşağıdaki alanları içermelidir:

### **Örnek Başarılı Yanıt (HTTP 200):**
```json
{
  "success": true,
  "totalScanned": 85,
  "wouldOptimize": 32,
  "optimized": 32,
  "alreadyOptimized": 50,
  "skipped": 3,
  "failed": 0,
  "estimatedBytesBefore": 125829120,
  "estimatedBytesAfter": 36700160
}
```

### **Alan Açıklamaları:**
| Alan Adı | Tip | Açıklama |
| :--- | :--- | :--- |
| `totalScanned` | `int` | Taranan toplam görsel sayısı |
| `wouldOptimize` | `int` | Dry-run sırasında dönüştürülmeye uygun bulunan görsel sayısı |
| `optimized` | `int` | Gerçek çalıştırmada (dryRun=false) dönüştürülen görsel sayısı |
| `alreadyOptimized` | `int` | Zaten WebP formatında olan görsel sayısı |
| `skipped` | `int` | Uygun olmayan veya atlanan dosya sayısı |
| `failed` | `int` | Dönüştürme sırasında hata alan dosya sayısı |
| `estimatedBytesBefore` | `long` | İşlem öncesi toplam boyut (**byte cinsinden**, örn: 125829120 = ~120 MB) |
| `estimatedBytesAfter` | `long` | İşlem sonrası toplam boyut (**byte cinsinden**, örn: 36700160 = ~35 MB) |

---

## 4. 💻 Örnek C# / ASP.NET Core Uygulama Şablonu

### **A. DTO Modeli (`ReoptimizeMediaResponse.cs`):**
```csharp
namespace IsaShop.Contracts.Media;

public sealed record ReoptimizeMediaResponse
{
    public bool Success { get; init; } = true;
    public int TotalScanned { get; init; }
    public int WouldOptimize { get; init; }
    public int Optimized { get; init; }
    public int AlreadyOptimized { get; init; }
    public int Skipped { get; init; }
    public int Failed { get; init; }
    public long EstimatedBytesBefore { get; init; }
    public long EstimatedBytesAfter { get; init; }
}
```

### **B. Controller Eklemesi (`AdminMediaController.cs` veya `AdminFileController.cs`):**
```csharp
[Authorize(Roles = "Admin,SuperAdmin")]
[ApiController]
[Route("api/admin/media")]
public sealed class AdminMediaController : ControllerBase
{
    private readonly IMediaOptimizationService _mediaService;

    public AdminMediaController(IMediaOptimizationService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpPost("reoptimize")]
    public async Task<ActionResult<ReoptimizeMediaResponse>> Reoptimize(
        [FromQuery] bool dryRun = true,
        [FromQuery] int batchSize = 25,
        CancellationToken cancellationToken = default)
    {
        if (batchSize <= 0 || batchSize > 100)
            batchSize = 25;

        var result = await _mediaService.ReoptimizeAsync(dryRun, batchSize, cancellationToken);
        return Ok(result);
    }
}
```

### **C. İş Mantığı Tavsiyesi (Service Mantığı):**
1. **Dosyaları Tara:** `StoredFiles` tablosunda veya upload klasöründe `.jpg`, `.jpeg`, `.png` uzantılı kayıtları filtreleyin.
2. **WebP Dönüştürme:** `SixLabors.ImageSharp` veya `SkiaSharp` kütüphanesini kullanarak kalite %80-85 olacak şekilde WebP encoder'dan geçirin.
3. **Güvenlik / Yedeklilik:** Orijinal dosyayı hemen silmek yerine `_backup` veya korumalı bir isimle saklayabilir ya da yeni dosyanın URL'sini `StoredFile` / `ProductImage` tablosunda güncelleyebilirsiniz.

---

## 5. 🎯 Test ve Doğrulama Adımları

Endpoint geliştirildikten sonra aşağıdaki curl komutuyla test edilebilir:

```bash
# 1. Simülasyon Testi (Dry-Run):
curl -X POST "https://localhost:5001/api/admin/media/reoptimize?dryRun=true&batchSize=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"

# 2. Canlı Dönüştürme Testi:
curl -X POST "https://localhost:5001/api/admin/media/reoptimize?dryRun=false&batchSize=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

Başarılı yanıt alındığında frontend panelindeki **"Eski Görselleri Analiz Et"** ve **"Optimizasyonu Başlat"** butonları otomatik olarak sonuçları, sayaçları ve megabayt kazanç grafiğini ekranda gösterecektir.
