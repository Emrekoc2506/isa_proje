/**
 * blogApi.js — Blog Modülü Servis Katmanı
 * Backend spec: http://api-test.ozeldersvip.xyz/api
 * NOT: Natro, PUT/PATCH/DELETE metotlarını engeller.
 *      Bunların yerine POST /{id}/update, /{id}/status, /{id}/delete kullanılır.
 */
import { request } from "./apiClient";

// ─────────────────────────────────────────────────────────────
// Response normalizasyonu (public + admin makaleler için ortak)
// ─────────────────────────────────────────────────────────────
function normalizeDates(item) {
  if (!item) return null;
  const raw = item.publishedAt || item.createdAt || item.date;
  let dateStr = '';
  if (raw) {
    try {
      dateStr = new Date(raw).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      dateStr = raw;
    }
  }
  return {
    ...item,
    // Ortak alan isimlendirmeleri frontend'e normalize et
    image:       item.coverImageUrl || item.image || null,
    summary:     item.summary || item.description || '',
    description: item.summary || item.description || '',
    date:        dateStr,
    readTime:    item.readTime || '5 dk okuma',
    isActive:    item.status === 'Published' || item.isActive === true,
    status:      item.status || (item.isActive ? 'Published' : 'Draft'),
    slug:        item.slug || item.id,
  };
}

