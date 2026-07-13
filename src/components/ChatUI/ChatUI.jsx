import styles from './ChatUI.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiCheckCircle, FiPlusCircle, FiXCircle } from 'react-icons/fi';
import { 
  startChatConnection, 
  stopChatConnection, 
  getChatConnection,
  joinConversationLive,
  leaveConversationLive,
  sendTypingLive,
  adminJoinSupportPanelLive
} from '../../services/chatService';
import { 
  getMyConversations, 
  createConversation, 
  getConversationMessages, 
  sendMessage,
  getAdminConversations,
  getAdminConversationMessages,
  sendAdminMessage,
  closeAdminConversation
} from '../../services/chatApi';

export default function ChatUI({ isAdmin = false }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const activeConvRef = useRef(null);
  activeConvRef.current = activeConvId;

  // Konuşmaları API'den Çekme
  const fetchConversations = useCallback(async () => {
    try {
      const data = isAdmin ? await getAdminConversations() : await getMyConversations();
      if (data) {
        const mapped = data.map(c => ({
          id: c.id,
          name: c.customerName || c.subject || 'Destek Sohbeti',
          initials: (c.customerName || c.subject || 'D')[0].toUpperCase(),
          time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          isOnline: true,
          isClosed: c.isClosed,
          lastMessage: c.lastMessage
        }));
        setConversations(mapped);
        
        // Eğer seçili konuşma yoksa ve konuşma varsa ilkini seçelim
        if (mapped.length > 0 && !activeConvId) {
          setActiveConvId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Konuşmalar yüklenemedi:", err);
    }
  }, [isAdmin, activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Seçili Konuşmanın Mesajlarını Çekme
  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      try {
        const data = isAdmin 
          ? await getAdminConversationMessages(activeConvId)
          : await getConversationMessages(activeConvId);
        
        if (data) {
          const mappedMsgs = data.map(m => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            sentAt: m.sentAt || m.createdAt || new Date().toISOString()
          }));
          setMessages(mappedMsgs);
        }
        
        // SignalR ile bu odaya katıl
        await joinConversationLive(activeConvId);
      } catch (err) {
        console.error("Mesajlar yüklenemedi:", err);
      }
    };

    fetchMessages();

    return () => {
      // Odadan ayrıl
      leaveConversationLive(activeConvId).catch(() => null);
    };
  }, [activeConvId, isAdmin]);

  // SignalR Bağlantı Yönetimi ve Event Listener
  useEffect(() => {
    let activeConnection = null;

    const initSignalR = async () => {
      const conn = await startChatConnection();
      if (conn) {
        setIsConnected(true);
        activeConnection = conn;

        if (isAdmin) {
          // Admin ise support grubuna katıl
          await adminJoinSupportPanelLive().catch(console.error);
        }

        // Yeni mesaj gelince
        const handleNewMessage = (conversationId, messageObj) => {
          setIsTyping(false);
          
          // Eğer gelen mesaj şu an açık olan konuşmaya ait ise ekrana ekle
          if (String(activeConvRef.current) === String(conversationId)) {
            const mappedMsg = {
              id: messageObj.id || Date.now().toString(),
              senderId: messageObj.senderId,
              content: messageObj.content || messageObj.Message || messageObj,
              sentAt: messageObj.sentAt || messageObj.createdAt || new Date().toISOString()
            };

            setMessages(prev => {
              if (prev.some(m => m.id === mappedMsg.id)) return prev;
              return [...prev, mappedMsg];
            });
          } else {
            // Başka bir konuşmaya geldiyse listeyi yenileyelim
            fetchConversations();
          }
        };

        conn.on("NewMessage", handleNewMessage);
        conn.on("NotifyNewMessage", handleNewMessage);

        conn.on("Typing", (conversationId) => {
          if (String(activeConvRef.current) === String(conversationId)) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000); // 3 sn sonra otomatik gizle
          }
        });
      }
    };

    initSignalR();

    return () => {
      if (activeConnection) {
        activeConnection.off("NewMessage");
        activeConnection.off("NotifyNewMessage");
        activeConnection.off("Typing");
      }
    };
  }, [isAdmin, fetchConversations]);

  // Otomatik scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    const msgContent = newMessage.trim();
    setNewMessage('');

    try {
      // Sadece REST API ile kaydedilir (SignalR'da SendMessage invoke edilmez)
      let response = null;
      if (isAdmin) {
        response = await sendAdminMessage(activeConvId, { content: msgContent });
      } else {
        response = await sendMessage(activeConvId, { content: msgContent });
      }

      // Kendi mesajımızı ekrana ekleyelim (eğer anında SignalR'dan dönmezse)
      const myMessage = {
        id: response?.id || Date.now().toString(),
        senderId: response?.senderId || 'me',
        content: msgContent,
        sentAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, myMessage]);
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
      alert("Mesaj gönderilemedi.");
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      let payload = { subject: "Destek Talebi" };

      if (!token) {
        const guestName = prompt("Lütfen adınızı girin:") || "Misafir Müşteri";
        const guestEmail = prompt("Lütfen e-postanızı girin:") || "guest@example.com";

        payload = {
          subject: `${guestName} - Destek Talebi`,
          guestName,
          guestEmail
        };
      }

      const res = await createConversation(payload);
      if (res && res.id) {
        alert("Destek konuşması başlatıldı.");
        setActiveConvId(res.id);
        fetchConversations();
      }
    } catch (err) {
      alert("Yeni sohbet başlatılamadı: " + err.message);
    }
  };

  // Yazarken sunucuya bildir
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (activeConvId) {
      sendTypingLive(activeConvId).catch(() => null);
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className={styles.chatContainer}>
      
      {/* SOL BAR */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Mesajlarım</h3>
            {!isAdmin && (
              <button 
                onClick={handleCreateNewConversation} 
                className={styles.iconBtn}
                title="Yeni Destek Talebi Başlat"
                style={{ color: 'var(--gold-light)' }}
              >
                <FiPlusCircle size={20} />
              </button>
            )}
          </div>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input type="text" placeholder="Sohbet ara..." className={styles.searchInput} />
          </div>
        </div>

        <div className={styles.convList}>
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`${styles.convItem} ${activeConvId === conv.id ? styles.convItemActive : ''}`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <div className={styles.convAvatar}>
                <span>{conv.initials}</span>
                {conv.isClosed && <div className={styles.onlineDot} style={{ background: '#e05594' }} title="Kapalı" />}
              </div>
              <div className={styles.convInfo}>
                <div className={styles.convTop}>
                  <span className={styles.convName}>{conv.name}</span>
                  <span className={styles.convTime}>{conv.time}</span>
                </div>
                <p className={styles.convLastMsg}>
                  {conv.lastMessage || 'Sohbet geçmişi...'}
                </p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className={styles.emptyState}>Sohbet bulunamadı.</p>
          )}
        </div>
      </div>

      {/* MESAJ ALANI */}
      <div className={styles.chatArea}>
        {activeConvId ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.headerAvatar}>{activeConv?.initials || 'D'}</div>
                <div className={styles.headerInfo}>
                  <h4>{activeConv?.name || 'Destek Talebi'}</h4>
                  <span className={styles.statusText}>
                    {activeConv?.isClosed ? (
                      <span style={{ color: '#e05594', fontWeight: 600 }}>SOHBET KAPATILDI</span>
                    ) : isConnected ? (
                      'Canlı Bağlantı Aktif'
                    ) : (
                      'Sunucuya bağlanıyor...'
                    )}
                  </span>
                </div>
              </div>
              {isAdmin && !activeConv?.isClosed && (
                <button
                  onClick={async () => {
                    if (confirm("Bu sohbeti kapatmak istediğinize emin misiniz?")) {
                      await closeAdminConversation(activeConvId);
                      fetchConversations();
                    }
                  }}
                  style={{
                    background: 'rgba(224, 85, 148, 0.1)',
                    border: '1px solid rgba(224, 85, 148, 0.3)',
                    color: '#e05594',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Sohbeti Kapat
                </button>
              )}
            </div>

            <div className={styles.messagesList}>
              <div className={styles.dateDivider}>
                <span>Mesajlar</span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isMe = msg.senderId === 'me' || (isAdmin && msg.senderId !== 'user-1' && msg.senderId !== 'customer') || msg.senderId === user?.id;
                  
                  return (
                    <div key={msg.id} className={styles.messageRow}>
                      <motion.div 
                        className={`${styles.messageWrapper} ${isMe ? styles.messageMine : styles.messageOther}`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {!isMe && <div className={styles.msgAvatar}>{activeConv?.initials || 'D'}</div>}
                        
                        <div className={styles.messageBubble}>
                          <p className={styles.messageContent}>{msg.content}</p>
                          <div className={styles.messageMeta}>
                            <span>{formatTime(msg.sentAt)}</span>
                            {isMe && <FiCheckCircle className={styles.readIcon} />}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {isTyping && (
                  <motion.div 
                    className={`${styles.messageWrapper} ${styles.messageOther}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <div className={styles.msgAvatar}>{activeConv?.initials || 'D'}</div>
                    <div className={`${styles.messageBubble} ${styles.typingBubble}`}>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Girdi Alanı */}
            {activeConv?.isClosed ? (
              <div style={{ padding: '16px', background: 'rgba(224, 85, 148, 0.05)', border: '1px solid rgba(224, 85, 148, 0.2)', borderRadius: '8px', color: '#e05594', fontSize: '13px', textAlign: 'center', margin: 16 }}>
                Bu sohbet sonlandırılmıştır. Yeni bir destek talebi oluşturabilirsiniz.
              </div>
            ) : (
              <form className={styles.inputArea} onSubmit={handleSend}>
                <input 
                  type="text" 
                  placeholder="Mesajınızı yazın..." 
                  className={styles.messageInput}
                  value={newMessage}
                  onChange={handleInputChange}
                />
                <button 
                  type="submit" 
                  className={styles.sendBtn}
                  disabled={!newMessage.trim()}
                >
                  <FiSend />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <p>Başlamak için sol menüden bir sohbet seçin veya yeni bir sohbet başlatın.</p>
            {!isAdmin && (
              <button 
                onClick={handleCreateNewConversation} 
                className={styles.buyBtn}
                style={{ marginTop: '16px' }}
              >
                Yeni Sohbet Başlat
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
