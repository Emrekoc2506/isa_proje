# 📢 Backend Ekibine Teknik Uygulama Raporu: Google Merchant Center & Meta Katalog XML Feed Entegrasyonu

**Tarih:** 14.09.2026  
**Konu:** Google Shopping (Merchant Center) ve Meta (Facebook / Instagram) Katalog XML Beslemelerinin (.NET API) Canlıya Alınması  
**İlgili Proje:** `IsaShopAPI` (.NET 8/9 / C#)  
**Frontend Durumu:** ✅ Frontend tarafında statik feed üretimi tamamlandı (`https://muhristan.com/google-merchant.xml`).  
**Backend Görevi:** 🎯 Canlı veritabanından dinamik olarak `https://api.muhristan.com/google-merchant.xml` ve `/facebook-catalog.xml` endpoint'lerinin kodlanması.

---

## 1. 📌 Amaç ve Genel Bakış

Google Merchant Center (Google Alışveriş Reklamları, Ücretsiz Listelemeler) ve Meta Commerce Manager (Facebook / Instagram Mağaza ve Katalog Reklamları), e-ticaret sitelerindeki ürünleri düzenli olarak **RSS 2.0 XML Feed** formatında çeker.

Bu sistemin backend tarafında canlı bir endpoint olarak sunulması; fiyat değişikliklerinin, stok güncellemelerinin ve yeni eklenen ürünlerin **anlık ve otomatik** olarak Google & Meta platformlarına yansımasını sağlar.

---

## 2. 🌐 İstenen API Endpoint'leri

Aşağıdaki URL'lerin anonim (yetkilendirme gerektirmeyen) ve `application/xml; charset=utf-8` formatında yayınlanması gerekmektedir:

| Endpoint | Açıklama |
| :--- | :--- |
| `GET /google-merchant.xml` | Google Merchant Center için ana XML feed'i |
| `GET /api/feed/google-merchant.xml` | Google Merchant alternatif/alt rota |
| `GET /facebook-catalog.xml` | Meta / Facebook Katalog için XML feed'i |
| `GET /api/feed/facebook-catalog.xml` | Meta / Facebook alternatif/alt rota |

*(Not: Google Merchant ve Meta Catalog aynı `xmlns:g="http://base.google.com/ns/1.0"` standardını kullandığı için tek bir servis mantığı iki endpoint'e de hizmet verebilir).*

---

## 3. 📋 Google Merchant Center XML Standardı (Şartname)

Feed'in kök ve öğe yapısı şu şekilde olmalıdır:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Muhristan Google Merchant Ürün Kataloğu</title>
    <link>https://muhristan.com</link>
    <description>Muhristan özel tasarım gümüş yüzükler, tılsımlı kolyeler, doğal taşlar ve manevi sanat eserleri ürün kataloğu.</description>
    
    <item>
      <g:id>7c0e15e7-eeba-4af8-80f6-e2398f104d09</g:id>
      <g:title>HANE KORUMA NİYETLİ TABLO I EL İŞÇİLİĞİ</g:title>
      <g:description>Hane koruma amaçlı tablo; ev, hane ve yaşam alanlarının korunması niyetiyle hazırlanan özel bir çalışmadır...</g:description>
      <g:link>https://muhristan.com/urun/hane-koruma-ni-yetli-tablo-el-i-ili-i</g:link>
      <g:image_link>https://media.muhristan.com/products/2026/09/5c3b3b9f0e2b4124aad28f3699cef911.webp</g:image_link>
      <g:additional_image_link>https://media.muhristan.com/products/2026/09/ek-resim.webp</g:additional_image_link>
      <g:availability>in_stock</g:availability>
      <g:price>6700.00 TRY</g:price>
      <!-- Eğer indirimli ürünse: -->
      <!-- <g:price>8000.00 TRY</g:price> (Normal Fiyat) -->
      <!-- <g:sale_price>6700.00 TRY</g:sale_price> (İndirimli Fiyat) -->
      <g:brand>Muhristan</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>500044</g:google_product_category>
      <g:product_type>Tablolar</g:product_type>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standart Kargo</g:service>
        <g:price>0.00 TRY</g:price>
      </g:shipping>
    </item>
  </channel>
</rss>
```

### Kritik Alan Kuralları:
1. **`<g:price>` & `<g:sale_price>`:**  
   - Mutlaka `0.00 TRY` formatında, iki basamaklı ondalık ve ISO para birimi kodu (`TRY`) içermelidir (Örn: `1500.00 TRY`).
   - İndirim varsa: `<g:price>` eski fiyattır, `<g:sale_price>` indirimli satış fiyatıdır.
2. **`<g:availability>`:**  
   - Ürün stokta varsa (`StockQuantity > 0` ve `IsActive == true`): `in_stock`
   - Stok tükenmişse: `out_of_stock`
3. **`<g:identifier_exists>`:**  
   - Değeri mutlaka **`no`** olmalıdır. Muhristan ürünleri el yapımı ve özel tasarım olduğu için GTIN/EAN/Barkod zorunluluğunu kaldırır ve Google onayını garanti eder.
4. **`<g:description>`:**  
   - HTML etiketleri (`<p>`, `<br>`) ve HTML entity kodları (`&ccedil;`, `&uuml;`, `&ouml;`, `&nbsp;`) tamamen temizlenmelidir. Maksimum 5000 karakter olmalıdır.
5. **`<g:link>`:**  
   - Frontend ürün bağlantısı olmalıdır: `https://muhristan.com/urun/{slug}`
6. **`<g:image_link>`:**  
   - Mutlak URL olmalıdır (`https://media.muhristan.com/...` veya `https://api.muhristan.com/...`).

---

## 4. 💻 Doğrudan Kullanıma Hazır C# .NET Kodu

Backend ekibinin projeye hızlıca ekleyebilmesi için Controller ve Servis implementasyonu aşağıda hazırlanmıştır:

### A. `FeedController.cs`

```csharp
using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using IsaShop.Application.Abstractions; // veya Feed servis namespace'iniz

namespace IsaShopAPI.Controllers
{
    [ApiController]
    [AllowAnonymous]
    public class FeedController : ControllerBase
    {
        private readonly IProductFeedService _feedService;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "google_merchant_feed_xml";

        public FeedController(IProductFeedService feedService, IMemoryCache cache)
        {
            _feedService = feedService;
            _cache = cache;
        }

        [HttpGet("/google-merchant.xml")]
        [HttpGet("/api/feed/google-merchant.xml")]
        [HttpGet("/google-catalog.xml")]
        [HttpGet("/facebook-catalog.xml")]
        [HttpGet("/api/feed/facebook-catalog.xml")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)] // 1 Saat Tarayıcı/CDN Cache
        public async Task<IActionResult> GetGoogleMerchantFeed(CancellationToken cancellationToken)
        {
            // Sunucu kaynaklarını korumak için 30 dakikalık bellek önbelleği
            if (!_cache.TryGetValue(CacheKey, out string? xmlContent))
            {
                xmlContent = await _feedService.GenerateGoogleMerchantXmlAsync(cancellationToken);
                
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(30));
                    
                _cache.Set(CacheKey, xmlContent, cacheOptions);
            }

            return Content(xmlContent!, "application/xml", Encoding.UTF8);
        }
    }
}
```

---

### B. `ProductFeedService.cs` (İş Mantığı ve XML Üretici)

```csharp
using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using IsaShop.Domain.Entities; // Entity modelleriniz

namespace IsaShop.Infrastructure.Services
{
    public interface IProductFeedService
    {
        Task<string> GenerateGoogleMerchantXmlAsync(CancellationToken cancellationToken = default);
    }

    public class ProductFeedService : IProductFeedService
    {
        private readonly IApplicationDbContext _context; // DbContext arayüzünüz
        private const string BaseUrl = "https://muhristan.com";
        private const string Brand = "Muhristan";
        private static readonly XNamespace G = "http://base.google.com/ns/1.0";

        public ProductFeedService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateGoogleMerchantXmlAsync(CancellationToken cancellationToken = default)
        {
            // Sadece aktif ve gizli olmayan ürünleri çek
            var products = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive && !p.IsSecret)
                .ToListAsync(cancellationToken);

            var channel = new XElement("channel",
                new XElement("title", $"{Brand} Google Merchant Ürün Kataloğu"),
                new XElement("link", BaseUrl),
                new XElement("description", $"{Brand} özel tasarım gümüş yüzükler, tılsımlı kolyeler, doğal taşlar ve manevi sanat eserleri ürün kataloğu.")
            );

            foreach (var p in products)
            {
                // Gizli veya test ürünlerini atla
                if (p.Name != null && (p.Name.Contains("[GİZLİ]") || p.Name.Contains("(GİZLİ)")))
                    continue;

                var id = !string.IsNullOrWhiteSpace(p.Sku) ? p.Sku : p.Id.ToString();
                var title = p.Name?.Trim() ?? "Muhristan Özel Tasarım Ürün";
                if (title.Length > 150) title = title.Substring(0, 150);

                // Açıklamayı temizle
                var rawDesc = !string.IsNullOrWhiteSpace(p.Description) 
                    ? p.Description 
                    : (!string.IsNullOrWhiteSpace(p.SeoDescription) ? p.SeoDescription : p.ShortDescription);
                var cleanDesc = StripHtmlAndDecode(rawDesc);
                if (string.IsNullOrWhiteSpace(cleanDesc) || cleanDesc.Length < 20)
                {
                    cleanDesc = $"{title} - {Brand} özel tasarım el yapımı koleksiyonu. Güvenli kargo ve özenli paketleme ile hemen sipariş verin.";
                }
                if (cleanDesc.Length > 5000) cleanDesc = cleanDesc.Substring(0, 5000);

                var slug = !string.IsNullOrWhiteSpace(p.Slug) ? p.Slug : p.Id.ToString();
                var link = $"{BaseUrl}/urun/{slug}";

                // Görseller
                var mainImage = ResolveImageUrl(p.ImageUrl ?? p.Images?.FirstOrDefault()?.Url);
                var isAvailable = p.IsActive && (p.StockQuantity > 0);
                var availability = isAvailable ? "in_stock" : "out_of_stock";

                // Kategori & Google Taxonomy
                var catName = p.Category?.Name ?? "Özel Tasarım";
                var googleCatId = ResolveGoogleCategory(catName);

                // Kargo
                var isFreeShipping = p.IsFreeShipping || (p.ShippingFee == null || p.ShippingFee <= 0);
                var shippingCost = isFreeShipping ? "0.00 TRY" : $"{p.ShippingFee!.Value.ToString("F2", CultureInfo.InvariantCulture)} TRY";

                var item = new XElement("item",
                    new XElement(G + "id", id),
                    new XElement(G + "title", title),
                    new XElement(G + "description", cleanDesc),
                    new XElement(G + "link", link),
                    new XElement(G + "image_link", mainImage),
                    new XElement(G + "availability", availability)
                );

                // Ek galeri görselleri (ilk resim haricindekiler, max 10 adet)
                if (p.Images != null && p.Images.Count > 1)
                {
                    foreach (var img in p.Images.Skip(1).Take(10))
                    {
                        var extraUrl = ResolveImageUrl(img.Url);
                        if (!string.IsNullOrWhiteSpace(extraUrl) && extraUrl != mainImage)
                        {
                            item.Add(new XElement(G + "additional_image_link", extraUrl));
                        }
                    }
                }

                // Fiyat ve İndirimli Fiyat
                if (p.OldPrice.HasValue && p.OldPrice.Value > p.Price)
                {
                    item.Add(new XElement(G + "price", $"{p.OldPrice.Value.ToString("F2", CultureInfo.InvariantCulture)} TRY"));
                    item.Add(new XElement(G + "sale_price", $"{p.Price.ToString("F2", CultureInfo.InvariantCulture)} TRY"));
                }
                else
                {
                    item.Add(new XElement(G + "price", $"{p.Price.ToString("F2", CultureInfo.InvariantCulture)} TRY"));
                }

                // Marka & Standart Özellikler
                item.Add(new XElement(G + "brand", Brand));
                item.Add(new XElement(G + "condition", "new"));
                item.Add(new XElement(G + "identifier_exists", "no")); // Önemli: EAN/GTIN muafiyeti
                item.Add(new XElement(G + "google_product_category", googleCatId));
                item.Add(new XElement(G + "product_type", catName));

                // Kargo
                item.Add(new XElement(G + "shipping",
                    new XElement(G + "country", "TR"),
                    new XElement(G + "service", "Standart Kargo"),
                    new XElement(G + "price", shippingCost)
                ));

                channel.Add(item);
            }

            var rss = new XElement("rss",
                new XAttribute("version", "2.0"),
                new XAttribute(XNamespace.Xmlns + "g", G.NamespaceName),
                channel
            );

            var doc = new XDocument(new XDeclaration("1.0", "utf-8", "yes"), rss);
            return doc.Declaration + "\n" + doc.ToString();
        }

        private static string ResolveImageUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return $"{BaseUrl}/logo-2.png";
            if (url.StartsWith("http://") || url.StartsWith("https://")) return url;
            return $"https://api.muhristan.com/{(url.StartsWith("/") ? url.Substring(1) : url)}";
        }

        private static string ResolveGoogleCategory(string catName)
        {
            var lower = catName.ToLowerInvariant();
            if (lower.Contains("yuzuk") || lower.Contains("yüzük") || lower.Contains("kolye") || lower.Contains("bileklik") || lower.Contains("taki") || lower.Contains("takı"))
                return "188"; // Apparel & Accessories > Jewelry
            if (lower.Contains("tutsu") || lower.Contains("tütsü") || lower.Contains("buhur") || lower.Contains("esans"))
                return "607"; // Home & Garden > Decor > Home Fragrances
            if (lower.Contains("tablo") || lower.Contains("sanat"))
                return "500044"; // Arts & Entertainment > Artwork
            return "188";
        }

        private static string StripHtmlAndDecode(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;
            
            // HTML entity decode
            var decoded = WebUtility.HtmlDecode(html);
            
            // Blok elementlerin arasına boşluk bırak
            decoded = Regex.Replace(decoded, @"<\/(p|div|h[1-6]|li|tr)>", " ", RegexOptions.IgnoreCase);
            decoded = Regex.Replace(decoded, @"<(br|hr)\s*\/?>", " ", RegexOptions.IgnoreCase);
            
            // HTML tag'lerini temizle
            var stripped = Regex.Replace(decoded, @"<[^>]+>", string.Empty);
            
            // Çoklu boşlukları teke indir
            return Regex.Replace(stripped, @"\s+", " ").Trim();
        }
    }
}
```

---

## 5. 🛠️ Google Merchant Center Kurulum Adımları (Müşteri / İşletme İçin)

Backend servisi canlıya alınana kadar **hemen şu an** aşağıdaki link Google Merchant Center'a eklenebilir:

1. **Google Merchant Center** paneline gidin (`https://merchants.google.com`).
2. Sol menüden **Ürünler (Products) ➔ Beslemeler (Feeds)** sekmesine tıklayın.
3. **"+" (Besleme Ekle)** butonuna basın.
4. Hedef Ülke: **Türkiye**, Dil: **Türkçe** seçin.
5. Besleme Adı: **`Muhristan XML Ürün Kataloğu`** yazın.
6. Yükleme Yöntemi: **Zamanlanmış Getirme (Scheduled Fetch)** seçeneğini işaretleyin.
7. **Dosya URL'si (Feed URL):**
   ```text
   https://muhristan.com/google-merchant.xml
   ```
   *(Backend deploy edildikten sonra dilerseniz `https://api.muhristan.com/google-merchant.xml` de verilebilir).*
8. **Getirme Sıklığı:** Günlük (Örn: Her sabah saat 04:00).
9. **Kaydet** deyin ve **"Şimdi Getir (Fetch Now)"** butonuna basarak ürünlerin Google'a başarıyla aktarıldığını gözlemleyin.

---

## 6. 🎯 Backend Ekibinden Beklenen Aksiyon Özeti

1. Yukarıdaki `FeedController.cs` ve `ProductFeedService.cs` sınıflarını `IsaShopAPI` projesine ekleyin.
2. `Program.cs` veya `ApiServiceRegistration.cs` içinde `builder.Services.AddScoped<IProductFeedService, ProductFeedService>();` kaydını yapın.
3. Kodu `Develop` ➔ `master` branch'ine aktarıp GitHub Actions ile yayına alın.
4. `https://api.muhristan.com/google-merchant.xml` adresinin 200 OK ile XML döndürdüğünü doğrulayın.
