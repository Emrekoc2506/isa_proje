import { request } from "./apiClient";
import { getGuestSessionId } from "../utils/guestSession";

// Müşteri Sohbet İstekleri
export function getMyConversations() {
  return request("/chat/conversations/my");
}

export function createConversation(payload) {
  const guestSessionId = getGuestSessionId();
  const clientMessageId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : 'conv-' + Date.now();
  return request("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({
      guestSessionId: guestSessionId || null,
      guestName: payload.guestName || null,
      guestEmail: payload.guestEmail || null,
      subject: payload.subject || "Destek Sohbeti",
      message: payload.message || null,
      clientMessageId
    })
  });
}

export function getConversationMessages(id) {
  return request(`/chat/conversations/${id}/messages`);
}

export function sendMessage(id, payload) {
  const guestSessionId = getGuestSessionId();
  const clientMessageId = payload.clientMessageId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now());
  return request(`/chat/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: payload.content,
      guestSessionId: guestSessionId || null,
      clientMessageId
    })
  });
}

export function deleteConversation(id) {
  return request(`/chat/conversations/${id}`, {
    method: "DELETE"
  });
}

export function deleteMessages(messageIds) {
  return request("/chat/messages", {
    method: "DELETE",
    body: JSON.stringify({
      messageIds,
      guestSessionId: getGuestSessionId() || null
    })
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
  const clientMessageId = payload.clientMessageId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : 'msg-admin-' + Date.now());
  return request(`/admin/chat/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: payload.content,
      clientMessageId
    })
  });
}

export function closeAdminConversation(id) {
  return request(`/admin/chat/conversations/${id}/close`, {
    method: "PUT"
  });
}

export function reopenAdminConversation(id) {
  return request(`/admin/chat/conversations/${id}/reopen`, {
    method: "PUT"
  });
}

export function deleteAdminConversation(id) {
  return request(`/admin/chat/conversations/${id}`, {
    method: "DELETE"
  });
}

export function deleteAdminMessages(messageIds) {
  return request("/admin/chat/messages", {
    method: "DELETE",
    body: JSON.stringify({
      messageIds
    })
  });
}

// Admin belirli bir kullanıcıyla yeni konuşma başlatır
export function initiateAdminConversation(userId, payload = {}) {
  return request(`/admin/chat/conversations/by-user/${userId}`, {
    method: "POST",
    body: JSON.stringify({
      subject: payload.subject || null,
      initialMessage: payload.initialMessage || null
    })
  });
}
