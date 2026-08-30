# 📋 Backend Teknik Rapor & Çözüm Rehberi: Adres Silme (500 Hatası Çözümü)

---

## 1. Tespit Edilen Problem (500 Internal Server Error)
**Uç Nokta:** `DELETE /api/account/addresses/{id}`

### 🔴 Hatanın Kök Nedeni:
Kullanıcı kayıtlı bir adresini silmek istediğinde, backend tarafında `Addresses.Remove(address)` ile **Hard Delete** (fiziksel tablodan silme) yapılmaya çalışılmaktadır.

Ancak bu adres, daha önce verilmiş en az bir siparişe (`Orders` tablosundaki `ShippingAddressId` veya `BillingAddressId` Foreign Key'ine) bağlı olduğu için, veritabanı motoru (SQL Server / PostgreSQL) **Foreign Key Referential Integrity (İlişkisel Bütünlük)** kısıtlaması nedeniyle silme işlemini engellemekte ve EF Core **`DbUpdateException` (500 Internal Server Error)** fırlatmaktadır.

---

## 2. Kalıcı Çözüm: Siparişi Olan Adreslerde Soft Delete (Pasife Alma)

E-ticaret sistemlerinde geçmiş sipariş kayıtlarının (irsaliye/fatura adreslerinin) bozulmaması için:
1. **Eğer adrese bağlı geçmiş sipariş varsa:** Adres tablodan fiziksel olarak silinmemeli, `IsDeleted = true` (veya `IsActive = false`) yapılmalıdır.
2. **Eğer adrese bağlı hiçbir sipariş yoksa:** İsteğe bağlı olarak fiziksel silinebilir veya her iki durumda da Soft Delete uygulanabilir.
3. **Adres Listeleme Sorgusunda:** `IsDeleted == false` filtresi (`HasQueryFilter`) eklenmelidir.

---

## 3. Örnek C# / .NET Backend Kodu (Doğrudan Uygulanabilir)

### A) `AddressService.cs` veya `AccountController.cs` İçindeki Silme Metodu:

```csharp
[HttpDelete("account/addresses/{id:guid}")]
public async Task<IActionResult> DeleteAddress(Guid id)
{
    var currentUserId = GetCurrentUserId(); // veya User.GetUserId()

    var address = await _context.Addresses
        .FirstOrDefaultAsync(a => a.Id == id && a.UserId == currentUserId && !a.IsDeleted);

    if (address == null)
    {
        return NotFound(new { message = "Adres bulunamadı." });
    }

    // 1. Bu adres herhangi bir siparişe bağlı mı kontrol et
    var isUsedInOrders = await _context.Orders
        .AnyAsync(o => o.ShippingAddressId == id || o.BillingAddressId == id);

    if (isUsedInOrders)
    {
        // Siparişe bağlı adres -> Soft Delete (Kullanıcıdan gizle ama sipariş geçmişi bozulmasın)
        address.IsDeleted = true;
        address.IsActive = false;
        address.UpdatedAt = DateTime.UtcNow;
    }
    else
    {
        // Siparişe bağlı değilse -> İsteğe bağlı Hard Delete veya Soft Delete
        address.IsDeleted = true;
        address.IsActive = false;
        address.UpdatedAt = DateTime.UtcNow;
        // veya: _context.Addresses.Remove(address);
    }

    await _context.SaveChangesAsync();

    return Ok(new { success = true, message = "Adres başarıyla silindi." });
}
```

---

### B) Entity Configuration / Global Query Filter (Tavsiye Edilen):

`AddressConfiguration.cs` veya `AppDbContext.cs` içine:

```csharp
builder.Entity<Address>()
    .HasQueryFilter(a => !a.IsDeleted);
```

Bu sayede `_context.Addresses.Where(a => a.UserId == userId).ToListAsync()` çağrıldığında silinmiş adresler otomatik olarak filtrelenir ve kullanıcıya dönmez.

---

## 4. Frontend Tarafında Alınan Önlemler:
* Frontend tarafında `DELETE /account/addresses/{id}` çağrıldıktan sonra, adres anında UI'dan kaldırılmakta ve yerel önbellekte (`localStorage: deleted_address_ids`) filtrelenerek kullanıcının tekrar görmesi engellenmektedir.
* Backend tarafında yukarıdaki soft-delete düzeltmesi uygulandığında veritabanı seviyesinde de işlem %100 eksiksiz tamamlanacaktır.
