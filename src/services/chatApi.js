import { request } from "./apiClient";

// Müşteri Sohbet İstekleri
export function getMyConversations() {
  return request("/chat/conversations/my");
}

export function createConversation(payload) {
  // payload: { subject?, initialMessage? }
  return request("/chat/conversations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getConversationMessages(id) {
  return request(`/chat/conversations/${id}/messages`);
}

export function sendMessage(id, payload) {
  // payload: { content }
  return request(`/chat/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Admin Sohbet İstekleri
export function getAdminConversations() {
  return request("/admin/chat/conversations");
}

export function getAdminConversationMessages(id) {
  return request(`/admin/chat/conversations/${id}/messages`);
}

export function sendAdminMessage(id, payload) {
  // payload: { content }
  return request(`/admin/chat/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
