import { request } from "./apiClient";
import { getGuestSessionId } from "../utils/guestSession";

// Müşteri Sohbet İstekleri
export function getMyConversations() {
  return request("/chat/conversations/my");
}

export function createConversation(payload) {
  const guestSessionId = getGuestSessionId();
  const clientMessageId = crypto.randomUUID ? crypto.randomUUID() : 'conv-' + Date.now();
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
  const clientMessageId = crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now();
  return request(`/chat/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: payload.content,
      guestSessionId: guestSessionId || null,
      clientMessageId
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
  const clientMessageId = crypto.randomUUID ? crypto.randomUUID() : 'msg-admin-' + Date.now();
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
    method: "POST"
  });
}