function extractItems(res) {
  if (!res) return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  if (Array.isArray(res)) return { items: res.map(normalizeDates), totalCount: res.length, page: 1, pageSize: res.length };
  if (Array.isArray(res.items)) return { ...res, items: res.items.map(normalizeDates) };
  return { items: [], totalCount: 0, page: 1, pageSize: 20 };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTLERİ
// ─────────────────────────────────────────────────────────────

/**
 * Public blog listesi (sadece yayınlanmış + yayın tarihi gelmiş)
 * @param {{ page?: number, pageSize?: number }} params
 * @returns {{ items: Array, totalCount: number, page: number, pageSize: number }}
 */
export async function getBlogArticles(params = {}) {
  const { page = 1, pageSize = 20, ...rest } = params;
  const query = new URLSearchParams({ page, pageSize, ...rest }).toString();
  try {
    const res = await request(`/blog?${query}`, { method: 'GET' });
    return extractItems(res);
  } catch {
    return { items: [], totalCount: 0, page, pageSize };
  }
}

/**
 * Tekil blog makalesi — slug veya id ile
 */
export async function getBlogArticleBySlug(slugOrId) {
  try {
    const res = await request(`/blog/${slugOrId}`, { method: 'GET' });
    return res ? normalizeDates(res) : null;
  } catch {
    return null;
  }
}

/**
 * Public kategori listesi
 */
export async function getBlogCategories() {
  try {
    const res = await request('/blog/categories', { method: 'GET' });
    if (res && Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
  } catch {
    // Fallback statik kategoriler
  }
  return [
    { id: 'dogal-taslar',         name: 'Doğal Taşlar' },
    { id: 'bakim-arinma',         name: 'Bakım & Arınma' },
    { id: 'kristaller-meditasyon',name: 'Kristaller & Meditasyon' },
    { id: 'rehber',               name: 'Rehber' },
  ];
}

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTLERİ
// ─────────────────────────────────────────────────────────────

/**
 * Admin — Tüm makaleler (aktif + pasif)
 */
export async function getAdminBlogArticles(params = {}) {
  const { page = 1, pageSize = 50, ...rest } = params;
  const query = new URLSearchParams({ page, pageSize, ...rest }).toString();
  try {
    const res = await request(`/admin/blog?${query}`);
    return extractItems(res);
  } catch (err) {
    try {
      const fallbackRes = await request(`/blog?${query}`);
      return extractItems(fallbackRes);
    } catch {
      return { items: [], totalCount: 0, page, pageSize };
    }
  }
}

/**
 * Admin — Tekil makale
 */
export function getAdminBlogArticleById(id) {
  return request(`/admin/blog/${id}`);
}

/**
 * Admin — Yeni makale oluştur
 * Body spec'e uygun olmalı: title, slug, summary, content, blogCategoryId,
 * coverImageUrl, coverImageObjectKey, status ("Published"|"Draft"|"Archived")
 */
export function createAdminBlogArticle(payload) {
  return request('/admin/blog', {
    method: 'POST',
    body: JSON.stringify(buildBlogPayload(payload)),
  });
}

/**
 * Admin — Makale güncelle (POST /{id}/update — PUT/PATCH engelli)
 */
export function updateAdminBlogArticle(id, payload) {
  return request(`/admin/blog/${id}/update`, {
    method: 'POST',
    body: JSON.stringify(buildBlogPayload(payload)),
  });
}

/**
 * Admin — Makale sil (POST /{id}/delete — DELETE engelli)
 */
export function deleteAdminBlogArticle(id) {
  return request(`/admin/blog/${id}/delete`, {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

/**
 * Admin — Makale durumu değiştir (POST /{id}/status)
 * status: "Published" | "Draft" | "Archived"
 */
export function updateAdminBlogArticleStatus(id, status) {
  // isActive boolean gelirse dönüştür
  const statusValue = typeof status === 'boolean'
    ? (status ? 'Published' : 'Draft')
    : status;
  return request(`/admin/blog/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: statusValue }),
  });
}

// ─────────────────────────────────────────────────────────────
// KATEGORİ ENDPOINTLERİ (ADMIN)
// ─────────────────────────────────────────────────────────────

export async function getAdminBlogCategories() {
  try {
    const res = await request('/admin/blog/categories');
    const list = Array.isArray(res) ? res : (res?.items || []);
    if (list.length > 0) return list;
  } catch {
    // Fallback
  }
  return [
    { id: "dogal-taslar", name: "Doğal Taşlar" },
    { id: "bakim-arinma", name: "Bakım & Arınma" },
    { id: "kristaller-meditasyon", name: "Kristaller & Meditasyon" },
    { id: "rehber", name: "Rehber" },
    { id: "genel", name: "Genel" }
  ];
}

export function createAdminBlogCategory(payload) {
  return request('/admin/blog/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminBlogCategory(id, payload) {
  return request(`/admin/blog/categories/${id}/update`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminBlogCategoryStatus(id, status) {
  return request(`/admin/blog/categories/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export function deleteAdminBlogCategory(id) {
  return request(`/admin/blog/categories/${id}/delete`, {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

// ─────────────────────────────────────────────────────────────
// GÖRSEL ENDPOINTLERİ (ADMIN)
// ─────────────────────────────────────────────────────────────

/** Kapak görseli sil */
export function deleteAdminBlogCoverImage(blogId) {
  return request(`/admin/blog/${blogId}/cover-image/delete`, {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

/** İçerik görseli sil */
export function deleteAdminBlogContentImage(blogId, imageId) {
  return request(`/admin/blog/${blogId}/images/${imageId}/delete`, {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

// ─────────────────────────────────────────────────────────────
// YARDIMCI: Blog payload normalize et
// Frontend state → Backend body
// ─────────────────────────────────────────────────────────────
function buildBlogPayload(payload) {
  const {
    title,
    slug,
    summary,
    content,
    blogCategoryId,
    category,          // legacy fallback
    coverImageUrl,
    coverImageObjectKey,
    coverImageAltText,
    status,
    isActive,          // legacy → status dönüşümü
    publishedAt,
    seoTitle,
    seoDescription,
    seoKeywords,
    contentImages,
  } = payload;

  // Durum belirleme: önce status, yoksa isActive
  let resolvedStatus = status;
  if (!resolvedStatus) {
    resolvedStatus = (isActive === false) ? 'Draft' : 'Published';
  }

  // Slug üret (backend de üretir ama gönderiyoruz)
  const resolvedSlug = slug ||
    (title ? title.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : '');

  // GUID Doğrulaması — Eğer blogCategoryId geçerli bir GUID değilse null gönder
  const isGuid = typeof blogCategoryId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(blogCategoryId);
  const resolvedCategoryId = isGuid ? blogCategoryId : null;

  // Yayın tarihi — Yayında ise ve tarih yoksa şu anki ISO tarihini ver
  const resolvedPublishedAt = publishedAt || (resolvedStatus === 'Published' ? new Date().toISOString() : null);

  return {
    title:                  title || '',
    slug:                   resolvedSlug,
    summary:                summary || '',
    content:                content || '',
    blogCategoryId:         resolvedCategoryId,
    coverImageUrl:          coverImageUrl || null,
    coverImageObjectKey:    coverImageObjectKey || null,
    coverImageAltText:      coverImageAltText || null,
    status:                 resolvedStatus,
    publishedAt:            resolvedPublishedAt,
    seoTitle:               seoTitle || null,
    seoDescription:         seoDescription || null,
    seoKeywords:            seoKeywords || null,
    contentImages:          Array.isArray(contentImages) ? contentImages : [],
  };
}
