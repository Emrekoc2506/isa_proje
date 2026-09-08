# 🚨 Backend Ekibine Hata Bildirimi & Çözüm Raporu

**Tarih:** 08 Eylül 2026  
**Konu:** `POST /api/account/push-subscriptions` 500 Internal Server Error ve Eksik Veritabanı Tablosu  
**İlgili Proje:** `IsaShopAPI` (SQL Server / EF Core)  
**Öncelik:** Yüksek (Web Push Bildirimleri Canlıda Kaydedilemiyor)

---

## 1. 📌 Sorun Özeti

Frontend tarafında Web Push bildirim akışı başarıyla çalışmakta, tarayıcı izni alınıp VAPID public key (`/api/account/push/public-key`) temin edilmektedir. Ancak oluşturulan abonelik anahtarları backend'e kaydedilmek istendiğinde:

```http
POST https://api.muhristan.com/api/account/push-subscriptions
Durum: 500 Internal Server Error
Hata: ApiError: İşlem başarısız oldu.
```

---

## 2. 🔍 Kök Neden (Root Cause) Analizi

`IsaShopAPI` kod tabanında yapılan incelemede:

1. `IsaShop.Persistence/Migrations/20260903183535_AddPushSubscriptions.cs` migrasyon dosyasının `Up()` ve `Down()` metotlarının **tamamen boş** olduğu görülmüştür:
   ```csharp
   public partial class AddPushSubscriptions : Migration
   {
       protected override void Up(MigrationBuilder migrationBuilder)
       {
           // BOŞ KALMIŞ - Tablo oluşturma kodu yok!
       }
   }
   ```
2. Bu nedenle, sunucuda `dotnet ef database update` çalıştırıldığında EF Core migrasyonu uygulanmış saymış (`__EFMigrationsHistory` tablosuna yazmış), fakat canlı SQL Server veritabanında fiziksel **`PushSubscriptions` tablosu oluşturulmamıştır**.
3. `WebPushService.cs` içerisindeki `SubscribeAsync` metodu `_dbContext.PushSubscriptions.FirstOrDefaultAsync(...)` veya `.Add(...)` çağırdığı anda SQL Server şu hatayı vermekte ve **500 Internal Server Error** üretmektedir:
   ```text
   SqlException: Invalid object name 'PushSubscriptions'.
   ```

---

## 3. 🛠️ Çözüm (İki Alternatif Yol)

### Yöntem A: Hazırlanan EF Core Migrasyonunu Canlıya Dağıtmak (Tavsiye Edilen)

Yerel backend reposunda (`C:\Users\alp_t\source\repos\IsaShopAPI`) eksik tabloyu oluşturan migrasyon hazırlandı:
- **Yeni Migrasyon Dosyası:** `IsaShop.Persistence/Migrations/20260908121506_FixPushSubscriptionsTable.cs`
- **Model Snapshot:** `AppDbContextModelSnapshot.cs` güncellendi.

**Yapılması Gereken:**
```bash
cd C:\Users\alp_t\source\repos\IsaShopAPI
git add IsaShop.Persistence/Migrations/
git commit -m "fix(persistence): add missing PushSubscriptions table migration"
git push origin Develop

# Ardından master'a merge edip pushlayınız (GitHub Actions otomatik database update & deploy yapacaktır):
git checkout master
git pull origin master
git merge Develop
git push origin master
```

---

### Yöntem B: Doğrudan Canlı SQL Server Üzerinde Çalıştırılacak Acil SQL Scripti

Deployment beklemeden sorunu anında çözmek için canlı SQL veritabanında aşağıdaki T-SQL sorgusunu çalıştırmanız yeterlidir:

```sql
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PushSubscriptions')
BEGIN
    CREATE TABLE [dbo].[PushSubscriptions] (
        [Id]                UNIQUEIDENTIFIER NOT NULL,
        [ApplicationUserId] UNIQUEIDENTIFIER NOT NULL,
        [Endpoint]          NVARCHAR(500)    NOT NULL,
        [P256dh]            NVARCHAR(200)    NOT NULL,
        [Auth]              NVARCHAR(200)    NOT NULL,
        [UserAgent]         NVARCHAR(300)    NULL,
        [CreatedAt]         DATETIMEOFFSET   NOT NULL,
        [UpdatedAt]         DATETIMEOFFSET   NULL,
        [CreatedBy]         NVARCHAR(MAX)    NULL,
        [UpdatedBy]         NVARCHAR(MAX)    NULL,
        CONSTRAINT [PK_PushSubscriptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PushSubscriptions_AspNetUsers_ApplicationUserId] 
            FOREIGN KEY ([ApplicationUserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_PushSubscriptions_ApplicationUserId] ON [dbo].[PushSubscriptions] ([ApplicationUserId]);
    CREATE UNIQUE INDEX [IX_PushSubscriptions_Endpoint] ON [dbo].[PushSubscriptions] ([Endpoint]);
    
    PRINT 'PushSubscriptions tablosu başarıyla oluşturuldu.';
END
ELSE
BEGIN
    PRINT 'PushSubscriptions tablosu zaten mevcut.';
END
GO
```

---

## 4. ✅ Doğrulama Adımı

Tablo oluşturulduktan sonra admin panelinden veya tarayıcıdan bildirim izni verildiğinde `POST /api/account/push-subscriptions` isteği **200 OK** dönecek ve push abonelik kaydı veritabanına başarıyla yazılacaktır.
