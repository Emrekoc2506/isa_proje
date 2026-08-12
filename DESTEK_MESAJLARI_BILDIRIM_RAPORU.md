# Destek Mesajları Okundu & Bildirim Sorunu — Analiz ve Yapılacaklar Raporu

---

## 1. Sorun Özeti

**Belirti:** Kullanıcı (Admin veya Müşteri) "Destek Mesajları" / "Mesajlarım" sayfasında bir konuşmayı açıp mesajları okusa bile, bildirim zili üzerindeki okunmamış sayacı düşmüyor. Bildirim "var" demeye devam ediyor.

**Neden tek cümleyle:** Chat ekranı, bir konuşmayı **"okudum" olarak işaretlemiyor** — ne backend'e bir sinyal gönderiyor ne de bildirim sistemini (NotificationContext) güncelliyor.

---

## 2. Kök Neden Analizi

İki bağımsız "okunmamış" sistemi vardır ve hiçbiri konuşma okununca senkronize edilmiyor:

| Sistem | Kaynak | Nerede görünüyor |
|---|---|---|
| **Global bildirim zili** | `NotificationContext` (`unreadCount`, `NotificationContext.jsx:175`) | `Header.jsx:219`, `DashboardPage.jsx:540` |
| **Konuşma rozeti** | Backend `ConversationResponse.unreadCount` | `ChatUI.jsx:705` (sidebar rozet) |

### 2.1. Konuşma açılınca "okundu" sinyali gönderilmiyor (ANA NEDEN)

- `ChatUI.jsx:676` — Konuşmaya tıklandığında yalnızca `setSelectedConv(conv)` yapılıyor. Backend'e "bu konuşmayı okudum" denmiyor.
- `chatApi.js` içinde **`markConversationAsRead` benzeri hiçbir REST endpoint yok** (dosyanın tamamı incelendi — sadece close/reopen/delete/messages var).
- `chatService.js` içinde **`MarkAsRead` hub metoduna invoke yok** (sadece `JoinConversation`, `LeaveConversation`, `Typing`, `AdminJoinSupportPanel` var).
- Sonuç: Backend'de `unreadCount` ve ilgili bildirimlerin `isRead=false` durumu değişmiyor. Sayfa yenilense bile aynı bildirimler tekrar geliyor.

### 2.2. `MarkAsRead` SignalR handler'ı boş

- `ChatUI.jsx:356` → `const handleMarkAsRead = () => {};`
- `ChatUI.jsx:383` → `conn.on('MarkAsRead', handleMarkAsRead)`
- Backend `MarkAsRead` olayı yayınlasa bile frontend **hiçbir şey yapmıyor**. Karşı tarafta okundu işareti de düzgün çalışmaz (bu olay "okundu" bilgisini yaymak için kullanılıyor olmalı).

### 2.3. ChatUI bildirim sistemine bağlı değil

- `ChatUI.jsx` içinde `useNotifications()` **hiç çağrılmıyor**.
- Konuşma okunduğunda:
  - `markRead(notificationId)` çağrılmıyor → zildeki `unreadCount` düşmüyor.
  - `refreshNotifications()` çağrılmıyor → bildirim listesi güncellenmiyor.
- Bildirim yalnızca **zildeki bildirime tıklanırsa** okunuyor (`NotificationDropdown.jsx:29-33` → `handleNotifClick` → `markRead(notif.id)`). Doğrudan Destek Mesajları sayfasından okuma bu akışa girmiyor.

### 2.4. Veri modeli eksikliği (backend ile ilgili tespit)

- `schema.d.ts:142-153` — `MessageResponse` içinde `isRead` alanı var ama frontend bu alanı **kullanmıyor**.
- `schema.d.ts:165-173` — `NotificationResponse` içinde **`conversationId` yok**. Yani frontend, hangi bildirimin hangi konuşmaya ait olduğunu bilmiyor; belirli bir konuşma okununca "o konuşmaya ait bildirimleri" tek tek işaretleyemez.

---

## 3. Yapılacaklar

### 🔴 3.1. Konuşma okundu işaretleme (Frontend)

1. **`src/services/chatApi.js`** → mark-as-read API fonksiyonları ekle:
   ```js
   // Müşteri
   export function markConversationAsRead(id) {
     return request(`/chat/conversations/${id}/read`, { method: "PUT" });
   }
   // Admin
   export function markAdminConversationAsRead(id) {
     return request(`/admin/chat/conversations/${id}/read`, { method: "PUT" });
   }
   ```
   > ⚠️ Backend'de bu endpoint'in varlığı **doğrulanmalı** (bkz. 3.4). Yoksa backend'e eklenmeli.

