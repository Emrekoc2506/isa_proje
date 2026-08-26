# 🔒 ISA SHOP API — Backend JWT HttpOnly Cookie Entegrasyon Rehberi

## Özet & Amaç
Bu rapor, frontend uygulamasında (`isa_proje`) XSS (Cross-Site Scripting) saldırılarına karşı maksimum güvenlik sağlamak üzere JWT Access Token ve Refresh Token'ların `localStorage` yerine **HttpOnly Cookie** ortamında saklanması için **C# ASP.NET Core (`IsaShopAPI`)** backend ekibine yönelik hazırlanmıştır.

---

## 1. C# ASP.NET Core Entegrasyon Adımları

### A. Giriş (Login) & Kayıt (Register) Controller Düzenlemesi

`AuthController.cs` içerisindeki `Login` ve `RefreshToken` metodlarında token'ı JSON body yerine veya ek olarak `Response.Cookies` nesnesine yazın:

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var result = await _mediator.Send(new LoginCommand(request));
    if (!result.IsSuccess) return Unauthorized(result.Error);

    // HttpOnly Cookie Seçenekleri
    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,                               // JavaScript ile erişilemez (XSS Koruması)
        Secure = true,                                 // Sadece HTTPS protokolünde gönderilir
        SameSite = SameSiteMode.Strict,                 // CSRF Koruması
        Expires = DateTimeOffset.UtcNow.AddDays(7)     // Token süresi
    };

    // Cookie olarak ekle
    Response.Cookies.Append("accessToken", result.Value.AccessToken, cookieOptions);
    Response.Cookies.Append("refreshToken", result.Value.RefreshToken, cookieOptions);

    return Ok(new { message = "Giriş başarılı", user = result.Value.User });
}
```

### B. Logout (Çıkış) Controller Düzenlemesi

```csharp
[HttpPost("logout")]
public IActionResult Logout()
{
    Response.Cookies.Delete("accessToken");
    Response.Cookies.Delete("refreshToken");
    return Ok(new { message = "Oturum sonlandırıldı" });
}
```

### C. Program.cs (CORS ve JWT Cookie Okuyucu)

`Program.cs` içerisinde CORS politikasına `AllowCredentials()` ekleyin ve JWT Authentication Handler'ın Cookie üzerinden de token okuyabilmesini sağlayın:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://muhristan.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Cookie gönderimi için ZORUNLU
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // İlk olarak Cookie'den oku, yoksa Authorization Bearer header'ına bak
                if (context.Request.Cookies.ContainsKey("accessToken"))
                {
                    context.Token = context.Request.Cookies["accessToken"];
                }
                return Task.CompletedTask;
            }
        };
    });
```

---

## 2. Frontend Uyum Durumu

Frontend `apiClient.js` sarmalayıcımız varsayılan olarak `credentials: "include"` seçeneğine sahiptir. Backend güncellendiği anda tarayıcı tüm isteklerde `accessToken` çerezini otomatik ve güvenli bir biçimde gönderecektir.
