export const DISMISSED_ORDERS_KEY = 'isa_admin_dismissed_orders';

/**
 * Checks if an order is protected (paid, in verification, preparing, shipped, delivered).
 * Protected orders must NOT be deleted from the backend database (for accounting & legal records),
 * but will be removed from the admin UI view.
 */
export const isProtectedOrder = (order) => {
  if (!order) return false;
  const payStatus = String(order.paymentStatus || '').toLowerCase().trim();
  const ordStatus = String(order.status || order.orderStatus || '').toLowerCase().trim();

  // Korunan ödeme durumları (Veri tabanında kalmalı, soft delete çağrılmamalı)
  const protectedPayment = [
    'paid', 'ödendi',
    'pendingverification', 'kontrol bekliyor'
  ];

  // Korunan sipariş durumları
  const protectedOrderStatuses = [
    'confirmed', 'onaylandı',
    'preparing', 'hazırlanıyor',
    'shipped', 'kargoya verildi',
    'delivered', 'teslim edildi'
  ];

  return protectedPayment.includes(payStatus) || protectedOrderStatuses.includes(ordStatus);
};
