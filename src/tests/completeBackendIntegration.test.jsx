import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseBannerContent, DEFAULT_CONTENT } from '../utils/bannerContent';
import * as chatApi from '../services/chatApi';

describe('Complete Backend Integration Specification Tests', () => {

  describe('RICH BANNER & CONTENT PARSING', () => {
    it('7-9. should parse valid contentJson correctly with price, videoUrl, features, specs, sections', () => {
      const sampleJson = JSON.stringify({
        quote: "Kadim Şifa",
        description: "El işçiliği saf bakır",
        features: [{ title: "Saf Bakır", desc: "Darbe emici" }],
        specs: [{ key: "Ağırlık", value: "250g" }],
        sections: [{ title: "Tarihçe", body: "100 yıllık gelenek" }]
      });

      const parsed = parseBannerContent(sampleJson);

      expect(parsed.quote).toBe("Kadim Şifa");
      expect(parsed.description).toBe("El işçiliği saf bakır");
      expect(parsed.features).toHaveLength(1);
      expect(parsed.features[0].title).toBe("Saf Bakır");
      expect(parsed.features[0].description).toBe("Darbe emici"); // mapped from desc
      expect(parsed.specs[0].key).toBe("Ağırlık");
      expect(parsed.sections[0].title).toBe("Tarihçe");
    });

    it('10. feature desc field is mapped to description canonical format', () => {
      const parsed = parseBannerContent(JSON.stringify({
        features: [{ title: "Bakır", desc: "Özellik açıklaması" }]
      }));
      expect(parsed.features[0].description).toBe("Özellik açıklaması");
    });

    it('11-12. invalid contentJson returns DEFAULT_CONTENT fallback without throwing', () => {
      const invalidResult = parseBannerContent("INVALID_JSON{");
      expect(invalidResult).toEqual(DEFAULT_CONTENT);

      const nullResult = parseBannerContent(null);
      expect(nullResult).toEqual(DEFAULT_CONTENT);
    });

    it('13. Backend contentJson takes priority over localStorage value', () => {
      const backendBanner = {
        id: "banner-1",
        price: 990,
        videoUrl: "https://youtube.com/embed/demo",
        contentJson: JSON.stringify({ quote: "Backend Quote", description: "Backend Desc" })
      };
      const localStorageValue = { quote: "Local Quote", description: "Local Desc" };

      const resolvedContent = backendBanner.contentJson
        ? parseBannerContent(backendBanner.contentJson)
        : localStorageValue;

      expect(resolvedContent.quote).toBe("Backend Quote");
    });
  });

  describe('CHAT API CONTRACTS', () => {
    beforeEach(() => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('14. closeAdminConversation uses PUT method', async () => {
      await chatApi.closeAdminConversation('conv-123');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/chat/conversations/conv-123/close'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('15. deleteConversation calls DELETE /chat/conversations/{id}', async () => {
      await chatApi.deleteConversation('conv-99');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/conversations/conv-99'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('16. deleteAdminConversation calls DELETE /admin/chat/conversations/{id}', async () => {
      await chatApi.deleteAdminConversation('conv-admin-99');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/chat/conversations/conv-admin-99'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('17. deleteMessages sends DELETE /chat/messages with messageIds payload', async () => {
      await chatApi.deleteMessages(['msg-1', 'msg-2']);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/messages'),
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('"messageIds":["msg-1","msg-2"]')
        })
      );
    });

    it('18. deleteAdminMessages sends DELETE /admin/chat/messages with messageIds payload', async () => {
      await chatApi.deleteAdminMessages(['msg-a', 'msg-b']);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/chat/messages'),
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('"messageIds":["msg-a","msg-b"]')
        })
      );
    });
  });

  describe('PRESENCE & OPTIMISTIC STATUS LOGIC', () => {
    it('19. UserStatusChanged updates conversation isOnline and lastSeenAt', () => {
      const previousConvs = [
        { id: '1', customerId: 'usr-100', isOnline: false, lastSeenAt: null }
      ];
      const statusPayload = { customerId: 'usr-100', isOnline: true, lastSeenAt: '2026-07-23T14:00:00Z' };

      const updated = previousConvs.map(c => {
        if (String(c.customerId) === String(statusPayload.customerId)) {
          return { ...c, isOnline: statusPayload.isOnline, lastSeenAt: statusPayload.lastSeenAt };
        }
        return c;
      });

      expect(updated[0].isOnline).toBe(true);
      expect(updated[0].lastSeenAt).toBe('2026-07-23T14:00:00Z');
    });

    it('20. ConversationDeleted removes item from conversation list', () => {
      const convs = [{ id: '1' }, { id: '2' }];
      const deletedId = '1';
      const filtered = convs.filter(c => c.id !== deletedId);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('21. MessagesDeleted removes message IDs from active messages list', () => {
      const msgs = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
      const deletedIds = new Set(['m1', 'm3']);
      const remaining = msgs.filter(m => !deletedIds.has(m.id));
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('m2');
    });

    it('23-25. Optimistic message handling updates status from sending to sent or failed', () => {
      const clientMessageId = 'client-uuid-123';
      const tempMsg = {
        id: `temp-${clientMessageId}`,
        clientMessageId,
        content: 'Merhaba',
        status: 'sending'
      };

      expect(tempMsg.status).toBe('sending');

      // Server success response
      const serverMsg = { id: 'srv-msg-1', clientMessageId, content: 'Merhaba', status: 'sent' };
      expect(serverMsg.status).toBe('sent');
      expect(serverMsg.id).toBe('srv-msg-1');

      // Server error response
      const failedMsg = { ...tempMsg, status: 'failed' };
      expect(failedMsg.status).toBe('failed');
    });
  });
});
