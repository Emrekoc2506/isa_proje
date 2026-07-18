import * as signalR from "@microsoft/signalr";
import { request } from "./apiClient";
import { getGuestSessionId } from "../utils/guestSession";

const signalrUrl = import.meta.env.VITE_SIGNALR_BASE_URL ?? "https://localhost:7148/hubs";
let connection = null;

export const startChatConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  const guestSessionId = getGuestSessionId();
  
  let url = `${signalrUrl}/chat`;
  const queryParams = [];
  
  if (guestSessionId) {
    queryParams.push(`guestSessionId=${encodeURIComponent(guestSessionId)}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => {
        const t = localStorage.getItem("accessToken");
        return t ? t : undefined;
      }
    })
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log("Real-time Chat SignalR Hub bağlantısı kuruldu.");
  } catch (err) {
    console.error("SignalR Hub bağlantı hatası:", err);
    connection = null;
  }

  return connection;
};

export const stopChatConnection = async () => {
  if (connection) {
    await connection.stop();
    console.log("SignalR Hub bağlantısı kapatıldı.");
    connection = null;
  }
};

export const getChatConnection = () => connection;

// REST based chat APIs
export function getMyConversations() {
  return request("/chat/conversations/my");
}

export function getConversationMessages(conversationId) {
  return request(`/chat/conversations/${conversationId}/messages`);
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
      subject: payload.subject || "Destek Talebi",
      message: payload.message,
      clientMessageId
    })
  });
}

export function sendMessage(conversationId, content) {
  const guestSessionId = getGuestSessionId();
  const clientMessageId = crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now();
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      guestSessionId: guestSessionId || null,
      clientMessageId
    })
  });
}

// Live triggers via SignalR (e.g. typing, joining, admin support)
export const joinConversationLive = async (conversationId) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    await startChatConnection();
  }

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("JoinConversation", conversationId);
  }
};

export const leaveConversationLive = async (conversationId) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("LeaveConversation", conversationId);
  }
};

export const sendTypingLive = async (conversationId) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("Typing", conversationId);
  }
};

export const adminJoinSupportPanelLive = async () => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    await startChatConnection();
  }

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("AdminJoinSupportPanel");
  }
};
