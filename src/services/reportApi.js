import { request, apiBaseUrl } from "./apiClient";

export function getAdminDashboardSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  return request(`/admin/dashboard?${query.toString()}`);
}

export function getSalesReport(params = {}) {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  return request(`/admin/reports/sales?${query.toString()}`);
}

export function getOrdersReport(params = {}) {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  return request(`/admin/reports/orders?${query.toString()}`);
}

export function getProductsReport(params = {}) {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  return request(`/admin/reports/products?${query.toString()}`);
}

export async function downloadOrdersCsv(params = {}) {
  const query = new URLSearchParams();
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);
  
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${apiBaseUrl}/admin/reports/orders/export?${query.toString()}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("CSV indirilemedi.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siparis_raporu_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── Genişletilmiş Dashboard Metrikleri ────────────────────────────────
export function getCustomersReport() {
  return request("/admin/customers").catch(() => []);
}

export function getRecentOrders(count = 5) {
  const query = new URLSearchParams();
  query.append("page", "1");
  query.append("pageSize", String(count));
  return request(`/admin/orders?${query.toString()}`).catch(() => ({ items: [], totalCount: 0 }));
}

export function getReviewsReport() {
  return request("/admin/reviews/pending").catch(() => ({ items: [], totalCount: 0 }));
}

