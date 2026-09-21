import { supabase } from '@/lib/supabase';
import { 
  ConversationContextType, 
  MessageType, 
  Conversation, 
  ConversationParticipant, 
  Message, 
  MessageAttachment, 
  EnrichedConversation, 
  ConversationContextDetails 
} from '@/types/messaging';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';

interface LocalConversationRecord {
  id: string;
  context_type: ConversationContextType;
  context_id: string | null;
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  participantIds: string[];
  participants: {
    userId: string;
    unreadCount: number;
    lastReadAt: string | null;
    isMuted: boolean;
  }[];
}

export class MessagingService {
  private contextDetailsCache = new Map<string, ConversationContextDetails>();
  private conversationCache = new Map<string, EnrichedConversation>();

  setContextCache(contextId: string, details: ConversationContextDetails) {
    if (!contextId || !details) return;
    this.contextDetailsCache.set(contextId, details);
    try {
      useMessageStore.getState().setCachedContext(contextId, details);
    } catch {}
  }

  private getLocalConversations(): LocalConversationRecord[] {
    try {
      const data = localStorage.getItem('kibabiimart_local_conversations');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalConversations(convs: LocalConversationRecord[]) {
    try {
      localStorage.setItem('kibabiimart_local_conversations', JSON.stringify(convs));
    } catch (e) {
      console.warn('Failed to save local conversations:', e);
    }
  }

  private getLocalMessages(conversationId: string): Message[] {
    try {
      const data = localStorage.getItem(`kibabiimart_local_msgs_${conversationId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalMessages(conversationId: string, messages: Message[]) {
    try {
      localStorage.setItem(`kibabiimart_local_msgs_${conversationId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save local messages:', e);
    }
  }

  async resolveParticipantProfile(userId: string): Promise<{
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: string | null;
    is_verified?: boolean;
    student_id?: string | null;
  }> {
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('id, full_name, username, avatar_url, role, is_verified')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          full_name: data.full_name || 'Campus Comrade',
          username: data.username || 'comrade',
          avatar_url: data.avatar_url,
          phone: null,
          role: data.role || null,
          is_verified: !!data.is_verified,
          student_id: null
        };
      }
    } catch {}

    try {
      const accounts = useAuthStore.getState().accounts || [];
      const matched = accounts.find(a => a.id === userId || a.email === userId);
      if (matched) {
        return {
          id: matched.id,
          full_name: matched.full_name || 'Campus Comrade',
          username: matched.username || 'comrade',
          avatar_url: matched.avatar_url || null,
          phone: matched.phone || null,
          role: matched.role || null,
          is_verified: matched.student_verification_status === 'approved' || matched.verification_status === 'verified',
          student_id: (matched as any).student_id || (matched as any).student_reg_number || null
        };
      }
    } catch {}

    return {
      id: userId,
      full_name: 'Campus Seller',
      username: 'seller',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      phone: null,
      role: 'seller',
      is_verified: true,
      student_id: null
    };
  }

  async resolveContextDetails(
    contextType: ConversationContextType,
    contextId: string | null
  ): Promise<ConversationContextDetails | undefined> {
    if (!contextId) return undefined;

    // Check fast in-memory caches first
    if (this.contextDetailsCache.has(contextId)) {
      return this.contextDetailsCache.get(contextId);
    }
    try {
      const storeCached = useMessageStore.getState().cachedContexts[contextId];
      if (storeCached) {
        this.contextDetailsCache.set(contextId, storeCached);
        return storeCached;
      }
    } catch {}

    let resolved: ConversationContextDetails | undefined;

    if (contextType === 'product' || contextType === 'accommodation' || contextType === 'service') {
      try {
        const { data: listing } = await supabase
          .from('listings')
          .select('*')
          .eq('id', contextId)
          .maybeSingle();

        if (listing) {
          let title = listing.title;
          let price = 0;
          let imageUrl = '';
          const ownerId = listing.owner_id;

          if (listing.product_id) {
            const { data: p } = await supabase
              .from('products')
              .select('*')
              .eq('id', listing.product_id)
              .maybeSingle();

            if (p) {
              price = p.price;
              const { data: img } = await supabase
                .from('product_images')
                .select('image_url')
                .eq('product_id', p.id)
                .order('is_primary', { ascending: false })
                .limit(1)
                .maybeSingle();
              imageUrl = img?.image_url || '';
            }
          } else if (listing.accommodation_id) {
            const { data: a } = await supabase
              .from('accommodations')
              .select('*')
              .eq('id', listing.accommodation_id)
              .maybeSingle();

            if (a) {
              price = a.price_per_month || a.rent_amount || 0;
              const { data: img } = await supabase
                .from('accommodation_images')
                .select('image_url')
                .eq('accommodation_id', a.id)
                .order('is_primary', { ascending: false })
                .limit(1)
                .maybeSingle();
              imageUrl = img?.image_url || '';
            }
          }

          resolved = {
            type: listing.listing_type || 'product',
            id: listing.id,
            title,
            price,
            imageUrl,
            category: listing.listing_type,
            ownerId
          };
        } else {
          // Direct product lookup fallback
          const { data: pDirect } = await supabase
            .from('products')
            .select('*')
            .eq('id', contextId)
            .maybeSingle();

          if (pDirect) {
            const { data: img } = await supabase
              .from('product_images')
              .select('image_url')
              .eq('product_id', pDirect.id)
              .maybeSingle();

            resolved = {
              type: 'product',
              id: pDirect.id,
              title: pDirect.title,
              price: pDirect.price,
              imageUrl: img?.image_url || '',
              ownerId: pDirect.seller_id
            };
          }
        }
      } catch (err) {
        console.warn('Could not resolve listing context:', err);
      }
    } else if (contextType === 'store') {
      try {
        const { data: storeProf } = await supabase
          .from('public_profiles')
          .select('id, full_name, username, avatar_url, role')
          .eq('id', contextId)
          .maybeSingle();

        if (storeProf) {
          resolved = {
            type: 'store',
            id: storeProf.id,
            title: storeProf.full_name || storeProf.username || 'Official Campus Store',
            imageUrl: storeProf.avatar_url || undefined,
            ownerId: storeProf.id
          };
        }
      } catch {}
    }

    if (resolved) {
      this.contextDetailsCache.set(contextId, resolved);
      try {
        useMessageStore.getState().setCachedContext(contextId, resolved);
      } catch {}
    }

    return resolved;
  }

  /**
   * Start or resume a 1:1 conversation via backend RPC, with fallback to local store.
   */
  async startOrGetConversation(
    contextType: ConversationContextType,
    contextId: string | null,
    otherUserId: string,
    currentUserId?: string
  ): Promise<string> {
    if (currentUserId && currentUserId === otherUserId) {
      throw new Error('You cannot start a conversation with yourself.');
    }

    const myId = currentUserId || useAuthStore.getState().user?.id || 'guest_user';

    // 0. Check in-memory useMessageStore first (fastest, 0ms)
    try {
      const existingStoreConv = useMessageStore.getState().conversations.find(c => 
        c.conversation.context_type === contextType &&
        (c.conversation.context_id || null) === (contextId || null) &&
        (c.otherParticipant?.user_id === otherUserId || c.currentParticipant?.user_id === otherUserId)
      );
      if (existingStoreConv) {
        return existingStoreConv.conversation.id;
      }
    } catch {}

    // 1. Check local conversations (fast, 0ms)
    const localConvs = this.getLocalConversations();
    const existing = localConvs.find(c => 
      c.context_type === contextType &&
      (c.context_id || null) === (contextId || null) &&
      c.participantIds.includes(myId) &&
      c.participantIds.includes(otherUserId)
    );

    if (existing) {
      return existing.id;
    }

    // 2. If active Supabase session exists, try backend RPC with a 1-second timeout race
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const rpcPromise = supabase.rpc('start_conversation', {
          _context_type: contextType,
          _context_id: contextId || null,
          _other_user_id: otherUserId
        });

        const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 1000)
        );

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

