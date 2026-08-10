import { request } from './apiClient';

export function getSeoMeta(params = {}) {
  const query = new URLSearchParams();
  if (params.productId) query.append('productId', params.productId);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  return request(`/seo/meta?${query.toString()}`);
}

export function getSitemapItems() {
  return request('/seo/sitemap');
}
