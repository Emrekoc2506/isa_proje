# 🚨 Backend Ekibine Durum Raporu: Facebook Katalog Feed & Web Push Entegrasyonu

**Tarih:** 07.09.2026  
**Konu:** Facebook Katalog XML Feed'i ve Web Push Servislerinin Canlıya (Production) Alınması  
**İlgili Depo:** `IsaShopAPI` (Branch: `Develop` ➔ `master`)  
**Durum:** Canlıda 404 (Yayına Alma / Deploy Bekliyor)

---

## 1. 📌 Mevcut Durum ve Sorun

Canlı ortamdaki (`https://api.muhristan.com`) aşağıdaki uç noktalar şu an **404 Not Found** dönmektedir:
1. `GET https://api.muhristan.com/facebook-catalog.xml` (veya `/api/feed/facebook-catalog.xml`)
2. `GET https://api.muhristan.com/api/account/push/public-key`
3. `POST https://api.muhristan.com/api/account/push-subscriptions`

### Kök Neden (Root Cause):
1. **GitHub Actions CI/CD Kırılması:**  
   Saat 17:28:54'te yapılan PR #137 merge commit'inde (`2682488`) `Abstractions.cs`, `Outbox.cs` ve `OutboxWorker.cs` dosyalarına Git çakışma işaretçileri (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) sehven dahil edilmiş; bu nedenle GitHub Actions derleme (CS8300) hatası alarak dağıtımı durdurmuştur.
2. **Master Branch Dağıtımı:**  
   `deploy-production.yml` workflow'u yalnızca `master` branch push'larında çalıştığı için, `Develop` üzerindeki yeni Feed ve Push geliştirmeleri henüz canlı sunucuya aktarılmamıştır.

---

## 2. 🛠️ Yerelde Yapılan ve Doğrulanan Düzeltmeler

Yerel ortamdaki kod tabanında çakışmalar giderilmiş, Meta CAPI ve WebPush akışları eksiksiz birleştirilmiştir:

1. **`IsaShop.Application/Abstractions/Abstractions.cs`:**  
   `IOutboxService` içerisindeki çakışma giderilerek hem Meta CAPI (`CaptureMetaAttribution`, `EnqueueMetaPurchase`, `EnqueueMetaRegistration`) hem de Web Push (`EnqueueWebPushToUser`) arayüz metodları korundu.
2. **`IsaShop.Application/Outbox/Outbox.cs`:**  
   `OutboxService` sınıfında hem Meta Conversion hem de WebPush outbox kayıt mekanizmaları birleştirildi.
3. **`IsaShop.Infrastructure/Outbox/OutboxWorker.cs`:**  
   Outbox worker döngüsünde `Email`, `MetaConversion` ve `WebPush` tiplerinin üçünü de işleyen mantık ve yardımcı metotlar derlenebilir hale getirildi.
4. **`IsaShopAPI/Extensions/ApiServiceRegistration.cs`:**  
   Mükerrer using direktifi temizlendi.

### Test ve Derleme Sonucu:
```bash
dotnet build IsaShopAPI.sln  -> 0 Hata, 0 Uyarı
dotnet test IsaShopAPI.sln   -> 361 Testin Tamamı Başarılı (0 Hata)
```

---

## 3. 💻 Frontend Tarafında Tamamlanan Kısım

Frontend (`isa proje`) tarafında görev dokümanına istinaden tüm geliştirmeler tamamlanmıştır:
- **`public/push-sw.js`:** Kök dizinde Service Worker oluşturuldu. Arka planda `push` olaylarını yakalayıp titreşim/sesle uyarır ve tıklandığında admin sipariş sayfasına yönlendirir.
- **`src/services/webPushService.js`:** VAPID public key dönüştürme, tarayıcı izni isteme, servis kaydı ve backend abonelik/iptal fonksiyonları yazıldı.
- **`src/services/accountApi.js`:** `getPushPublicKey`, `subscribePush`, `unsubscribePush` API çağrıları bağlandı.
- **`src/pages/AuthPage/AuthPage.jsx`:** Yetkili kullanıcılar (Admin/SuperAdmin) giriş yaptığı anda otomatik Web Push abonelik akışı eklendi.
- **`src/components/AdminPushToggle/AdminPushToggle.jsx`:** Yönetim paneli üst çubuğuna bildirim durumu rozeti (🟢 Aktif / 🟡 Bekliyor / 🔴 Engelli / 🔵 iPhone PWA), tek tıkla açma/kapatma ve test bildirimi butonu eklendi.
- **Testler:** 267 frontend birim/entegrasyon testinin tamamı başarıyla geçmektedir.

---

## 4. 🎯 Backend Ekibinden Beklenen Aksiyonlar

Feed linkinin ve Web Push servisinin canlıda aktif olabilmesi için lütfen aşağıdaki adımları tamamlayınız:

1. **Çakışma Düzeltmelerini Pushlayın:**  
   Yerelde düzeltilen 4 dosyadaki (`Abstractions.cs`, `Outbox.cs`, `OutboxWorker.cs`, `ApiServiceRegistration.cs`) değişiklikleri `Develop` branch'ine commit ve push yapın:
   ```bash
   git add IsaShop.Application/Abstractions/Abstractions.cs IsaShop.Application/Outbox/Outbox.cs IsaShop.Infrastructure/Outbox/OutboxWorker.cs IsaShopAPI/Extensions/ApiServiceRegistration.cs
   git commit -m "fix(outbox): resolve merge conflict between Meta CAPI and WebPush"
   git push origin Develop
   ```

2. **Canlıya (Production) Merge & Deploy:**  
   `Develop` branch'ini `master` branch'e merge edin:
   ```bash
   git checkout master
   git pull origin master
   git merge Develop
   git push origin master
   ```
   *Veya GitHub üzerinden `Develop` ➔ `master` Pull Request oluşturup birleştirin.*

3. **Canlı Doğrulama:**  
   Dağıtım tamamlandıktan sonra aşağıdaki URL'lerin 200 OK döndüğünü teyit edin:
   - `https://api.muhristan.com/facebook-catalog.xml`
   - `https://api.muhristan.com/api/account/push/public-key`
