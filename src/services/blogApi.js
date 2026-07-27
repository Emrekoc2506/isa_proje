import { request } from "./apiClient";
import { blogArticles as mockArticles } from "../data/index";

export async function getBlogArticles(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await request(`/blog${query ? `?${query}` : ''}`, { method: "GET" });
    if (res && Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
  } catch (err) {
    // Fallback to static mock articles
  }
  return mockArticles;
}

export async function getBlogArticleBySlug(slug) {
  try {
    const res = await request(`/blog/${slug}`, { method: "GET" });
    if (res) return res;
  } catch (err) {
    // Fallback
  }
  return mockArticles.find(a => a.slug === slug || a.id === slug) || mockArticles[0];
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
export function getAdminBlogArticles(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/blog${query ? `?${query}` : ''}`);
}

export function getAdminBlogArticleById(id) {
  return request(`/admin/blog/${id}`);
}

export function createAdminBlogArticle(payload) {
  return request("/admin/blog", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminBlogArticle(id, payload) {
  return request(`/admin/blog/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminBlogArticle(id) {
  return request(`/admin/blog/${id}`, {
    method: "DELETE"
  });
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
