# Backend ↔ Frontend Uyum Raporu

## Chat Endpoints — ✅ TAMAMEN UYUMLU

| Frontend (chatApi.js) | Backend | Durum |
|----------------------|---------|-------|
| `POST /admin/chat/conversations/{id}/close` | `[HttpPut]` + `[HttpPost]` | ✅ |
| `POST /admin/chat/conversations/{id}/reopen` | `[HttpPut]` + `[HttpPost]` | ✅ |
| `POST /admin/chat/conversations/{id}/delete` | `[HttpDelete]` + `[HttpPost]` | ✅ |
| `POST /admin/chat/messages/delete` | `[HttpDelete]` + `[HttpPost]` | ✅ |
| `POST /chat/conversations/{id}/delete` | `[HttpDelete]` + `[HttpPost]` | ✅ |
| `POST /chat/messages/delete` | `[HttpDelete]` + `[HttpPost]` | ✅ |
| `GET /admin/chat/conversations` | `[HttpGet]` | ✅ |
| `GET /admin/chat/conversations/{id}/messages` | `[HttpGet]` | ✅ |
| `POST /admin/chat/conversations/{id}/messages` | `[HttpPost]` | ✅ |
| `POST /admin/chat/conversations/by-user/{userId}` | `[HttpPost]` | ✅ |
| `GET /chat/conversations/my` | `[HttpGet]` | ✅ |
| `POST /chat/conversations` | `[HttpPost]` | ✅ |
| `GET /chat/conversations/{id}/messages` | `[HttpGet]` | ✅ |
| `POST /chat/conversations/{id}/messages` | `[HttpPost]` | ✅ |

> Backend her endpoint'te **çift routing** kullanmış (örn. `[HttpDelete]` + `[HttpPost(".../delete")]`), bu sayede hem eski hem yeni method çalışır. Frontend sadece POST kullandığı için Natro'da sorun olmaz.

---

## ⚠️ Review Moderation — PUT/DELETE Hâlâ Kullanıyor

Backend `AdminReviewsController`:

| Endpoint | Method | Frontend (reviewApi.js) | Natro'da Çalışır mı? |
|----------|--------|------------------------|---------------------|
| `/admin/reviews/pending` | GET | `getPendingReviews()` | ✅ |
| `/admin/reviews/{id}/approve` | **PUT** | `approveReview(id)` → `method: "PUT"` | ❌ |
| `/admin/reviews/{id}/reject` | **PUT** | `rejectReview(id)` → `method: "PUT"` | ❌ |
| `/admin/reviews/{id}` | **DELETE** | `deleteAdminReview(id)` → `method: "DELETE"` | ❌ |

Backend'de **POST fallback yok**. Bu endpoint'ler Natro'da `405 Method Not Allowed` döner.

### Çözüm önerisi:
Backend'e chat'te olduğu gibi çift routing eklenmeli:
```csharp
[HttpPut("{id:guid}/approve")]
[HttpPost("{id:guid}/approve")]
public async Task<IActionResult> Approve(Guid id, ...)

[HttpPut("{id:guid}/reject")]
[HttpPost("{id:guid}/reject")]
public async Task<IActionResult> Reject(Guid id, ...)

[HttpDelete("{id:guid}")]
[HttpPost("{id:guid}/delete")]
public async Task<IActionResult> Delete(Guid id, ...)
```

Frontend'deki `reviewApi.js` ise şu an **zaten** PUT/DELETE kullanıyor (önceden yazılmıştı, değişmedi). Chat dışına dokunma dediğiniz için değiştirmedim. İsterseniz onu da POST'a çevirelim.

---

## Özet

- ✅ **Chat endpoints** — tam uyumlu
- ⚠️ **Review endpoints** — PUT/DELETE, Natro'da çalışmaz, backend'e POST fallback eklenmeli
- ✅ **Diğer endpoint'ler** (auth, product, category, banner, order, payment, vs.) — değişiklik yok, mevcut haliyle çalışır
