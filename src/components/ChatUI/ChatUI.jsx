import styles from './ChatUI.module.css';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiMoreVertical, FiCheckCircle, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { startChatConnection, sendMessageLive, getChatConnection, getStoredMessages } from '../../services/chatService';
import { demoUser } from '../../data/dashboard';

// Sahte başlangıç mesajları
const MOCK_MESSAGES = [
  { id: '1', senderId: 'support-1', receiverId: 'user-1', content: 'Merhaba! Size nasıl yardımcı olabiliriz?', sentAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', senderId: 'user-1', receiverId: 'support-1', content: 'Siparişimin durumu hakkında bilgi almak istiyorum.', sentAt: new Date(Date.now() - 3500000).toISOString() }
];

export default function ChatUI({ isAdmin = false }) {
  const [conversations, setConversations] = useState(() => {
    return isAdmin 
      ? [{ id: 'user-1', name: 'ogrenci@gmail.com (Öğrenci)', initials: 'Ö', time: '12:30', isOnline: true }]
      : [{ id: 'support-1', name: 'Müşteri Hizmetleri', initials: 'MH', time: '12:30', isOnline: true }];
  });
  const [activeConvId, setActiveConvId] = useState(isAdmin ? 'user-1' : 'support-1');
  const [messages, setMessages] = useState(() => getStoredMessages());
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);

  // Otomatik scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // SignalR (Mock) Bağlantısı
  useEffect(() => {
    const initChat = async () => {
      const conn = await startChatConnection();
      if (conn) {
        setIsConnected(true);
        // Yeni mesaj gelince
        conn.on("ReceiveMessage", (msg) => {
          setIsTyping(false);
          // Gelen mesaj zaten state'e eklenmediyse ekle
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      }
    };
    initChat();

    return () => {
      const conn = getChatConnection();
      if (conn) {
        // cleanup for real signalr if needed
      }
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgContent = newMessage.trim();
    setNewMessage('');

    const senderId = isAdmin ? 'support-1' : 'user-1';
    const receiverId = isAdmin ? 'user-1' : 'support-1';

    // Sunucuya (Mock Hub) gönder -> Hub bunu saveMessage ile localStorage'a kaydedecek ve tetikleyecek
    await sendMessageLive(senderId, receiverId, msgContent);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSelection = (id) => {
    setSelectedMsgs(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    if (selectedMsgs.length === 0) return;
    if (window.confirm(`${selectedMsgs.length} mesajı silmek istediğinize emin misiniz?`)) {
      setMessages(prev => prev.filter(m => !selectedMsgs.includes(m.id)));
      setSelectionMode(false);
      setSelectedMsgs([]);
      setShowMenu(false);
    }
  };

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Bu sohbeti tamamen silmek istediğinize emin misiniz?')) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    }
  };

  return (
    <div className={styles.chatContainer}>
      
      {/* ── SOL TARAF: SOHBET LİSTESİ ──────────────────────────── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Mesajlarım</h3>
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
              <button 
                className={styles.convDeleteBtn} 
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                aria-label="Sohbeti Sil"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className={styles.emptyState}>Sohbet bulunamadı.</p>
          )}
        </div>
      </div>

      {/* ── SAĞ TARAF: MESAJLAŞMA ALANI ────────────────────────── */}
      <div className={styles.chatArea}>
        {activeConvId ? (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.headerAvatar}>{isAdmin ? 'Ö' : 'MH'}</div>
                <div className={styles.headerInfo}>
                  <h4>{isAdmin ? 'ogrenci@gmail.com' : 'Müşteri Hizmetleri'}</h4>
                  <span className={styles.statusText}>
                    {isConnected ? (isAdmin ? 'Çevrimiçi (Öğrenci)' : 'Çevrimiçi (Destek Ekibi)') : 'Bağlanıyor...'}
                  </span>
                </div>
              </div>
              
              <div className={styles.headerActions}>
                {selectionMode ? (
                  <>
                    <button 
                      className={styles.cancelBtn} 
                      onClick={() => { setSelectionMode(false); setSelectedMsgs([]); }}
                    >
                      <FiX /> İptal
                    </button>
                    {selectedMsgs.length > 0 && (
                      <button className={styles.deleteBtn} onClick={handleDelete}>
                        <FiTrash2 /> Sil ({selectedMsgs.length})
                      </button>
                    )}
                  </>
                ) : (
                  <div className={styles.menuWrapper}>
                    <button 
                      className={styles.iconBtn} 
                      onClick={() => setShowMenu(!showMenu)}
                      onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                    >
                      <FiMoreVertical />
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div 
                          className={styles.dropdownMenu}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <button 
                            className={styles.dropdownItem} 
                            onClick={() => { setSelectionMode(true); setShowMenu(false); }}
                          >
                            <FiCheckCircle /> Mesaj Seç
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Mesaj Listesi */}
            <div className={styles.messagesList}>
              <div className={styles.dateDivider}>
                <span>Bugün</span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const mySenderId = isAdmin ? 'support-1' : 'user-1';
                  const isMe = msg.senderId === mySenderId;
                  const isSelected = selectedMsgs.includes(msg.id);

                  return (
                    <div key={msg.id} className={styles.messageRow}>
                      {selectionMode && (
                        <button 
                          className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}
                          onClick={() => toggleSelection(msg.id)}
                        >
                          {isSelected && <FiCheck />}
                        </button>
                      )}
                      
                      <motion.div 
                        className={`${styles.messageWrapper} ${isMe ? styles.messageMine : styles.messageOther} ${selectionMode ? styles.messageSelectable : ''}`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => selectionMode && toggleSelection(msg.id)}
                      >
                        {!isMe && <div className={styles.msgAvatar}>{isAdmin ? 'Ö' : 'MH'}</div>}
                        
                        <div className={`${styles.messageBubble} ${isSelected ? styles.messageBubbleSelected : ''}`}>
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
                    <div className={styles.msgAvatar}>{isAdmin ? 'Ö' : 'MH'}</div>
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
                onChange={(e) => setNewMessage(e.target.value)}
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
            <p>Başlamak için sol menüden bir sohbet seçin.</p>
          </div>
        )}
      </div>

    </div>
  );
}
