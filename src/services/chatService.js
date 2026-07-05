import * as signalR from "@microsoft/signalr";

/*
  CROSS-TAB REAL-TIME CHAT SIMULATOR (SIGNALR MOCK)
  ================================================
  Müşteri ve Admin sekmeleri arasında gerçek zamanlı (real-time) iletişimi simüle etmek için
  localStorage tabanlı bir StorageEvent dinleyicisi kullanıyoruz.
*/

let mockConnection = null;
const eventHandlers = {};

// localStorage'daki mesajları getir veya boş liste dön
const getStoredMessages = () => {
  const saved = localStorage.getItem('mv_chat_messages');
  return saved ? JSON.parse(saved) : [
    { id: '1', senderId: 'support-1', receiverId: 'user-1', content: 'Merhaba! Size nasıl yardımcı olabiliriz?', sentAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', senderId: 'user-1', receiverId: 'support-1', content: 'Siparişimin durumu hakkında bilgi almak istiyorum.', sentAt: new Date(Date.now() - 3500000).toISOString() }
  ];
};

// Yeni mesajı localStorage'a yaz
const saveMessage = (msg) => {
  const current = getStoredMessages();
  current.push(msg);
  localStorage.setItem('mv_chat_messages', JSON.stringify(current));
  // Kendi sekmemizde de tetiklenmesi için özel bir event atalım
  window.dispatchEvent(new CustomEvent('mv_message_received', { detail: msg }));
};

export const startChatConnection = async () => {
  if (mockConnection) return mockConnection;

  console.log("Mock SignalR Hub Bağlanıyor...");

  // Sekmeler arası canlı mesaj senkronizasyonu
  const handleStorageChange = (e) => {
    if (e.key === 'mv_chat_messages' && e.newValue) {
      const messages = JSON.parse(e.newValue);
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && eventHandlers["ReceiveMessage"]) {
        eventHandlers["ReceiveMessage"].forEach(cb => cb(lastMsg));
      }
    }
  };

  const handleCustomEvent = (e) => {
    if (e.detail && eventHandlers["ReceiveMessage"]) {
      eventHandlers["ReceiveMessage"].forEach(cb => cb(e.detail));
    }
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('mv_message_received', handleCustomEvent);
  
  mockConnection = {
    state: signalR.HubConnectionState.Connected,
    on: (eventName, callback) => {
      if (!eventHandlers[eventName]) eventHandlers[eventName] = [];
      eventHandlers[eventName].push(callback);
    },
    off: (eventName, callback) => {
      if (!eventHandlers[eventName]) return;
      eventHandlers[eventName] = eventHandlers[eventName].filter(cb => cb !== callback);
    },
    invoke: async (methodName, payload) => {
      console.log(`Mock SignalR invoke [${methodName}]:`, payload);
      
      if (methodName === "SendMessage") {
        const isMeAdmin = payload.senderId === 'support-1';
        
        const newMsg = {
          id: Date.now().toString(),
          senderId: isMeAdmin ? 'support-1' : 'user-1',
          receiverId: isMeAdmin ? 'user-1' : 'support-1',
          content: payload.content,
          sentAt: new Date().toISOString()
        };
        
        saveMessage(newMsg);
      }
      return true;
    },
    stop: async () => {
      console.log("Mock SignalR Bağlantısı Kesiliyor...");
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mv_message_received', handleCustomEvent);
      mockConnection = null;
    }
  };

  return mockConnection;
};

export const sendMessageLive = async (senderId, receiverId, content) => {
  if (!mockConnection) await startChatConnection();
  
  const payload = { senderId, receiverId, content };
  await mockConnection.invoke("SendMessage", payload);
  return true;
};

export const stopChatConnection = async () => {
  if (mockConnection) {
    await mockConnection.stop();
  }
};

export const getChatConnection = () => mockConnection;
export { getStoredMessages };
