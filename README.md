# Mysticvelora — Şifa & Ritüel Ürünleri E-Ticaret Arayüzü

Bu proje, Mysticvelora e-ticaret platformunun React + Vite tabanlı ön uç (frontend) uygulamasıdır. Canlı .NET Web API ve SignalR Hub servisleri ile tam entegre çalışmaktadır.

## 🚀 Yerel Kurulum & Çalıştırma

### 1. Bağımlılıkların Yüklenmesi
Proje dizininde terminali açarak gerekli paketleri yükleyin:
```bash
npm install
```

### 2. Çevre Değişkenlerinin (.env) Ayarlanması
Proje kök dizininde `.env` adında bir dosya oluşturun ve aşağıdaki değişkenleri ekleyin (örnek şablon için `.env.example` dosyasına bakabilirsiniz):
```env
VITE_API_BASE_URL=https://localhost:7148/api
VITE_SIGNALR_BASE_URL=https://localhost:7148/hubs
```

> ⚠️ **Önemli Not:** Backend geliştirme ortamında self-signed SSL sertifikaları kullanılmaktadır. Tarayıcınızda veya isteklerde SSL uyarısı alırsanız, `dotnet dev-certs https --trust` komutuyla sertifikayı güvenilir hale getirin veya HTTP profili (`http://localhost:5297`) üzerinden çalışmayı deneyin.

### 3. Uygulamayı Geliştirme Modunda Başlatma
Aşağıdaki komutla yerel sunucuyu başlatabilirsiniz:
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır. CORS izinleri bu port için backend tarafında tanımlanmıştır.

---

## 🛠️ Entegrasyon Detayları

Ön uç uygulamasında gerçekleştirilen canlı API bağlantıları:

- **Auth (Kimlik Doğrulama)**: Gerçek login/register akışı kurulmuştur. Giriş yaptıktan sonra JWT token'lar `localStorage` üzerinde saklanır ve sonraki tüm isteklere `Authorization: Bearer <token>` olarak eklenir. Rol yönetimi aktif edilmiştir:
  - `SuperAdmin` veya `Admin` -> `/admin` (Yönetici Paneli)
  - `Customer` -> `/panel` (Müşteri Paneli)
- **Products & Categories (Ürün & Kategori)**: Tüm ürün listesi, detay bilgileri, kategori ağacı ve filtrelemeler dinamik API üzerinden beslenmektedir.
- **File Upload (Dosya Yükleme)**: Ürün ve banner eklerken görseller `multipart/form-data` formatında API sunucusuna yüklenir ve dönen public URL'ler kullanılır.
- **Orders (Sipariş Yönetimi)**: Sepetten sipariş oluştururken fiyat bilgisi gönderilmez, hesaplama sunucu tarafında yapılır. Misafir siparişleri `/orders/guest` ve üye siparişleri `/orders` uçlarına iletilir.
- **Chat & Real-time Messages (SignalR)**: Müşteri ve Admin arasındaki canlı destek sistemi SignalR Hub (`/hubs/chat`) ile bağlanmıştır.
- **Real-time Notifications (SignalR)**: Bildirimler `/hubs/notifications` üzerinden anlık olarak dinlenmekte ve kullanıcıya yansıtılmaktadır.
