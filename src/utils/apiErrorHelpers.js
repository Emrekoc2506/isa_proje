/**
 * Natro Windows Hosting POST Hard-Delete Hata Mesajı Yardımcısı
 * 
 * Backend'den dönen hata kodlarını kullanıcı dostu Türkçe mesajlara dönüştürür.
 * 
 * @param {Object} error - ApiError veya standart Hata nesnesi (error.code ve error.message barındırabilir)
 * @param {string} entityName - Nesne adı ("Ürün", "Kategori", "İlan" vb.)
 * @returns {string} Kullanıcıya gösterilecek hata mesajı
 */
export function getHardDeleteErrorMessage(error, entityName = "Kayıt") {
  if (!error) return `${entityName} silinemedi.`;

  switch (error.code) {
    case "product_has_order_history":
      return "Bu ürün geçmiş siparişlerde kullanıldığı için tamamen silinemez. Ürünü pasif hale getirebilirsiniz.";

    case "category_has_products":
      return "Bu kategoride ürün bulunuyor. Önce ürünleri başka bir kategoriye taşıyın veya ürünleri tamamen silin.";

    case "category_has_children":
      return "Bu kategorinin alt kategorileri bulunuyor. Önce alt kategorileri taşıyın veya silin.";

    case "confirmation_required":
      return "Kalıcı silme onayı gönderilemedi. Sayfayı yenileyip tekrar deneyin.";

    case "hard_delete_conflict":
      return `${entityName} bağlı veriler nedeniyle tamamen silinemedi. İlişkili kayıtları kontrol edin.`;

    case "hard_delete_file_cleanup_failed":
      return "Kayıt silindi ancak bazı dosyalar temizlenemedi. Sunucu kayıtlarını kontrol edin.";

    case "not_found":
      return `${entityName} artık mevcut değil. Liste yenileniyor.`;

    case "unauthorized":
    case 401:
      return "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";

    case "forbidden":
    case 403:
      return "Bu işlem için admin yetkiniz bulunmuyor.";

    case "network_error":
      return "Sunucuya bağlanılamadı. Lütfen tekrar deneyin.";

    default:
      return error.message || `${entityName} silinemedi.`;
  }
}