        if (!error && data) {
          return data as string;
        }

        if (error && error.message !== 'timeout') {
          console.warn('Supabase start_conversation RPC returned error (using local persistence):', error.message || error);
        }
      }
    } catch (rpcErr) {
      console.warn('Supabase start_conversation RPC caught error (using local persistence):', rpcErr);
    }

    // 3. Seamless local fallback when unauthenticated or RPC timed out / restricted
    return await this.startOrGetLocalConversation(contextType, contextId, otherUserId, currentUserId);
  }

  async startOrGetLocalConversation(
    contextType: ConversationContextType,
    contextId: string | null,
    otherUserId: string,
    currentUserId?: string
  ): Promise<string> {
    const myId = currentUserId || useAuthStore.getState().user?.id || 'guest_user';
    const localConvs = this.getLocalConversations();

    const existing = localConvs.find(c => 
      c.context_type === contextType &&
      (c.context_id || null) === (contextId || null) &&
      c.participantIds.includes(myId) &&
      c.participantIds.includes(otherUserId)
    );

    if (existing) {
      return existing.id;
    }

    const cleanContext = (contextId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanUsers = [myId, otherUserId].sort().join('_').replace(/[^a-zA-Z0-9_-]/g, '');
    const newConvId = `conv_${contextType}_${cleanContext}_${cleanUsers}`;
    const now = new Date().toISOString();

    const newRecord: LocalConversationRecord = {
      id: newConvId,
      context_type: contextType,
      context_id: contextId || null,
      last_message_at: now,
      is_archived: false,
      created_at: now,
      updated_at: now,
      participantIds: [myId, otherUserId],
      participants: [
        { userId: myId, unreadCount: 0, lastReadAt: now, isMuted: false },
        { userId: otherUserId, unreadCount: 0, lastReadAt: null, isMuted: false }
      ]
    };

    localConvs.unshift(newRecord);
    this.saveLocalConversations(localConvs);

    return newConvId;
  }

  /**
   * Fetch all conversations for the current user, enriched with other participant's profile,
   * context metadata, and the latest message.
   */
  async fetchConversations(currentUserId: string): Promise<EnrichedConversation[]> {
    const enrichedList: EnrichedConversation[] = [];
    const seenConvIds = new Set<string>();

    // 1. Fetch Supabase conversations if possible
    try {
      const { data: myParticipants, error: partError } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('user_id', currentUserId);

      if (!partError && myParticipants && myParticipants.length > 0) {
        const conversationIds = myParticipants.map(p => p.conversation_id);

        let convsWithParts: any[] | null = null;
        try {
          const { data, error: convError } = await supabase
            .from('conversations')
            .select(`
              *,
              conversation_participants (
                id,
                conversation_id,
                user_id,
                unread_count,
                last_read_at,
                is_muted,
                created_at,
                public_profiles (
                  id,
                  full_name,
                  username,
                  avatar_url,
                  role,
                  is_verified
                )
              )
            `)
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false, nullsFirst: false });

          if (!convError && data) {
            convsWithParts = data;
          }
        } catch (e) {
          console.warn('Unified conversations query error:', e);
        }

        // Fallback if unified nested join query failed
        let convs = convsWithParts;
        let allParticipants: any[] = [];
        if (!convs) {
          const { data: rawConvs } = await supabase
            .from('conversations')
            .select('*')
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false, nullsFirst: false });
          convs = rawConvs || [];

          const { data: rawParts } = await supabase
            .from('conversation_participants')
            .select('*')
            .in('conversation_id', conversationIds);
          allParticipants = rawParts || [];
        } else {
          allParticipants = convs.flatMap((c: any) => c.conversation_participants || []);
        }

        // Collect all participant user IDs that need profile details from public_profiles
        const missingUserIds = allParticipants
          .filter((p: any) => {
            const prof = p.public_profiles || p.profile;
            return !prof || (Array.isArray(prof) && prof.length === 0);
          })
          .map((p: any) => p.user_id);

        const profileMap = new Map<string, any>();
        if (missingUserIds.length > 0) {
          try {
            const { data: directProfiles } = await supabase
              .from('public_profiles')
              .select('id, full_name, username, avatar_url, role, is_verified')
              .in('id', missingUserIds);

            directProfiles?.forEach((dp: any) => profileMap.set(dp.id, dp));
          } catch (pErr) {
            console.warn('Could not batch fetch public_profiles for list:', pErr);
          }
        }

        const { data: latestMessages } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        const enrichedItems = await Promise.all(
          convs.map(async (conv) => {
            seenConvIds.add(conv.id);
            const convParts = conv.conversation_participants || allParticipants.filter((p: any) => p.conversation_id === conv.id);
            const rawMyPart = convParts.find((p: any) => p.user_id === currentUserId) || myParticipants.find(p => p.conversation_id === conv.id);
            const rawOtherPart = convParts.find((p: any) => p.user_id !== currentUserId);

            const getNormProfile = (part: any) => {
              if (!part) return undefined;
              const pObj = part.public_profiles || part.profile || profileMap.get(part.user_id);
              const prof = Array.isArray(pObj) ? pObj[0] : pObj;
              return prof || {
                id: part.user_id,
                full_name: 'Campus Comrade',
                username: 'comrade',
                avatar_url: null,
                role: 'buyer'
              };
            };

            const lastMsg = latestMessages?.find(m => m.conversation_id === conv.id);
            const contextDetails = await this.resolveContextDetails(conv.context_type, conv.context_id);

            const enriched: EnrichedConversation = {
              conversation: {
                id: conv.id,
                context_type: conv.context_type,
                context_id: conv.context_id,
                last_message_at: conv.last_message_at,
                is_archived: conv.is_archived,
                created_at: conv.created_at,
                updated_at: conv.updated_at
              } as Conversation,
              currentParticipant: {
                id: rawMyPart?.id || '',
                conversation_id: conv.id,
                user_id: currentUserId,
                unread_count: rawMyPart?.unread_count ?? 0,
                last_read_at: rawMyPart?.last_read_at || new Date().toISOString(),
                is_muted: !!rawMyPart?.is_muted,
                created_at: conv.created_at,
                profile: getNormProfile(rawMyPart)
              },
              otherParticipant: rawOtherPart ? {
                id: rawOtherPart.id,
                conversation_id: conv.id,
                user_id: rawOtherPart.user_id,
                unread_count: rawOtherPart.unread_count ?? 0,
                last_read_at: rawOtherPart.last_read_at,
                is_muted: !!rawOtherPart.is_muted,
                created_at: rawOtherPart.created_at,
                profile: getNormProfile(rawOtherPart)
              } : undefined,
              lastMessage: lastMsg as Message | undefined,
              contextDetails
            };

            this.conversationCache.set(conv.id, enriched);
            return enriched;
          })
        );

        enrichedList.push(...enrichedItems);
      }
    } catch (sbErr) {
      console.warn('Supabase fetchConversations warning:', sbErr);
    }

    // 2. Fetch local conversations
    const localConvs = this.getLocalConversations();
    for (const lc of localConvs) {
      if (lc.participantIds.includes(currentUserId) && !seenConvIds.has(lc.id)) {
        const enriched = await this.fetchLocalConversation(lc.id, currentUserId);
        if (enriched) {
          enrichedList.push(enriched);
          seenConvIds.add(lc.id);
        }
      }
    }

    // 3. Sort by last_message_at descending
    enrichedList.sort((a, b) => {
      const timeA = new Date(a.conversation.last_message_at || a.conversation.created_at).getTime();
      const timeB = new Date(b.conversation.last_message_at || b.conversation.created_at).getTime();
      return timeB - timeA;
    });

    // Update global unread badge
    const totalUnread = enrichedList.reduce((sum, item) => sum + (item.currentParticipant?.unread_count || 0), 0);
    useMessageStore.getState().setUnreadCount(totalUnread);

    return enrichedList;
  }

  /**
   * Fetch a single conversation by ID with all participants and context details.
   */
  async fetchConversation(
    conversationId: string, 
    currentUserId: string
  ): Promise<EnrichedConversation | null> {
    // 0. Instant in-memory cache lookup
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }
    try {
      const storeConv = useMessageStore.getState().conversations.find(
        (c) => c.conversation.id === conversationId
      );
      if (storeConv) {
        this.conversationCache.set(conversationId, storeConv);
        return storeConv;
      }
    } catch {}

    // 1. Try Supabase if not a local conversation
    if (!conversationId.startsWith('conv_')) {
      try {
        let conv: any = null;
        let participants: any[] = [];

        // Primary: Unified query on conversations with embedded conversation_participants and public_profiles
        try {
          const { data: convWithParts, error: queryError } = await supabase
            .from('conversations')
            .select(`
              *,
              conversation_participants (
                id,
                conversation_id,
                user_id,
                unread_count,
                last_read_at,
                is_muted,
                created_at,
                public_profiles (
                  id,
                  full_name,
                  username,
                  avatar_url,
                  role,
                  is_verified
                )
              )
            `)
            .eq('id', conversationId)
            .maybeSingle();

          if (!queryError && convWithParts) {
            conv = convWithParts;
            participants = convWithParts.conversation_participants || [];
          }
        } catch (e) {
          console.warn('Unified conversation query error:', e);
        }

        // Secondary fallback: Direct fetch of conversation and participants
        if (!conv) {
          const { data: directConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .maybeSingle();

          if (directConv) {
            conv = directConv;
            const { data: directParts } = await supabase
              .from('conversation_participants')
              .select('*')
              .eq('conversation_id', conversationId);
            participants = directParts || [];
          }
        }

        if (conv) {
          // Check if any participants need profile fetched from public_profiles
          const missingUserIds = participants
            .filter((p: any) => {
              const prof = p.public_profiles || p.profile;
              return !prof || (Array.isArray(prof) && prof.length === 0);
            })
            .map((p: any) => p.user_id);

          const profileMap = new Map<string, any>();
          if (missingUserIds.length > 0) {
            try {
              const { data: directProfiles } = await supabase
                .from('public_profiles')
                .select('id, full_name, username, avatar_url, role, is_verified')
                .in('id', missingUserIds);

              directProfiles?.forEach((dp: any) => profileMap.set(dp.id, dp));
            } catch (pErr) {
              console.warn('Could not batch fetch public_profiles:', pErr);
            }
          }

          const normalizePart = (p: any): ConversationParticipant => {
            const rawProf = p.public_profiles || p.profile || profileMap.get(p.user_id);
            const profileObj = Array.isArray(rawProf) ? rawProf[0] : rawProf;

            return {
              id: p.id || '',
              conversation_id: p.conversation_id || conv.id,
              user_id: p.user_id,
              unread_count: p.unread_count ?? 0,
              last_read_at: p.last_read_at,
              is_muted: !!p.is_muted,
              created_at: p.created_at || conv.created_at,
              profile: profileObj || {
                id: p.user_id,
                full_name: 'Campus Comrade',
                username: 'comrade',
                avatar_url: null,
                role: 'buyer'
              }
            };
          };

          const rawMyPart = participants.find((p: any) => p.user_id === currentUserId);
          const myPart: ConversationParticipant = rawMyPart
            ? normalizePart(rawMyPart)
            : {
                id: '',
                conversation_id: conv.id,
                user_id: currentUserId,
                unread_count: 0,
                last_read_at: new Date().toISOString(),
                is_muted: false,
                created_at: conv.created_at
              };

          const rawOtherPart = participants.find((p: any) => p.user_id !== currentUserId);
          let otherPart = rawOtherPart ? normalizePart(rawOtherPart) : undefined;

          // If otherPart is still undefined but we have another participant record
          if (!otherPart && participants.length > 0) {
            const anyOther = participants.find((p: any) => p.id !== rawMyPart?.id);
            if (anyOther) otherPart = normalizePart(anyOther);
          }

          const [contextDetails, latestMsgs] = await Promise.all([
            this.resolveContextDetails(conv.context_type, conv.context_id),
            this.fetchMessages(conversationId)
          ]);

          const lastMessage = latestMsgs.length > 0 ? latestMsgs[latestMsgs.length - 1] : undefined;

          const enriched: EnrichedConversation = {
            conversation: {
              id: conv.id,
              context_type: conv.context_type,
              context_id: conv.context_id,
              last_message_at: conv.last_message_at,
              is_archived: conv.is_archived,
              created_at: conv.created_at,
              updated_at: conv.updated_at
            } as Conversation,
            currentParticipant: myPart,
            otherParticipant: otherPart,
            lastMessage,
            contextDetails
          };

          this.conversationCache.set(conv.id, enriched);
          try {
            useMessageStore.getState().upsertConversation(enriched);
            if (latestMsgs && latestMsgs.length > 0) {
              useMessageStore.getState().setConversationMessages(conv.id, latestMsgs);
            }
          } catch {}

          return enriched;
        }
      } catch (err) {
        console.warn('Supabase fetchConversation error:', err);
      }
    }

    // 2. Fetch local conversation
    const localEnriched = await this.fetchLocalConversation(conversationId, currentUserId);
    if (localEnriched) {
      this.conversationCache.set(localEnriched.conversation.id, localEnriched);
      try {
        useMessageStore.getState().upsertConversation(localEnriched);
      } catch {}
    }
    return localEnriched;
  }

  async fetchLocalConversation(
    conversationId: string,
    currentUserId: string
  ): Promise<EnrichedConversation | null> {
    const localConvs = this.getLocalConversations();
    let record = localConvs.find(c => c.id === conversationId);

    if (!record) {
      // Check if conversationId was a user ID
      const withUser = localConvs.find(c => 
        c.participantIds.includes(conversationId) && 
        c.participantIds.includes(currentUserId)
      );
      if (withUser) {
        record = withUser;
      }
    }

    if (!record) return null;

    const myId = currentUserId || useAuthStore.getState().user?.id || 'guest_user';
    const otherId = record.participantIds.find(p => p !== myId) || record.participantIds[0] || 'seller';

    const otherProfile = await this.resolveParticipantProfile(otherId);
    const myProfile = await this.resolveParticipantProfile(myId);

    const myPartRaw = record.participants.find(p => p.userId === myId);
    const otherPartRaw = record.participants.find(p => p.userId === otherId);

    const currentParticipant: ConversationParticipant = {
      id: `part_${myId}_${record.id}`,
      conversation_id: record.id,
      user_id: myId,
      unread_count: myPartRaw?.unreadCount ?? 0,
      last_read_at: myPartRaw?.lastReadAt ?? new Date().toISOString(),
      is_muted: !!myPartRaw?.isMuted,
      created_at: record.created_at,
      profile: myProfile
    };

    const otherParticipant: ConversationParticipant = {
      id: `part_${otherId}_${record.id}`,
      conversation_id: record.id,
      user_id: otherId,
      unread_count: otherPartRaw?.unreadCount ?? 0,
      last_read_at: otherPartRaw?.lastReadAt ?? null,
      is_muted: !!otherPartRaw?.isMuted,
      created_at: record.created_at,
      profile: otherProfile
    };

    const contextDetails = await this.resolveContextDetails(record.context_type, record.context_id);
    const msgs = this.getLocalMessages(record.id);
    const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;

    return {
      conversation: {
        id: record.id,
        context_type: record.context_type,
        context_id: record.context_id,
        last_message_at: record.last_message_at,
        is_archived: record.is_archived,
        created_at: record.created_at,
        updated_at: record.updated_at
      },
      currentParticipant,
      otherParticipant,
      lastMessage,
      contextDetails
    };
  }

  /**
   * Fetch all messages in a conversation, including attachments and sender profiles.
   */
  async fetchMessages(conversationId: string): Promise<Message[]> {
    let supabaseMessages: Message[] = [];

    if (!conversationId.startsWith('conv_')) {
      try {
        let messagesData: any[] = [];
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            body,
            message_type,
            is_deleted,
            created_at,
            updated_at,
            public_profiles (
              id,
              full_name,
              username,
              avatar_url
            ),
            attachments:message_attachments (
              id,
              message_id,
              file_url,
              file_type,
              file_size_bytes,
              created_at
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          messagesData = data;
        } else {
          // Fallback: query messages with attachments directly
          const { data: fallbackData } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              body,
              message_type,
              is_deleted,
              created_at,
              updated_at,
              attachments:message_attachments (
                id,
                message_id,
                file_url,
                file_type,
                file_size_bytes,
                created_at
              )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (fallbackData) {
            messagesData = fallbackData;
          }
        }

        // Batch fetch any missing sender profiles from public_profiles
        const missingSenderIds = Array.from(new Set(
          messagesData
            .filter((m: any) => {
              const prof = m.public_profiles || m.sender;
              return !prof || (Array.isArray(prof) && prof.length === 0);
            })
            .map((m: any) => m.sender_id)
            .filter(Boolean)
        ));

        const senderMap = new Map<string, any>();
        if (missingSenderIds.length > 0) {
          try {
            const { data: senderProfiles } = await supabase
              .from('public_profiles')
              .select('id, full_name, username, avatar_url')
              .in('id', missingSenderIds);

            senderProfiles?.forEach((sp: any) => senderMap.set(sp.id, sp));
          } catch (spErr) {
            console.warn('Could not fetch sender profiles from public_profiles:', spErr);
          }
        }

        if (messagesData.length > 0) {
          supabaseMessages = messagesData.map((m: any): Message => {
            const rawSender = m.public_profiles || m.sender || senderMap.get(m.sender_id);
            const senderObj = Array.isArray(rawSender) ? rawSender[0] : rawSender;
            return {
              id: m.id,
              conversation_id: m.conversation_id,
              sender_id: m.sender_id,
              body: m.body,
              message_type: m.message_type,
              is_deleted: !!m.is_deleted,
              created_at: m.created_at,
              updated_at: m.updated_at,
              sender: senderObj || undefined,
              attachments: m.attachments || []
            };
          });
        }
      } catch (err) {
        console.warn('Could not fetch Supabase messages:', err);
      }
    }

    const localMessages = this.getLocalMessages(conversationId);
    if (supabaseMessages.length === 0) {
      return localMessages;
    }

    // Merge Supabase and local messages (deduplicated by id)
    const seenIds = new Set(supabaseMessages.map(m => m.id));
    const merged = [...supabaseMessages];
    for (const lm of localMessages) {
      if (!seenIds.has(lm.id)) {
        merged.push(lm);
      }
    }
    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return merged;
  }

  /**
   * Send a message to a conversation.
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    body: string;
    messageType?: MessageType;
    files?: File[];
  }): Promise<Message> {
    const { conversationId, senderId, body, messageType = 'text', files } = params;

    // 1. Try Supabase insert if not local conversation ID
    if (!conversationId.startsWith('conv_')) {
      try {
        const { data: newMsg, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            body: body.trim(),
            message_type: messageType,
          })
          .select(`
            id,
            conversation_id,
            sender_id,
            body,
            message_type,
            is_deleted,
            created_at,
            updated_at
          `)
          .single();

        if (!insertError && newMsg) {
          const attachments: MessageAttachment[] = [];
          if (files && files.length > 0) {
            for (const file of files) {
              try {
                const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const path = `${senderId}/${conversationId}/${Date.now()}_${cleanFilename}`;

                let publicUrl = '';
                const { error: uploadError } = await supabase.storage
                  .from('chat-attachments')
                  .upload(path, file, { upsert: true });

                if (!uploadError) {
                  const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
                  publicUrl = data.publicUrl;
                } else {
                  const { error: fallbackError } = await supabase.storage
                    .from('listings')
                    .upload(path, file, { upsert: true });

                  if (!fallbackError) {
                    const { data } = supabase.storage.from('listings').getPublicUrl(path);
                    publicUrl = data.publicUrl;
                  }
                }

                if (publicUrl) {
                  const { data: attData } = await supabase
                    .from('message_attachments')
                    .insert({
                      message_id: newMsg.id,
                      file_url: publicUrl,
                      file_type: file.type || 'image/jpeg',
                      file_size_bytes: file.size || null,
                    })
                    .select('*')
                    .single();

                  if (attData) {
                    attachments.push(attData as MessageAttachment);
                  }
                }
              } catch (uploadErr) {
                console.warn('Failed to upload attachment:', uploadErr);
              }
            }
          }

          return {
            ...(newMsg as Message),
            attachments
          };
        }
      } catch (err) {
        console.warn('Supabase message insert error (falling back to local):', err);
      }
    }

    // 2. Local fallback message
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const senderProfile = await this.resolveParticipantProfile(senderId);

    const attachments: MessageAttachment[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          attachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            message_id: msgId,
            file_url: dataUrl,
            file_type: file.type || 'image/jpeg',
            file_size_bytes: file.size,
            created_at: now
          });
        } catch {}
      }
    }

    const localMsg: Message = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim(),
      message_type: messageType,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      sender: senderProfile,
      attachments
    };

    const currentMsgs = this.getLocalMessages(conversationId);
    currentMsgs.push(localMsg);
    this.saveLocalMessages(conversationId, currentMsgs);

    // Update conversation record last_message_at
    const localConvs = this.getLocalConversations();
    const convIdx = localConvs.findIndex(c => c.id === conversationId);
    if (convIdx !== -1) {
      localConvs[convIdx].last_message_at = now;
      localConvs[convIdx].updated_at = now;
      this.saveLocalConversations(localConvs);
    }

    // Dispatch window event so reactive listeners immediately pick up this message
    try {
      window.dispatchEvent(new CustomEvent('kibabiimart-message-sent', {
        detail: { conversationId, message: localMsg }
      }));
    } catch {}

    return localMsg;
  }

  /**
   * Mark conversation as read by resetting participant unread_count to 0
   * and updating last_read_at.
   */
  async markConversationAsRead(conversationId: string, currentUserId: string): Promise<void> {
    if (!conversationId.startsWith('conv_')) {
      try {
        await supabase
          .from('conversation_participants')
          .update({
            unread_count: 0,
            last_read_at: new Date().toISOString()
          })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);
      } catch (err) {
        console.warn('Supabase mark conversation read error:', err);
      }
    }

    const localConvs = this.getLocalConversations();
    const conv = localConvs.find(c => c.id === conversationId);
    if (conv) {
      const part = conv.participants.find(p => p.userId === currentUserId);
      if (part) {
        part.unreadCount = 0;
        part.lastReadAt = new Date().toISOString();
        this.saveLocalConversations(localConvs);
      }
    }

    this.refreshGlobalUnreadCount(currentUserId);
  }

  /**
   * Soft-delete a message.
   */
  async softDeleteMessage(messageId: string, currentUserId: string): Promise<void> {
    if (!messageId.startsWith('msg-')) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_deleted: true })
          .eq('id', messageId)
          .eq('sender_id', currentUserId);

        if (!error) return;
      } catch (err) {
        console.warn('Failed to soft-delete Supabase message:', err);
      }
    }

    const localConvs = this.getLocalConversations();
    for (const c of localConvs) {
      const msgs = this.getLocalMessages(c.id);
      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        msg.is_deleted = true;
        this.saveLocalMessages(c.id, msgs);
        break;
      }
    }
  }

  /**
   * Toggle mute for a conversation.
   */
  async toggleMuteConversation(
    conversationId: string, 
    currentUserId: string, 
    isMuted: boolean
  ): Promise<void> {
    if (!conversationId.startsWith('conv_')) {
      try {
        const { error } = await supabase
          .from('conversation_participants')
          .update({ is_muted: isMuted })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);

        if (!error) return;
      } catch (err) {
        console.warn('Failed to toggle Supabase mute:', err);
      }
    }

    const localConvs = this.getLocalConversations();
    const conv = localConvs.find(c => c.id === conversationId);
    if (conv) {
      const part = conv.participants.find(p => p.userId === currentUserId);
      if (part) {
        part.isMuted = isMuted;
        this.saveLocalConversations(localConvs);
      }
    }
  }

  /**
   * Toggle archive state on a conversation.
   */
  async toggleArchiveConversation(
    conversationId: string, 
    isArchived: boolean
  ): Promise<void> {
    if (!conversationId.startsWith('conv_')) {
      try {
        const { error } = await supabase
          .from('conversations')
          .update({ is_archived: isArchived })
          .eq('id', conversationId);

        if (!error) return;
      } catch (err) {
        console.warn('Failed to archive Supabase conversation:', err);
      }
    }

    const localConvs = this.getLocalConversations();
    const conv = localConvs.find(c => c.id === conversationId);
    if (conv) {
      conv.is_archived = isArchived;
      this.saveLocalConversations(localConvs);
    }
  }

  /**
   * Refresh the total unread messages count across all conversations
   * and update the global Zustand messageStore.
   */
  async refreshGlobalUnreadCount(currentUserId: string): Promise<number> {
    let total = 0;
    try {
      const { data } = await supabase
        .from('conversation_participants')
        .select('unread_count')
        .eq('user_id', currentUserId);

      if (data) {
        total += data.reduce((acc, row) => acc + (row.unread_count || 0), 0);
      }
    } catch {}

    const localConvs = this.getLocalConversations();
    for (const c of localConvs) {
      const myPart = c.participants.find(p => p.userId === currentUserId);
      if (myPart) {
        total += myPart.unreadCount || 0;
      }
    }

    useMessageStore.getState().setUnreadCount(total);
    return total;
  }
}

export const messagingService = new MessagingService();
