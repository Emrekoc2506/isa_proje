import styles from './ChatUI.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiCheckCircle, FiPlusCircle, FiTrash2, FiX, FiMessageCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
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
  closeAdminConversation,
  initiateAdminConversation
} from '../../services/chatApi';

export default function ChatUI({ isAdmin = false, initialUserId = null, initialUserName = null }) {
  const [conversations, setConversations]   = useState([]);
  const [selectedConv, setSelectedConv]     = useState(null); // { id, name, initials, isClosed }
  const [messages, setMessages]             = useState([]);
  const [newMessage, setNewMessage]         = useState('');
  const [isConnected, setIsConnected]       = useState(false);
  const [isTyping, setIsTyping]             = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectionMode, setSelectionMode]   = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState([]);
  const [loading, setLoading]               = useState(true);

  const messagesEndRef = useRef(null);
  const chatInputRef   = useRef(null);
  const { user }       = useAuth();
  const selectedConvRef = useRef(null);
  selectedConvRef.current = selectedConv;

  // ── URL yardımcıları ──────────────────────────────────────────────
  const renderMessageContent = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!urlRegex.test(content)) return content;
    urlRegex.lastIndex = 0;
    return content.split(urlRegex).map((part, i) => {
      if (/^https?:\/\//.test(part)) {
        const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(part);
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--gold-light)', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {isImage ? '🖼️ Görsel' : '🔗 Bağlantı'}
          </a>
        );
      }
      return part;
    });
  };

  // ── Konuşmaları çek ───────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const data = isAdmin ? await getAdminConversations() : await getMyConversations();
      if (!data) return [];
      const mapped = data.map(c => ({
        id:       c.id,
        name:     c.customerName || c.subject || 'Destek Sohbeti',
        initials: (c.customerName || c.subject || 'D')[0].toUpperCase(),
        time:     c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        isClosed: c.isClosed,
        lastMessage: c.lastMessage || '',
        unreadCount: c.unreadCount || 0,
      }));
      setConversations(mapped);
      return mapped;
    } catch (err) {
      console.error('Konuşmalar yüklenemedi:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // ── İlk yükleme: konuşmaları getir ama seçim YAPMA ──────────────
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── initialUserId/Name değişince (müşteri ekranından geliniyorsa) ──
  useEffect(() => {
    if (!initialUserId && !initialUserName) return;
    setSelectedConv(null);
    setMessages([]);
    setSearchQuery(initialUserName || '');
    fetchConversations().then(mapped => {
      const match = initialUserName
        ? mapped.find(c => c.name.toLowerCase().includes(initialUserName.toLowerCase()))
        : null;
      if (match) setSelectedConv(match);
      // Eşleşme yoksa seçim yok — kullanıcı "Başlat" butonunu kullanır
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, initialUserName]);

  // ── Seçili konuşma değişince mesajları getir ─────────────────────
  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    const fetchMessages = async () => {
      try {
        const data = isAdmin
          ? await getAdminConversationMessages(selectedConv.id)
          : await getConversationMessages(selectedConv.id);
        if (data) {
          setMessages(data.map(m => ({
            id:      m.id,
            senderId: m.senderId,
            content: m.content,
            sentAt:  m.sentAt || m.createdAt || new Date().toISOString()
          })));
        }
        await joinConversationLive(selectedConv.id);
      } catch (err) {
        console.error('Mesajlar yüklenemedi:', err);
      }
    };
    fetchMessages();
    return () => { leaveConversationLive(selectedConv.id).catch(() => null); };
  }, [selectedConv, isAdmin]);

  // ── Input odaklan ─────────────────────────────────────────────────
  useEffect(() => {
    if (selectedConv && chatInputRef.current) chatInputRef.current.focus();
  }, [selectedConv]);

  // ── SignalR ───────────────────────────────────────────────────────
  useEffect(() => {
    let conn = null;
    const init = async () => {
      conn = await startChatConnection();
      if (!conn) return;
      setIsConnected(true);
      if (isAdmin) await adminJoinSupportPanelLive().catch(console.error);

      const handleNew = (conversationId, msgObj) => {
        setIsTyping(false);
        const mapped = {
          id:      msgObj.id || Date.now().toString(),
          senderId: msgObj.senderId,
          content: msgObj.content || msgObj.Message || msgObj,
          sentAt:  msgObj.sentAt || new Date().toISOString()
        };
        if (String(selectedConvRef.current?.id) === String(conversationId)) {
          setMessages(prev => prev.some(m => m.id === mapped.id) ? prev : [...prev, mapped]);
        } else {
          fetchConversations();
        }
      };

      conn.on('NewMessage', handleNew);
      conn.on('NotifyNewMessage', handleNew);
      conn.on('Typing', (cid) => {
        if (String(selectedConvRef.current?.id) === String(cid)) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });
    };
    init();
    return () => {
      if (conn) { conn.off('NewMessage'); conn.off('NotifyNewMessage'); conn.off('Typing'); }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // ── Otomatik scroll ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Mesaj gönder ──────────────────────────────────────────────────
  // ── Mesaj gönder (Optimistic Update) ─────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;
    const content = newMessage.trim();
    setNewMessage('');

    // Mesajı hemen ekrana ekle (optimistic)
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id:       tempId,
      senderId: isAdmin ? 'admin-me' : (user?.userId || user?.id || 'me'),
      content,
      sentAt:   new Date().toISOString(),
      pending:  false // Kullanıcı isteği: Hata alsa bile normal gözüksün
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = isAdmin
        ? await sendAdminMessage(selectedConv.id, { content })
        : await sendMessage(selectedConv.id, { content });

      // Başarılı olursa gerçek ID'yi ata
      if (res && res.id) {
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: res.id, senderId: res.senderId || m.senderId } : m
        ));
      }
    } catch (err) {
      console.warn('Mesaj API üzerinden iletilemedi (UI üzerinde gösterilmeye devam ediyor):', err);
      // Hata durumunda mesajı silmiyoruz, kullanıcı isteği üzerine ekranda kalıyor.
    }
  };


  // ── Yeni konuşma (müşteri) ────────────────────────────────────────
  const handleCreateNewConversation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      let payload = { subject: 'Destek Talebi' };
      if (!token) {
        const guestName  = prompt('Adınızı girin:') || 'Misafir';
        const guestEmail = prompt('E-postanızı girin:') || 'guest@example.com';
        payload = { subject: `${guestName} - Destek Talebi`, guestName, guestEmail };
      }
      const res = await createConversation(payload);
      if (res?.id) {
        const updated = await fetchConversations();
        const found = updated.find(c => c.id === res.id);
        setSelectedConv(found || null);
      }
    } catch (err) {
      alert('Yeni sohbet başlatılamadı: ' + err.message);
    }
  };

  // ── Admin: müşteriyle konuşma başlat ─────────────────────────────
  const handleStartConversationWithUser = async () => {
    if (!initialUserId) { alert('Kullanıcı kimliği bulunamadı.'); return; }
    try {
      const res = await initiateAdminConversation(initialUserId, {
        subject: `${initialUserName || 'Müşteri'} - Destek Talebi`
      });
      if (res?.id) {
        const updated = await fetchConversations();
        const found = updated.find(c => c.id === res.id);
        setSelectedConv(found || null);
      } else {
        alert('Konuşma oluşturulamadı.');
      }
    } catch (err) {
      alert('Konuşma başlatılamadı: ' + err.message);
    }
  };

  // ── Sohbeti kapat/sil (Admin: close; Müşteri: listeden kaldır) ───
  const handleDeleteConversation = async (e, conv) => {
    e.stopPropagation();
    if (!window.confirm(`"${conv.name}" ile olan konuşmayı kaldırmak istediğinize emin misiniz?`)) return;
    if (isAdmin) {
      try {
        await closeAdminConversation(conv.id);
      } catch (_) { /* zaten kapalı olabilir */ }
    }
    setConversations(prev => prev.filter(c => c.id !== conv.id));
    if (selectedConv?.id === conv.id) { setSelectedConv(null); setMessages([]); }
  };

  // ── Seçili mesajları sil (sadece frontend — backend yok) ──────────
  const handleDeleteSelectedMessages = () => {
    if (!window.confirm(`${selectedMsgIds.length} mesajı silmek istiyor musunuz?\n(Bu işlem yalnızca ekranınızdan kaldırır)`)) return;
    setMessages(prev => prev.filter(m => !selectedMsgIds.includes(m.id)));
    setSelectionMode(false);
    setSelectedMsgIds([]);
  };

  const toggleSelectMsg = (id) => {
    setSelectedMsgIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConvs = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
  });

  const isMe = (msg) => {
    // Admin için: 'admin-me' prefix'li temp ID'ler veya user ID eşleşmesi
    if (msg.senderId === 'admin-me') return true;
    if (msg.senderId === 'me')       return true;
    if (user?.userId && msg.senderId === user.userId) return true;
    if (user?.id     && msg.senderId === user.id)     return true;
    return false;
  };


  return (
    <div className={styles.chatContainer}>

      {/* ── Sol Panel ──────────────────────────────────────────── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>
              {isAdmin ? 'Destek Mesajları' : 'Mesajlarım'}
            </h3>
            {!isAdmin && (
              <button onClick={handleCreateNewConversation} className={styles.iconBtn}
                title="Yeni Destek Talebi" style={{ color: 'var(--gold-light)' }}>
                <FiPlusCircle size={20} />
              </button>
            )}
          </div>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input type="text" placeholder="Sohbet ara..."
              className={styles.searchInput}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className={styles.convList}>
          {loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px', textAlign: 'center' }}>
              Yükleniyor...
            </p>
          )}
          {!loading && filteredConvs.length === 0 && (
            <p className={styles.emptyState}>
              {searchQuery ? 'Eşleşen sohbet bulunamadı.' : 'Henüz sohbet yok.'}
            </p>
          )}
          {filteredConvs.map(conv => {
            const isTarget = initialUserName && conv.name.toLowerCase().includes(initialUserName.toLowerCase());
            const isActive = selectedConv?.id === conv.id;
            return (
              <div
                key={conv.id}
                className={`${styles.convItem} ${isActive ? styles.convItemActive : ''} group-conv`}
                onClick={() => { setSelectedConv(conv); setSelectionMode(false); setSelectedMsgIds([]); }}
                style={{
                  borderLeft: isTarget ? '3px solid var(--gold)' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                {/* Avatar */}
                <div className={styles.convAvatar}
                  style={{ background: conv.isClosed ? 'rgba(224,85,148,0.2)' : undefined }}>
                  <span>{conv.initials}</span>
                  {conv.isClosed && (
                    <div className={styles.onlineDot} style={{ background: '#e05594' }} title="Kapalı" />
                  )}
                </div>

                {/* Info */}
                <div className={styles.convInfo}>
                  <div className={styles.convTop}>
                    <span className={styles.convName}>{conv.name}</span>
                    <span className={styles.convTime}>{conv.time}</span>
                  </div>
                  <p className={styles.convLastMsg}>
                    {conv.lastMessage || 'Sohbet geçmişi...'}
                  </p>
                </div>

                {/* Okunmamış badge */}
                {conv.unreadCount > 0 && (
                  <span style={{
                    background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 900,
                    minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>{conv.unreadCount}</span>
                )}

                {/* Sil / Kapat butonu — hover'da görünür */}
                <button
                  className={styles.convDeleteBtn}
                  onClick={(e) => handleDeleteConversation(e, conv)}
                  title="Konuşmayı kaldır"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sağ Panel ──────────────────────────────────────────── */}
      <div className={styles.chatArea}>

        {/* Konuşma seçilmedi */}
        {!selectedConv && !initialUserName && (
          <div className={styles.noChatSelected}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 16
            }}>
              <FiMessageCircle color="var(--gold)" />
            </div>
            <h4 style={{ color: 'var(--gold-light)', marginBottom: 8 }}>
              {isAdmin ? 'Bir Sohbet Seçin' : 'Mesajlarım'}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 280, textAlign: 'center' }}>
              {isAdmin
                ? 'Sol panelden bir konuşmayı seçerek yanıtlamaya başlayın.'
                : 'Sol panelden bir konuşma seçin veya yeni destek talebi başlatın.'}
            </p>
            {!isAdmin && (
              <button onClick={handleCreateNewConversation} className={styles.buyBtn}
                style={{ marginTop: 20 }}>
                Yeni Sohbet Başlat
              </button>
            )}
          </div>
        )}

        {/* Admin: müşteri seçilmiş ama konuşma yok */}
        {!selectedConv && initialUserName && (
          <div className={styles.noChatSelected}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))',
              border: '2px solid rgba(201,162,39,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 16
            }}>💬</div>
            <h4 style={{ color: 'var(--gold-light)', marginBottom: 8 }}>
              {initialUserName} ile Konuşma Yok
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, textAlign: 'center', maxWidth: 300 }}>
              Bu müşteri henüz destek talebi başlatmamış.<br />
              Siz ilk mesajı başlatabilirsiniz.
            </p>
            {initialUserId && (
              <button onClick={handleStartConversationWithUser}
                style={{
                  background: 'linear-gradient(135deg, rgba(201,162,39,0.25), rgba(201,162,39,0.12))',
                  border: '1px solid rgba(201,162,39,0.5)', borderRadius: 10,
                  padding: '10px 24px', cursor: 'pointer', color: 'var(--gold-light)',
                  fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8
                }}>
                💬 {initialUserName} ile Konuşma Başlat
              </button>
            )}
          </div>
        )}

        {/* Konuşma seçildi */}
        {selectedConv && (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.headerAvatar}
                  style={{ fontSize: 14, background: selectedConv.isClosed ? 'rgba(224,85,148,0.2)' : undefined }}>
                  {selectedConv.initials}
                </div>
                <div className={styles.headerInfo}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {selectedConv.name}
                  </h4>
                  <span className={styles.statusText}>
                    {selectedConv.isClosed
                      ? <span style={{ color: '#e05594', fontWeight: 600 }}>SOHBET KAPATILDI</span>
                      : isConnected ? '🟢 Canlı Bağlantı Aktif' : '⚪ Bağlanıyor...'}
                  </span>
                </div>
              </div>

              {/* Header Sağ Aksiyonlar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectionMode ? (
                  <>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {selectedMsgIds.length} seçildi
                    </span>
                    {selectedMsgIds.length > 0 && (
                      <button onClick={handleDeleteSelectedMessages} style={{
                        background: 'rgba(224,85,148,0.15)', border: '1px solid rgba(224,85,148,0.35)',
                        color: '#e05594', borderRadius: 6, padding: '4px 12px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <FiTrash2 size={12} /> Sil ({selectedMsgIds.length})
                      </button>
                    )}
                    <button onClick={() => { setSelectionMode(false); setSelectedMsgIds([]); }} style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 12px',
                      fontSize: 12, cursor: 'pointer'
                    }}>
                      İptal
                    </button>
                  </>
                ) : (
                  <button onClick={() => setSelectionMode(true)} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px',
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }} title="Mesaj Seç">
                    <FiCheck size={12} /> Mesaj Seç
                  </button>
                )}

                {isAdmin && !selectedConv.isClosed && (
                  <button onClick={async () => {
                    if (window.confirm('Bu sohbeti kapatmak istiyor musunuz?')) {
                      await closeAdminConversation(selectedConv.id);
                      setSelectedConv(prev => ({ ...prev, isClosed: true }));
                      fetchConversations();
                    }
                  }} style={{
                    background: 'rgba(224,85,148,0.1)', border: '1px solid rgba(224,85,148,0.3)',
                    color: '#e05594', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer'
                  }}>
                    Sohbeti Kapat
                  </button>
                )}
              </div>
            </div>

            {/* Mesaj Listesi */}
            <div className={styles.messagesList}>
              <div className={styles.dateDivider}><span>Mesajlar</span></div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const mine = isMe(msg);
                  const isSelected = selectedMsgIds.includes(msg.id);
                  return (
                    <div key={msg.id} className={styles.messageRow}
                      style={{ justifyContent: mine ? 'flex-end' : 'flex-start' }}>

                      {/* Seçim checkbox */}
                      {selectionMode && (
                        <button onClick={() => toggleSelectMsg(msg.id)} style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}`,
                          background: isSelected ? 'var(--gold)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          order: mine ? 1 : -1
                        }}>
                          {isSelected && <FiCheck size={11} color="#000" strokeWidth={3} />}
                        </button>
                      )}

                      {!mine && !selectionMode && (
                        <div className={styles.msgAvatar}>{selectedConv.initials}</div>
                      )}

                      <motion.div
                        className={`${styles.messageWrapper} ${mine ? styles.messageMine : styles.messageOther}`}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className={styles.messageBubble}>
                          <p className={styles.messageContent}>{renderMessageContent(msg.content)}</p>
                          <div className={styles.messageMeta}>
                            <span>{formatTime(msg.sentAt)}</span>
                            {mine && <FiCheckCircle className={styles.readIcon} />}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {isTyping && (
                  <motion.div className={`${styles.messageWrapper} ${styles.messageOther}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}>
                    <div className={styles.msgAvatar}>{selectedConv.initials}</div>
                    <div className={`${styles.messageBubble} ${styles.typingBubble}`}>
                      <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Giriş Alanı */}
            {selectedConv.isClosed ? (
              <div style={{
                padding: 16, background: 'rgba(224,85,148,0.05)',
                border: '1px solid rgba(224,85,148,0.2)', borderRadius: 8,
                color: '#e05594', fontSize: 13, textAlign: 'center', margin: 16
              }}>
                Bu sohbet sonlandırılmıştır.
              </div>
            ) : (
              <>
                <div style={{
                  padding: '5px 16px', background: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6
                }}>
                  💡 Görsel iletmek için{' '}
                  <a href="https://hizliresim.com" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Hızlı Resim</a>{' '}
                  veya{' '}
                  <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--gold)', textDecoration: 'underline' }}>ImgBB</a>{' '}
                  servislerini kullanıp linki yapıştırabilirsiniz.
                </div>
                <form className={styles.inputArea} onSubmit={handleSend}>
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Mesajınızı yazın..."
                    className={styles.messageInput}
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value);
                      if (selectedConv) sendTypingLive(selectedConv.id).catch(() => null);
                    }}
                  />
                  <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                    <FiSend />
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