2. **`src/services/chatService.js`** → SignalR `MarkAsRead` invoke:
   ```js
   export const markConversationReadLive = async (conversationId) => {
     if (connection && connection.state === signalR.HubConnectionState.Connected) {
       await connection.invoke("MarkAsRead", conversationId);
     }
   };
   ```

3. **`src/components/ChatUI/ChatUI.jsx`**:
   - Konuşma seçildiğinde (`onClick` satır 676 veya `selectedConv` effect'i) **iki çağrıyı birden yap**: REST `markConversationAsRead(id)` + SignalR `markConversationReadLive(id)`.
   - `handleMarkAsRead` (satır 356) boş handler'ını doldur: backend'den okundu sinyali gelince konuşma listesindeki `unreadCount`'u sıfırla:
     ```js
     const handleMarkAsRead = (conversationId) => {
       setConversations(prev =>
         prev.map(c => String(c.id) === String(conversationId) ? { ...c, unreadCount: 0 } : c)
       );
     };
     ```
   - `conv.unreadCount` rozetini, konuşma okunduğunda yerelde de sıfırla (başarısız API'ye bağımlı kalmamak için optimistic).

### 🔴 3.2. Bildirim zili senkronizasyonu

1. **`ChatUI.jsx`** içine `useNotifications()` bağla:
   ```js
   const { refreshNotifications } = useNotifications();
   ```
2. Konuşma başarıyla okundu işaretlendikten sonra `refreshNotifications()` çağır → zil sayacı backend'in yeni durumuna göre güncellenir.
3. Eğer backend **belirli konuşmanın bildirimlerini** okundu yapmıyorsa (2.4'teki model eksikliği nedeniyle), geçici çözüm: chat tipindeki okunmamış bildirimleri okundu işaretle. Bunun için `NotificationContext`'e, `type`'ı `chat`/`message` olan bildirimleri toplu okundu yapan bir yardımcı (`markChatNotificationsRead`) eklenebilir. *(Kalıcı çözüm: backend'e `Notification` ile `ConversationId` eşleşmesi eklenmesi — bkz. 3.4.)*

### 🟡 3.3. Bildirim tıklaması → konuşma eşleşmesi (iyileştirme)

- `NotificationDropdown.handleNotifClick` (`NotificationDropdown.jsx:29-33`) bildirimi okundu yapıp `/admin?tab=messages` veya `/panel`'e yönlendiriyor. ChatUI'ye konuşma seçili gelmiyor (sadece sekme açılıyor). İyileştirme: bildirim `link`/`targetUrl` alanına `?tab=messages&conv={id}` eklenip ChatUI'nin o konuşmayı açması sağlanabilir (backend'de `targetUrl` set ediliyorsa oradan).

### 🟡 3.4. Backend doğrulaması / gereksinimleri

| Kontrol | Durum |
|---|---|
| `PUT /chat/conversations/{id}/read` ve `PUT /admin/chat/conversations/{id}/read` endpoint'leri var mı? | ❓ Doğrulanmalı |
| ChatHub `MarkAsRead` metodu var mı? | ❓ Doğrulanmalı (frontend `conn.on('MarkAsRead')` dinliyor, yani olay adı backend'de bekleniyor) |
| Konuşma okunduğunda ilişkili `Notification.IsRead=true` yapılıyor mu? | ❓ Doğrulanmalı |
| `NotificationResponse` içinde konuşma ilişkisi (örn. `ConversationId` veya özel `link`) dönüyor mu? | ❌ Şu an `schema.d.ts`'de yok |

> Backend tarafı bu repoda değil (sadece API raporları var). `.NET` tarafındaki `ChatController` / `ChatHub` / `NotificationService` ile birebir uyum testi yapılması gerekir.

### 🟢 3.5. Testler

- `src/tests/` altına chat okundu testi ekle:
  1. Konuşma açıldığında `markConversationAsRead` çağrılıyor mu? (msw ile `PUT .../read` yakala)
  2. Başarı sonrası `refreshNotifications` tetikleniyor mu / zil sayacı düşüyor mu?
  3. `MarkAsRead` SignalR olayı gelince `unreadCount` rozeti sıfırlanıyor mu?

---

## 4. Doğrulama Komutları

```bash
npm run lint        # yeni uyarı eklenmediğinden emin ol
npm run test        # 152 test + yeni chat okundu testleri geçmeli
npm run build       # üretim build'i
```

---

_Rapor tarihi: 12 Ağustos 2026_
