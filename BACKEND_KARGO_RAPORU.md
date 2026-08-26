# Backend Geliştirici Raporu: Ücretsiz Kargo ve Kargo Ücreti Entegrasyonu

**Hedef Proje:** `IsaShopAPI` (`C:\Users\alp_t\source\repos\IsaShopAPI`)  
**Tarih:** 24 Ağustos 2026  
**Konu:** Ürün bazlı "Ücretsiz Kargo" (`IsFreeShipping`) ve "Özel Kargo Ücreti" (`ShippingFee`) alanlarının `.NET 8 / EF Core` mimarisine eklenmesi.

---

## 1. Genel Özet & İhtiyaç

Frontend yönetim panelinde (`isa proje` admin paneli) ürün eklenirken ve güncellenirken:
1. **🚚 Kargo Bedava (Ücretsiz Kargo):** Ürüne özel ücretsiz kargo tanımlayabilme (`isFreeShipping: boolean`).
2. **Özel Kargo Ücreti:** Ücretsiz kargo seçili değilse ürüne özel sabit kargo ücreti girebilme (`shippingFee: decimal?`).

Frontend tarafında form alanları, DTO payload'ları ve görsel badge gösterimleri tamamlanmıştır. Backend tarafında aşağıdaki 4 adımın uygulanması gerekmektedir.

---

## 2. Yapılması Gereken Adımlar

### Adım 1: Domain Modeli Güncellemesi (`IsaShop.Domain`)

**Dosya:** `IsaShop.Domain\Entities\CatalogEntities.cs`  
`Product` sınıfına iki yeni özellik ekleyin:

```csharp
public class Product : SoftDeleteEntity
{
    // ... Mevcut özellikler ...

    /// <summary>
    /// Ürünün ücretsiz kargo olup olmadığını belirtir.
    /// </summary>
    public bool IsFreeShipping { get; set; } = false;

    /// <summary>
    /// Ürüne özel kargo ücreti (Null ise genel varsayılan kargo ücreti geçerlidir).
    /// </summary>
    public decimal? ShippingFee { get; set; }
}
```

---

### Adım 2: DTO / Contract Güncellemeleri (`IsaShop.Contracts`)

**Dosya:** `IsaShop.Contracts\Products\ProductContracts.cs`

#### A) İstek (Request) DTO'ları:
`CreateProductRequest` ve `UpdateProductRequest` record yapılarına aşağıdaki iki parametreyi ekleyin:

```csharp
public record CreateProductRequest(
    string Name,
    Guid CategoryId,
    decimal Price,
    int StockQuantity,
    string ShortDescription,
    string Description,
    // ...
    bool IsFreeShipping = false,
    decimal? ShippingFee = null,
    bool IsSecret = false
);

public record UpdateProductRequest(
    string Name,
    Guid CategoryId,
    decimal Price,
    int StockQuantity,
    string ShortDescription,
    string Description,
    // ...
    bool IsFreeShipping = false,
    decimal? ShippingFee = null,
    bool IsSecret = false
);
```

#### B) Yanıt (Response) DTO'ları:
`ProductDetailResponse`, `ProductListResponse` ve `PublicProductListResponse` DTO'larına kargo alanlarını ekleyin:

```csharp
public record ProductListResponse(
    Guid Id,
    string Name,
    string Slug,
    decimal Price,
    decimal? OldPrice,
    string? ImageUrl,
    string? CategoryName,
    bool IsNew,
    bool IsSale,
    bool IsFeatured,
    string? Discount = null,
    string? Unit = null,
    bool IsActive = true,
    bool IsSecret = false,
    bool IsFreeShipping = false,
    decimal? ShippingFee = null
);

public record ProductDetailResponse(
    Guid Id,
    string Name,
    // ...
    bool IsActive = true,
    bool IsSecret = false,
    bool IsFreeShipping = false,
    decimal? ShippingFee = null,
    string Currency = "TRY"
);

public sealed record PublicProductListResponse
{
    // ...
    [JsonPropertyName("isFreeShipping")]
    public bool IsFreeShipping { get; init; }

    [JsonPropertyName("shippingFee")]
    public decimal? ShippingFee { get; init; }
}
```

---

### Adım 3: CQRS & Mapleme Mantığı (`IsaShop.Application`)

**Dosya:** `IsaShop.Application\Products\Products.cs`

#### A) Ürün Oluşturma (`CreateProductCommand`):
```csharp
var product = new Product
{
    Name = request.Name,
    Price = request.Price,
    // ...
    IsFreeShipping = request.IsFreeShipping,
    ShippingFee = request.IsFreeShipping ? 0 : request.ShippingFee
};
```

#### B) Ürün Güncelleme (`UpdateProductCommand`):
```csharp
product.IsFreeShipping = request.IsFreeShipping;
product.ShippingFee = request.IsFreeShipping ? 0 : request.ShippingFee;
```

#### C) Query Handler (Mapleme):
Veritabanından çekilen DTO dönüşümlerinde `IsFreeShipping` ve `ShippingFee` alanlarını DTO yanıtlarına aktarın.

---

### Adım 4: Veritabanı Migration İşlemi

Package Manager Console veya terminal üzerinden EF Core Migration oluşturup veritabanına uygulayın:

```bash
# Terminal (Proje kök dizininde):
dotnet ef migrations add AddShippingFieldsToProduct --project IsaShop.Persistence --startup-project IsaShop.API

# Veritabanını güncellemek için:
dotnet ef database update --project IsaShop.Persistence --startup-project IsaShop.API
```

---

## 3. Frontend Tarafında Hazır Olan Payload Örneği

Frontend `POST /api/admin/products` veya `POST /api/admin/products/{id}/update` isteklerinde şu JSON gövdesini göndermektedir:

```json
{
  "name": "Mühristan Özel Tasarım Yüzük",
  "price": 1250.00,
  "oldPrice": 1500.00,
  "stockQuantity": 25,
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "isFreeShipping": true,
  "shippingFee": 0,
  "shortDescription": "Özel el işçiliği gümüş yüzük",
  "description": "<p>Detaylı açıklama...</p>",
  "unit": "adet",
  "isActive": true
}
```

---
*Hazırlayan: Antigravity Assistant (IsaShop & Muhristan Entegrasyonu)*
