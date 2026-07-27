import { request } from "./apiClient";
import { safeGetJson, safeSetJson } from "../utils/storage";

const LOCAL_BLOG_KEY = "isa_custom_blog_articles";

function normalizeArticle(item) {
  if (!item) return null;
  const rawDesc = item.summary || item.description || (typeof item.content === 'string' ? item.content.replace(/<[^>]+>/g, '').slice(0, 150) : '');
  return {
    id: item.id || `blog-${Date.now()}`,
    title: item.title || item.name || '',
    summary: rawDesc,
    description: rawDesc,
    content: item.content || rawDesc,
    image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?q=80&w=1200&auto=format&fit=crop',
    category: item.category || 'Genel',
    date: item.date || item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
    readTime: item.readTime || '5 dk okuma',
    slug: item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `blog-${Date.now()}`),
    isActive: item.isActive !== undefined ? item.isActive : true
  };
}

function getLocalArticles() {
  return safeGetJson(LOCAL_BLOG_KEY, []);
}

function saveLocalArticle(article) {
  const current = getLocalArticles();
  const normalized = normalizeArticle(article);
  const updated = [normalized, ...current.filter(a => a.id !== normalized.id)];
  safeSetJson(LOCAL_BLOG_KEY, updated);
  return normalized;
}

function deleteLocalArticle(id) {
  const current = getLocalArticles();
  const updated = current.filter(a => a.id !== id && a.slug !== id);
  safeSetJson(LOCAL_BLOG_KEY, updated);
}

export async function getBlogArticles(params = {}) {
  let apiArticles = [];
  try {
    const query = new URLSearchParams(params).toString();
    const res = await request(`/blog${query ? `?${query}` : ''}`, { method: "GET" });
    if (res && Array.isArray(res)) apiArticles = res;
    else if (res && Array.isArray(res.items)) apiArticles = res.items;
  } catch (err) {
    // API not reachable or endpoint empty
  }

  const local = getLocalArticles();
  const merged = [...local];
  
  apiArticles.forEach(apiItem => {
    const norm = normalizeArticle(apiItem);
    if (norm && !merged.some(m => m.id === norm.id || m.slug === norm.slug)) {
      merged.push(norm);
    }
  });

  return merged;
}

export async function getBlogArticleBySlug(slug) {
  try {
    const res = await request(`/blog/${slug}`, { method: "GET" });
    if (res) return normalizeArticle(res);
  } catch (err) {
    // Fallback to local
  }
  const local = getLocalArticles();
  const found = local.find(a => a.slug === slug || a.id === slug);
  return found ? normalizeArticle(found) : null;
}

export async function getBlogCategories() {
  try {
    const res = await request("/blog/categories", { method: "GET" });
    if (res && Array.isArray(res)) return res;
  } catch (err) {
    // Fallback
  }
  return [
    { id: "cat-1", name: "Doğal Taşlar", slug: "dogal-taslar" },
    { id: "cat-2", name: "Bakım & Arınma", slug: "bakim-arinma" },
    { id: "cat-3", name: "Rehber", slug: "rehber" }
  ];
}

// Admin Blog CRUD
export async function getAdminBlogArticles(params = {}) {
  let apiArticles = [];
  try {
    const query = new URLSearchParams(params).toString();
    const res = await request(`/admin/blog${query ? `?${query}` : ''}`);
    if (res && Array.isArray(res)) apiArticles = res;
    else if (res && Array.isArray(res.items)) apiArticles = res.items;
  } catch (err) {
    // API fallback
  }

  const local = getLocalArticles();
  const merged = [...local];
  
  apiArticles.forEach(apiItem => {
    const norm = normalizeArticle(apiItem);
    if (norm && !merged.some(m => m.id === norm.id || m.slug === norm.slug)) {
      merged.push(norm);
    }
  });

  return merged;
}

export function getAdminBlogArticleById(id) {
  return request(`/admin/blog/${id}`);
}

export async function createAdminBlogArticle(payload) {
  const localSaved = saveLocalArticle(payload);
  try {
    await request("/admin/blog", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("Backend blog save endpoint unavailable, article saved locally:", err);
  }
  return localSaved;
}

export async function updateAdminBlogArticle(id, payload) {
  saveLocalArticle({ ...payload, id });
  try {
    return await request(`/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return payload;
  }
}

export async function deleteAdminBlogArticle(id) {
  deleteLocalArticle(id);
  try {
    return await request(`/admin/blog/${id}`, {
      method: "DELETE"
    });
  } catch (err) {
    return true;
  }
}

export function updateAdminBlogArticleStatus(id, isActive) {
  return request(`/admin/blog/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export function getAdminBlogCategories() {
  return request("/admin/blog/categories");
}

export function createAdminBlogCategory(payload) {
  return request("/admin/blog/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminBlogCategory(id, payload) {
  return request(`/admin/blog/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminBlogCategory(id) {
  return request(`/admin/blog/categories/${id}`, {
    method: "DELETE"
  });
}
