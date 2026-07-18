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
