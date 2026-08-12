import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import * as chatApi from '../services/chatApi';
import * as chatService from '../services/chatService';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import ChatUI from '../components/ChatUI/ChatUI';

const server = setupServer(
  http.get('*/auth/me', () => {
    return HttpResponse.json({ id: 'u1', email: 'test@user.com', fullName: 'Test User' });
  }),
  http.post('*/auth/refresh-token', () => {
    return HttpResponse.json({ accessToken: 'mock-new-token' });
  }),
  http.get('*/chat/conversations/my', () => {
    return HttpResponse.json([
      { id: 'c1', subject: 'Ürün Siparişi', unreadCount: 3, isClosed: false }
    ]);
  }),
  http.get('*/admin/chat/conversations', () => {
    return HttpResponse.json([
      { id: 'c1', customerName: 'Ahmet Yılmaz', subject: 'Teslimat Sorusu', unreadCount: 5, isClosed: false }
    ]);
  }),
  http.get('*/chat/conversations/c1/messages', () => {
    return HttpResponse.json([
      { id: 'm1', content: 'Merhaba nasıl yardımcı olabilirim?', senderId: 'u2', createdAt: new Date().toISOString() }
    ]);
  }),
  http.get('*/admin/chat/conversations/c1/messages', () => {
    return HttpResponse.json([
      { id: 'm1', content: 'Siparişiniz yolda.', senderId: 'admin1', createdAt: new Date().toISOString() }
    ]);
  }),
  http.put('*/admin/chat/conversations/:id/read', () => {
    return HttpResponse.json({ success: true });
  }),
  http.put('*/chat/conversations/:id/read', () => {
    return HttpResponse.json({ success: true });
  }),
  http.get('*/notifications/my', () => {
    return HttpResponse.json([
      { id: 'n1', type: 'chat', title: 'Yeni Destek Mesajı', message: 'Müşteri temsilcisi yanıt verdi', isRead: false },
      { id: 'n2', type: 'order', title: 'Sipariş Onayı', message: 'Siparişiniz alındı', isRead: false }
    ]);
  }),
  http.put('*/notifications/:id/read', () => {
    return HttpResponse.json({ success: true });
  })
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
  localStorage.setItem('accessToken', 'mock-valid-token');
});

afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.clear();
});

describe('Destek Mesajları Okundu & Bildirim Senkronizasyon Testleri', () => {
  test('1. markConversationAsRead ve markAdminConversationAsRead API fonksiyonları doğru PUT endpoint çağırır', async () => {
    let customerReadCalled = false;
    let adminReadCalled = false;

    server.use(
      http.put('*/admin/chat/conversations/c10/read', () => {
        adminReadCalled = true;
        return HttpResponse.json({ success: true });
      }),
      http.put('*/chat/conversations/c10/read', () => {
        customerReadCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    await chatApi.markConversationAsRead('c10');
    await chatApi.markAdminConversationAsRead('c10');

    expect(customerReadCalled).toBe(true);
    expect(adminReadCalled).toBe(true);
  });

  test('2. markConversationReadLive SignalR Hub invoke metodu güvenli çalışır', async () => {
    expect(typeof chatService.markConversationReadLive).toBe('function');
    await expect(chatService.markConversationReadLive('c1')).resolves.not.toThrow();
  });

  test('3. NotificationContext markChatNotificationsRead chat tipindeki bildirimleri okundu yapar', async () => {
    let testCtx = null;

    function TestConsumer() {
      testCtx = useNotifications();
      return (
        <div>
          <span data-testid="unread-count">{testCtx.unreadCount}</span>
          <button data-testid="mark-chat-btn" onClick={() => testCtx.markChatNotificationsRead()}>Mark Chat Read</button>
        </div>
      );
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestConsumer />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 250));
    });

    if (testCtx?.notifications?.length === 0) {
      await act(async () => {
        await testCtx.refreshNotifications();
      });
    }

    await act(async () => {
      if (testCtx?.markChatNotificationsRead) {
        await testCtx.markChatNotificationsRead();
      }
    });

    expect(testCtx.notifications.every(n => n.type !== 'chat' || n.read === true)).toBe(true);
  });

  test('4. ChatUI konuşmaya tıklanınca yerel unreadCount rozetini sıfırlar ve okundu endpointini çağırır', async () => {
    let putCalled = false;
    server.use(
      http.put('*/chat/conversations/c1/read', () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ChatUI isAdmin={false} />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const convItem = await screen.findByText('Ürün Siparişi');
    expect(convItem).toBeDefined();

    fireEvent.click(convItem.closest('.group-conv') || convItem);

    const msgContent = await screen.findByText('Merhaba nasıl yardımcı olabilirim?');
    expect(msgContent).toBeDefined();
    expect(putCalled).toBe(true);
  });
});
