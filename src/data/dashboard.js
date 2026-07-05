// ============================================================
// MÜŞTERİ PANELİ MOCK DATA
// ============================================================

export const demoUser = {
  email: "ogrenci@gmail.com",
  password: "123456",
  name: "Ece Yıldız",
  avatar: null, // null = initials göster
  memberSince: "Ocak 2024",
  level: "Gümüş Üye",
  points: 1240,
};

export const dashboardStats = [
  {
    id: "orders",
    label: "Toplam Sipariş",
    value: 8,
    icon: "📦",
    color: "#C9A227",
  },
  {
    id: "wishlist",
    label: "Favoriler",
    value: 12,
    icon: "♥",
    color: "#C45079",
  },
  { id: "points", label: "Puan", value: 1240, icon: "✦", color: "#7B4EA6" },
  {
    id: "spent",
    label: "Toplam Harcama",
    value: "187 €",
    icon: "💎",
    color: "#0e8a56",
  },
];

export const orderHistory = [
  {
    id: "#MV-2025-001",
    date: "15 Haz 2025",
    status: "Teslim Edildi",
    statusCode: "delivered",
    items: [
      { name: "Lavanta Uçucu Yağı 10ml", qty: 2, price: "7.98 €" },
      { name: "Ham Ametist Taşı", qty: 1, price: "7.20 €" },
    ],
    total: "15.18 €",
  },
  {
    id: "#MV-2025-002",
    date: "28 May 2025",
    status: "Kargoda",
    statusCode: "shipping",
    items: [
      { name: "Çakra Çay Seti – 7 Bitki Karışımı", qty: 1, price: "14.50 €" },
      { name: "Selenit Çubuk", qty: 1, price: "8.50 €" },
    ],
    total: "23.00 €",
  },
  {
    id: "#MV-2025-003",
    date: "10 May 2025",
    status: "Hazırlanıyor",
    statusCode: "preparing",
    items: [{ name: "Adaçayı Tütsü Demeti", qty: 3, price: "19.50 €" }],
    total: "19.50 €",
  },
  {
    id: "#MV-2025-004",
    date: "2 Nis 2025",
    status: "Teslim Edildi",
    statusCode: "delivered",
    items: [
      { name: "Tarot Kartı Kesesi", qty: 1, price: "5.90 €" },
      { name: "Palo Santo Çubukları 5'li", qty: 2, price: "11.20 €" },
    ],
    total: "17.10 €",
  },
];

export const wishlistItems = [
  {
    id: 1,
    name: "Pembe Kuvars Doğal Taş Bileklik",
    price: "9.90 €",
    image:
      "https://www.aromantra.com/hpeciai/5a41ef8e97c402e95227b0d980ac8ae6/eng_il_Incense-Sticks-Namaste-India-Palo-Santo-14455.jpg",
  },
  {
    id: 2,
    name: "Burç Çayı – Yay Karışımı 50g",
    price: "6.80 €",
    image:
      "https://www.aromantra.com/hpeciai/d7c7de852cf4f7e634b8e43115d669e3/eng_il_Magic-Pwdr-Power-Matcha-Energy-Focus-Blend-30g-14474.jpg",
  },
  {
    id: 3,
    name: "Doğal Taş Seti – 7 Çakra",
    price: "18.90 €",
    image:
      "https://www.aromantra.com/hpeciai/95f4ae9943457e5b0393fdaa7bf2323a/eng_il_Mary-Rose-White-Matcha-Alternative-Banana-Powder-50g-14623.jpg",
  },
  {
    id: 4,
    name: "Premium Tütsülük – Ahşap Lotus",
    price: "11.20 €",
    image:
      "https://www.aromantra.com/hpeciai/5a41ef8e97c402e95227b0d980ac8ae6/eng_il_Incense-Sticks-Namaste-India-Palo-Santo-14455.jpg",
  },
];
