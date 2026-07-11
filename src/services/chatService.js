import * as signalR from "@microsoft/signalr";

const signalrUrl = import.meta.env.VITE_SIGNALR_BASE_URL ?? "https://localhost:7148/hubs";
let connection = null;

export const startChatConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  const token = localStorage.getItem("accessToken");
  const guestSessionId = localStorage.getItem("mv_guest_session_id") || "";
  
  // URL'e guestSessionId ekleyelim (misafir sohbet desteği için)
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
        return t ? t : undefined; // Token yoksa undefined dön, misafir olarak bağlansın
      }
    })
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log("Real-time Chat SignalR Hub bağlantısı kuruldu. Misafir/Üye aktif.");
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

// SignalR üzerinden canlı mesaj gönderme
export const sendMessageLive = async (conversationId, message) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    await startChatConnection();
  }
  
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("SendMessage", conversationId, message);
    return true;
  }
  return false;
};

// SignalR üzerinden konuşmaya katılma
export const joinConversationLive = async (conversationId) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    await startChatConnection();
  }

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("JoinConversation", conversationId);
  }
};

// SignalR üzerinden konuşmadan ayrılma
export const leaveConversationLive = async (conversationId) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("LeaveConversation", conversationId);
  }
};

// SignalR üzerinden yazıyor bilgisi gönderme
export const sendTypingLive = async (conversationId) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("Typing", conversationId);
  }
};

// SignalR üzerinden admin destek paneline katılma
export const adminJoinSupportPanelLive = async () => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    await startChatConnection();
  }

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("AdminJoinSupportPanel");
  }
};
