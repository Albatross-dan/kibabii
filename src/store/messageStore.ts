import { create } from 'zustand';
import { EnrichedConversation, Message, ConversationContextDetails } from '@/types/messaging';

interface MessageStore {
  unreadCount: number;
  conversations: EnrichedConversation[];
  activeConversationId: string | null;
  messagesByConvId: Record<string, Message[]>;
  cachedContexts: Record<string, ConversationContextDetails>;
  
  // Actions
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  setConversations: (conversations: EnrichedConversation[]) => void;
  upsertConversation: (conversation: EnrichedConversation) => void;
  setActiveConversationId: (id: string | null) => void;
  setConversationMessages: (conversationId: string, messages: Message[]) => void;
  addMessageToConv: (conversationId: string, message: Message) => void;
  setCachedContext: (key: string, context: ConversationContextDetails) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
  markConversationReadInStore: (conversationId: string) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  unreadCount: 0,
  conversations: [],
  activeConversationId: null,
  messagesByConvId: {},
  cachedContexts: {},

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
  
  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (newConv) =>
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.conversation.id === newConv.conversation.id);
      let updated: EnrichedConversation[];
      if (idx >= 0) {
        updated = [...state.conversations];
        updated[idx] = { ...updated[idx], ...newConv };
      } else {
        updated = [newConv, ...state.conversations];
      }
      return { conversations: updated };
    }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setConversationMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConvId: {
        ...state.messagesByConvId,
        [conversationId]: messages,
      },
    })),

  addMessageToConv: (conversationId, message) =>
    set((state) => {
      const current = state.messagesByConvId[conversationId] || [];
      if (current.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messagesByConvId: {
          ...state.messagesByConvId,
          [conversationId]: [...current, message],
        },
      };
    }),

  setCachedContext: (key, context) =>
    set((state) => ({
      cachedContexts: {
        ...state.cachedContexts,
        [key]: context,
      },
    })),

  updateConversationLastMessage: (conversationId, message) =>
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c.conversation.id === conversationId) {
          return {
            ...c,
            lastMessage: message,
            conversation: {
              ...c.conversation,
              last_message_at: message.created_at,
            },
          };
        }
        return c;
      });
      // Re-sort with latest message at top
      updated.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || a.conversation.last_message_at || a.conversation.created_at;
        const timeB = b.lastMessage?.created_at || b.conversation.last_message_at || b.conversation.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
      return { conversations: updated };
    }),

  markConversationReadInStore: (conversationId) =>
    set((state) => {
      let unreadDiff = 0;
      const updated = state.conversations.map((c) => {
        if (c.conversation.id === conversationId) {
          unreadDiff = c.currentParticipant.unread_count || 0;
          return {
            ...c,
            currentParticipant: {
              ...c.currentParticipant,
              unread_count: 0,
              last_read_at: new Date().toISOString(),
            },
          };
        }
        return c;
      });
      return {
        conversations: updated,
        unreadCount: Math.max(0, state.unreadCount - unreadDiff),
      };
    }),
}));
