import { request } from "./apiClient";

export function getMyNotifications() {
  return request("/notifications/my");
}

export function markNotificationAsRead(id) {
  return request(`/notifications/${id}/read`, {
    method: "PUT"
  });
}

export function markAllNotificationsAsRead() {
  return request("/notifications/read-all", {
    method: "PUT"
  });
}

export function deleteNotification(id) {
  return request(`/notifications/${id}`, {
    method: "DELETE"
  });
}
