import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Store, 
  Home, 
  Filter, 
  Clock, 
  BellOff, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  CheckCheck,
  ChevronRight,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messagingService';
import { EnrichedConversation } from '@/types/messaging';
import { useMessageStore } from '@/store/messageStore';
import { ChatThread } from '@/components/chat/ChatThread';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Messages() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected conversation for desktop split-view
  const paramConvId = searchParams.get('id');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(paramConvId);

  // Conversations state
  const cachedConvs = useMessageStore((state) => state.conversations);
  const [conversations, setConversations] = useState<EnrichedConversation[]>(cachedConvs);
  const [loading, setLoading] = useState(cachedConvs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'product' | 'store' | 'accommodation'>('all');

  const globalUnreadCount = useMessageStore((state) => state.unreadCount);

  // Sync selected conversation with URL search params
  useEffect(() => {
    if (paramConvId) {
      setSelectedConvId(paramConvId);
    }
  }, [paramConvId]);

  // Load conversations
  const loadConversations = async (showLoadingSpinner = true) => {
    if (!user) return;
    const hasCached = useMessageStore.getState().conversations.length > 0;
    if (showLoadingSpinner && !hasCached) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await messagingService.fetchConversations(user.id);
      setConversations(data);
      useMessageStore.getState().setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations(true);
    }
  }, [user]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    // Listen to participant updates (unread counts, last read, mute)
    const partChannel = supabase
      .channel(`user-participants-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadConversations(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new?.type === 'new_message') {
            loadConversations(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partChannel);
    };
  }, [user?.id]);

  // Select conversation
  const handleSelectConversation = (convId: string) => {
    const selectedItem = conversations.find(c => c.conversation.id === convId);
    // If mobile screen, navigate directly to /messages/:convId with state
    if (window.innerWidth < 768) {
      navigate(`/messages/${convId}`, {
        state: {
          contextDetails: selectedItem?.contextDetails,
          otherParticipant: selectedItem?.otherParticipant?.profile
        }
      });
    } else {
      setSelectedConvId(convId);
      setSearchParams({ id: convId });
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeFilter === 'unread' && (c.currentParticipant.unread_count || 0) === 0) {
      return false;
    }
    if (activeFilter === 'product' && c.conversation.context_type !== 'product') {
      return false;
    }
    if (activeFilter === 'store' && c.conversation.context_type !== 'store') {
      return false;
    }
    if (activeFilter === 'accommodation' && c.conversation.context_type !== 'accommodation') {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const otherName = c.otherParticipant?.profile?.full_name?.toLowerCase() || '';
      const otherUsername = c.otherParticipant?.profile?.username?.toLowerCase() || '';
      const contextTitle = c.contextDetails?.title?.toLowerCase() || '';
      const lastMsgBody = c.lastMessage?.body?.toLowerCase() || '';

      return (
        otherName.includes(q) ||
        otherUsername.includes(q) ||
        contextTitle.includes(q) ||
        lastMsgBody.includes(q)
      );
    }

    return true;
  });

  // Format relative timestamp
  const formatTimestamp = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Campus Chat & Messages</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Sign in to your KibabiiMart student account to chat with sellers, negotiate prices, and receive deal updates.
        </p>
        <Button 
          onClick={() => navigate('/login')}
          className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-xl shadow-md cursor-pointer"
        >
          Sign In to Access Messages
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 md:py-6">
      {/* Top Banner with Total Unread & Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Messages & Inquiries
            {globalUnreadCount > 0 && (
              <Badge className="bg-primary text-white font-bold text-xs px-2 py-0.5 rounded-full">
                {globalUnreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Real-time chat with fellow Kibabii students, campus stores, and service desks
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadConversations(false)}
          disabled={refreshing}
          className="text-xs font-semibold gap-1.5 h-8 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Main Container: Split View on Desktop, List View on Mobile */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh] min-h-[500px]">
        
        {/* LEFT PANEL: CONVERSATION LIST */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col h-full shrink-0 bg-white ${
          selectedConvId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats or listings..."
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl focus-visible:bg-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${conversations.filter(c => (c.currentParticipant.unread_count || 0) > 0).length})` },
                { id: 'product', label: 'Items' },
                { id: 'store', label: 'Stores' },
                { id: 'accommodation', label: 'Hostels' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400">Loading your inbox...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No conversations found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {searchQuery 
                    ? 'No conversations match your search criteria.' 
                    : activeFilter === 'unread'
                    ? 'You have caught up with all your messages!'
                    : 'Start by messaging sellers on items you want to buy.'}
                </p>
                <Button 
                  onClick={() => navigate('/products')}
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Explore Marketplace
                </Button>
              </div>
            ) : (
              filteredConversations.map((item) => {
                const isSelected = selectedConvId === item.conversation.id;
                const otherProfile = item.otherParticipant?.profile;
                const otherName = otherProfile?.full_name || otherProfile?.username || 'Kibabii Student';
                const unread = item.currentParticipant.unread_count || 0;
                const isMuted = item.currentParticipant.is_muted;
                const lastMsg = item.lastMessage;
                const context = item.contextDetails;

                // Format message snippet
                let snippet = 'No messages yet';
                if (lastMsg) {
                  if (lastMsg.is_deleted) {
                    snippet = '🚫 Message was deleted';
                  } else if (lastMsg.message_type === 'image') {
                    snippet = '📷 Sent a photo';
                  } else if (lastMsg.message_type === 'offer') {
                    snippet = `${lastMsg.body}`;
                  } else {
                    snippet = lastMsg.body;
                  }
                }

                const timestamp = formatTimestamp(
                  lastMsg?.created_at || item.conversation.last_message_at || item.conversation.created_at
                );

                return (
                  <div
                    key={item.conversation.id}
                    onClick={() => handleSelectConversation(item.conversation.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative hover:bg-slate-50 ${
                      isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    } ${unread > 0 ? 'bg-amber-50/40 font-medium' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 border border-slate-200">
                        <AvatarImage src={otherProfile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {otherName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherProfile?.is_verified && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-1 ring-white">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={`text-xs md:text-sm truncate ${
                            unread > 0 ? 'font-black text-slate-950' : 'font-bold text-slate-800'
                          }`}>
                            {otherName}
                          </h4>
                          {isMuted && (
                            <span title="Muted">
                              <BellOff className="w-3 h-3 text-slate-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {timestamp}
                        </span>
                      </div>

                      {/* Context badge if listing attached */}
                      {context && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                            {context.type}
                          </span>
                          <span className="text-[11px] text-slate-700 truncate font-semibold">
                            {context.title}
                          </span>
                        </div>
                      )}

                      {/* Message preview snippet */}
                      <p className={`text-xs truncate ${
                        unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500'
                      }`}>
                        {snippet}
                      </p>
                    </div>

                    {/* Unread Count Badge */}
                    {unread > 0 && (
                      <span className="shrink-0 bg-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center self-center shadow-xs">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT THREAD (DESKTOP) OR EMPTY SELECTION */}
        <div className="flex-1 h-full flex flex-col bg-slate-50/50">
          {selectedConvId ? (
            <ChatThread 
              conversationIdOrUserId={selectedConvId}
              initialContextDetails={conversations.find(c => c.conversation.id === selectedConvId)?.contextDetails}
              initialOtherParticipant={conversations.find(c => c.conversation.id === selectedConvId)?.otherParticipant?.profile}
              onBack={() => {
                setSelectedConvId(null);
                setSearchParams({});
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Select a conversation
              </h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                Choose a chat from the left panel to message sellers, negotiate student discounts, or arrange safe campus handovers.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={() => navigate('/products')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-bold"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Browse Marketplace
                </Button>
                <Button 
                  onClick={() => navigate('/stores')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-bold"
                >
                  <Store className="w-3.5 h-3.5 text-secondary" /> Campus Stores
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
