import styles from './ChatUI.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiMoreVertical, FiCheckCircle, FiTrash2, FiCheck, FiX, FiPlusCircle } from 'react-icons/fi';
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
  sendAdminMessage
} from '../../services/chatApi';

export default function ChatUI({ isAdmin = false }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
          time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          isOnline: true
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
            sentAt: m.createdAt || new Date().toISOString()
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
            // Mesaj nesnesini haritalayalım
            const mappedMsg = typeof messageObj === 'string' ? {
              id: Date.now().toString(),
              senderId: 'other',
              content: messageObj,
              sentAt: new Date().toISOString()
            } : {
              id: messageObj.id || Date.now().toString(),
              senderId: messageObj.senderId,
              content: messageObj.content || messageObj.Message || messageObj,
              sentAt: messageObj.createdAt || new Date().toISOString()
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
      // Önce API üzerinden veritabanına kaydet
      let response = null;
      if (isAdmin) {
        response = await sendAdminMessage(activeConvId, { content: msgContent });
      } else {
        const guestSessionId = localStorage.getItem("mv_guest_session_id") || undefined;
        response = await sendMessage(activeConvId, { content: msgContent, guestSessionId });
      }

      // Kendi mesajımızı ekrana ekleyelim (eğer anında SignalR'dan dönmezse)
      const myMessage = {
        id: response?.id || Date.now().toString(),
        senderId: response?.senderId || 'me',
        content: msgContent,
        sentAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, myMessage]);

      // SignalR üzerinden karşı tarafa yazıyor durumunu tetiklemek/bilgilendirmek için tetikle
      const signalrConn = getChatConnection();
      if (signalrConn) {
        await signalrConn.invoke("SendMessage", activeConvId, msgContent).catch(() => null);
      }
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
        // Misafir ise
        let guestSessionId = localStorage.getItem("mv_guest_session_id");
        if (!guestSessionId) {
          guestSessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem("mv_guest_session_id", guestSessionId);
        }
        
        const guestName = prompt("Lütfen adınızı girin:") || "Misafir Müşteri";
        const guestEmail = prompt("Lütfen e-postanızı girin:") || "guest@example.com";

        payload = {
          subject: `${guestName} - Destek Talebi`,
          guestSessionId,
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
                {conv.isOnline && <div className={styles.onlineDot} />}
              </div>
              <div className={styles.convInfo}>
                <div className={styles.convTop}>
                  <span className={styles.convName}>{conv.name}</span>
                  <span className={styles.convTime}>{conv.time}</span>
                </div>
                <p className={styles.convLastMsg}>
                  {activeConvId === conv.id && messages.length > 0 
                    ? messages[messages.length - 1].content 
                    : 'Sohbet geçmişi...'}
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
                    {isConnected ? 'Real-time Canlı Bağlantı Aktif' : 'Sunucuya bağlanıyor...'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.messagesList}>
              <div className={styles.dateDivider}>
                <span>Mesajlar</span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  // Müşteri ekranında eğer admin gönderdiyse support'tur
                  // Admin ekranında ise me admin'dir
                  // senderId'si Guid olanlar müşteri ya da admin olabilir. me/other veya backend eşleşmesi:
                  const token = localStorage.getItem("accessToken");
                  // Çok basit bir mantıkla senderId'sine göre ayırt edelim:
                  // Eğer mesajı gönderen admin ise ve biz admindiysek isMe true olur
                  const isMe = msg.senderId === 'me' || (isAdmin && msg.senderId !== 'user-1' && msg.senderId !== 'customer');
                  
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
