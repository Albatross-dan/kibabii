import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Trash2, 
  MoreVertical, 
  BellOff, 
  Bell, 
  ExternalLink, 
  Tag, 
  ShieldCheck, 
  User, 
  Phone, 
  X, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messagingService';
import { 
  Message, 
  EnrichedConversation, 
  ConversationContextDetails,
  MessageType 
} from '@/types/messaging';
import { useMessageStore } from '@/store/messageStore';

const EMPTY_MESSAGES: Message[] = [];

interface ChatThreadProps {
  conversationIdOrUserId: string;
  onBack?: () => void;
  initialContextDetails?: ConversationContextDetails;
  initialOtherParticipant?: any;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversationIdOrUserId,
  onBack,
  initialContextDetails,
  initialOtherParticipant
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Read cached conversation and messages without creating unstable selector snapshots
  const storeConv = useMemo(() => {
    return useMessageStore.getState().conversations.find(
      (c) =>
        c.conversation.id === conversationIdOrUserId ||
        c.otherParticipant?.user_id === conversationIdOrUserId
    );
  }, [conversationIdOrUserId]);

  const resolvedInitialId = storeConv?.conversation.id || conversationIdOrUserId;
  const storeMessages = useMemo(() => {
    return useMessageStore.getState().messagesByConvId[resolvedInitialId] || EMPTY_MESSAGES;
  }, [resolvedInitialId]);

  // States
  const [actualConvId, setActualConvId] = useState<string>(resolvedInitialId);
  const [conversation, setConversation] = useState<EnrichedConversation | null>(() => {
    if (storeConv) return storeConv;
    if (initialContextDetails || initialOtherParticipant) {
      return {
        conversation: {
          id: resolvedInitialId,
          context_type: initialContextDetails?.type || 'product',
          context_id: initialContextDetails?.id || null,
          last_message_at: new Date().toISOString(),
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        currentParticipant: {
          id: `part_${user?.id || 'me'}`,
          conversation_id: resolvedInitialId,
          user_id: user?.id || 'me',
          unread_count: 0,
          last_read_at: new Date().toISOString(),
          is_muted: false,
          created_at: new Date().toISOString(),
          profile: {
            id: user?.id || 'me',
            full_name: user?.user_metadata?.full_name || 'Me',
            username: 'me',
            avatar_url: user?.user_metadata?.avatar_url || null,
            role: 'buyer'
          }
        },
        otherParticipant: initialOtherParticipant
          ? {
              id: `part_${initialOtherParticipant.id || 'other'}`,
              conversation_id: resolvedInitialId,
              user_id: initialOtherParticipant.id || 'other',
              unread_count: 0,
              last_read_at: null,
              is_muted: false,
              created_at: new Date().toISOString(),
              profile: initialOtherParticipant
            }
          : undefined,
        contextDetails: initialContextDetails
      };
    }
    return null;
  });

  const [messages, setMessages] = useState<Message[]>(storeMessages);
  const [inputText, setInputText] = useState('');
  // Loading is only true if we have no conversation AND no initialContextDetails
  const [loading, setLoading] = useState<boolean>(!storeConv && !initialContextDetails && !initialOtherParticipant);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState<string>('');

  // Delete message modal state
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  // Quick Campus Chips
  const quickChips = [
    'Is this still available?',
    'What is your best cash price?',
    'Can we meet at Gate B / Student Centre?',
    'Can I inspect it today?'
  ];

  // 1. Resolve conversation ID (in case a user ID was passed in legacy route)
  useEffect(() => {
    let isMounted = true;

    async function initConversation() {
      if (!user) return;
      if (!conversation && !storeConv) {
        setLoading(true);
      }

      try {
        let convId = conversationIdOrUserId;

        // Check if conversationIdOrUserId is a conversation or another user's ID
        let conv = await messagingService.fetchConversation(convId, user.id);

        if (!conv) {
          // It might be a userId! Try to start/get conversation with this other user
          try {
            convId = await messagingService.startOrGetConversation(
              initialContextDetails?.type || 'general',
              initialContextDetails?.id || null,
              conversationIdOrUserId,
              user.id
            );
            conv = await messagingService.fetchConversation(convId, user.id);
          } catch (rpcErr) {
            console.warn('Could not resolve as user ID:', rpcErr);
          }
        }

        if (!isMounted) return;

        if (conv) {
          setActualConvId(convId);
          setConversation(conv);
          useMessageStore.getState().setActiveConversationId(convId);
          useMessageStore.getState().upsertConversation(conv);

          // Fetch messages
          const fetchedMessages = await messagingService.fetchMessages(convId);
          if (isMounted) {
            setMessages(fetchedMessages);
            useMessageStore.getState().setConversationMessages(convId, fetchedMessages);
            // Mark conversation as read immediately
            await messagingService.markConversationAsRead(convId, user.id);
            useMessageStore.getState().markConversationReadInStore(convId);
          }
        } else if (!conversation) {
          toast.error('Conversation could not be loaded.');
        }
      } catch (err: any) {
        console.error('Error loading chat:', err);
        if (!conversation) {
          toast.error('Failed to load conversation thread.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initConversation();

    return () => {
      isMounted = false;
      useMessageStore.getState().setActiveConversationId(null);
    };
  }, [conversationIdOrUserId, user?.id]);

  // 2. Realtime subscription for conversation messages
  useEffect(() => {
    if (!actualConvId || !user) return;

    const channelName = `conversation:${actualConvId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${actualConvId}`
        },
        async (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;

          // Fetch full message with sender & attachments
          try {
            let msgData: any = null;
            const { data: fullMsg, error: msgError } = await supabase
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
              .eq('id', newRow.id)
              .maybeSingle();

            if (!msgError && fullMsg) {
              msgData = fullMsg;
            } else {
              const { data: simpleMsg } = await supabase
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
                .eq('id', newRow.id)
                .maybeSingle();
              if (simpleMsg) {
                msgData = simpleMsg;
              }
            }

            if (msgData) {
              let rawSender = msgData.public_profiles || msgData.sender;
              if (!rawSender && msgData.sender_id) {
                const { data: senderProf } = await supabase
                  .from('public_profiles')
                  .select('id, full_name, username, avatar_url')
                  .eq('id', msgData.sender_id)
                  .maybeSingle();
                rawSender = senderProf;
              }

              const senderObj = Array.isArray(rawSender) ? rawSender[0] : rawSender;
              const formatted: Message = {
                id: msgData.id,
                conversation_id: msgData.conversation_id,
                sender_id: msgData.sender_id,
                body: msgData.body,
                message_type: msgData.message_type,
                is_deleted: !!msgData.is_deleted,
                created_at: msgData.created_at,
                updated_at: msgData.updated_at,
                sender: senderObj || undefined,
                attachments: msgData.attachments || []
              };

              setMessages(prev => {
                if (prev.some(m => m.id === formatted.id)) return prev;
                return [...prev, formatted];
              });

              // Mark as read if message is from the other user
              if (newRow.sender_id !== user.id) {
                await messagingService.markConversationAsRead(actualConvId, user.id);
                useMessageStore.getState().markConversationReadInStore(actualConvId);
              }
            }
          } catch (err) {
            console.warn('Failed to parse realtime message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${actualConvId}`
        },
        (payload: any) => {
          const updatedRow = payload.new;
          if (!updatedRow) return;

          setMessages(prev =>
            prev.map(m => {
              if (m.id === updatedRow.id) {
                return {
                  ...m,
                  body: updatedRow.body,
                  is_deleted: !!updatedRow.is_deleted,
                  updated_at: updatedRow.updated_at
                };
              }
              return m;
            })
          );
        }
      )
      .subscribe();

    const handleLocalMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.conversationId === actualConvId && customEvent.detail?.message) {
        const msg: Message = customEvent.detail.message;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };
    window.addEventListener('kibabiimart-message-sent', handleLocalMessage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('kibabiimart-message-sent', handleLocalMessage);
    };
  }, [actualConvId, user?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, imagePreviewUrl]);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send message
  const handleSendMessage = async (customBody?: string, customType?: MessageType) => {
    const textToSend = (customBody !== undefined ? customBody : inputText).trim();

    if (!textToSend && !selectedImage) {
      return;
    }

    if (!user || !actualConvId) {
      toast.error('You must be signed in to send messages.');
      return;
    }

    setSending(true);
    try {
      const type: MessageType = customType || (selectedImage && !textToSend ? 'image' : 'text');
      const files = selectedImage ? [selectedImage] : undefined;

      const newMsg = await messagingService.sendMessage({
        conversationId: actualConvId,
        senderId: user.id,
        body: textToSend || (type === 'image' ? 'Sent an image' : ''),
        messageType: type,
        files
      });

      // Optimistic append if not already in state
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, {
          ...newMsg,
          sender: {
            id: user.id,
            full_name: conversation?.currentParticipant?.profile?.full_name || 'Me',
            username: conversation?.currentParticipant?.profile?.username || 'me',
            avatar_url: conversation?.currentParticipant?.profile?.avatar_url || null
          }
        }];
      });

      // Clear inputs
      setInputText('');
      removeSelectedImage();
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Send Offer
  const handleSendOffer = async () => {
    const num = parseFloat(offerAmount);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }

    const offerText = `🏷️ Price Offer: KSh ${num.toLocaleString()}`;
    await handleSendMessage(offerText, 'offer');
    setIsOfferModalOpen(false);
    setOfferAmount('');
    toast.success(`Offer of KSh ${num.toLocaleString()} sent!`);
  };

  // Soft-delete message
  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete || !user) return;
    try {
      await messagingService.softDeleteMessage(messageToDelete.id, user.id);
      setMessages(prev =>
        prev.map(m => m.id === messageToDelete.id ? { ...m, is_deleted: true } : m)
      );
      toast.success('Message deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete message');
    } finally {
      setMessageToDelete(null);
    }
  };

  // Toggle mute
  const handleToggleMute = async () => {
    if (!conversation || !user || !actualConvId) return;
    const currentMuted = conversation.currentParticipant.is_muted;
    try {
      await messagingService.toggleMuteConversation(actualConvId, user.id, !currentMuted);
      setConversation(prev => prev ? {
        ...prev,
        currentParticipant: {
          ...prev.currentParticipant,
          is_muted: !currentMuted
        }
      } : null);
      toast.success(!currentMuted ? 'Conversation notifications muted' : 'Conversation unmuted');
    } catch (err: any) {
      toast.error('Failed to toggle mute state');
    }
  };

  const otherProfile = conversation?.otherParticipant?.profile;
  const otherName = otherProfile?.full_name || otherProfile?.username || 'Kibabii Student';
  const otherPhone = otherProfile?.phone;
  const isMuted = conversation?.currentParticipant.is_muted;
  const contextDetails = conversation?.contextDetails || initialContextDetails;

  if (loading && !conversation) {
    return (
      <div className="flex flex-col h-full bg-white relative overflow-hidden animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            {onBack && <div className="w-8 h-8 rounded-lg bg-slate-100" />}
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="space-y-1.5">
              <div className="w-28 h-3.5 bg-slate-200 rounded" />
              <div className="w-16 h-2.5 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100" />
            <div className="w-8 h-8 rounded-lg bg-slate-100" />
          </div>
        </div>

        {/* Context banner if provided */}
        {initialContextDetails && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {initialContextDetails.imageUrl ? (
                <img
                  src={initialContextDetails.imageUrl}
                  alt={initialContextDetails.title}
                  className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-slate-200" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{initialContextDetails.title}</p>
                <p className="text-xs font-extrabold text-primary">KSh {initialContextDetails.price?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton Messages */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start">
            <div className="w-48 h-10 bg-slate-100 rounded-2xl rounded-tl-sm" />
          </div>
          <div className="flex justify-end">
            <div className="w-40 h-10 bg-primary/10 rounded-2xl rounded-tr-sm" />
          </div>
          <div className="flex justify-start">
            <div className="w-56 h-12 bg-slate-100 rounded-2xl rounded-tl-sm" />
          </div>
        </div>

        {/* Skeleton Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-slate-100" />
          <div className="flex-1 h-10 rounded-xl bg-slate-100" />
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!conversation && !loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">Conversation Not Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          This conversation may have been archived or you do not have permission to view it.
        </p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Messages
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden overscroll-none">
      {/* 1. TOP HEADER BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="md:hidden h-9 w-9 -ml-1 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={otherProfile?.avatar_url || ''} alt={otherName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {otherName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {otherProfile?.is_verified && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white">
                <ShieldCheck className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-slate-900 text-sm md:text-base truncate">
                {otherName}
              </h2>
              {isMuted && (
                <span title="Muted">
                  <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {otherProfile?.role && (
                <span className="capitalize font-medium text-slate-600">
                  {otherProfile.role === 'store' ? 'Official Campus Store' : 'Student Trader'}
                </span>
              )}
              <span>•</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active on KibabiiMart
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {otherPhone && (
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-primary h-9 w-9 rounded-full cursor-pointer"
              onClick={() => {
                const cleanPhone = otherPhone.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${cleanPhone}`, '_blank');
              }}
              title="Open WhatsApp"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 rounded-full cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleToggleMute} className="gap-2 cursor-pointer">
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span>Unmute Notifications</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-slate-600" />
                    <span>Mute Notifications</span>
                  </>
                )}
              </DropdownMenuItem>

              {contextDetails?.id && (
                <DropdownMenuItem 
                  onClick={() => navigate(`/products/${contextDetails.id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  <span>View Product Listing</span>
                </DropdownMenuItem>
              )}

              {otherProfile?.id && (
                <DropdownMenuItem 
                  onClick={() => navigate(`/profile/${otherProfile.id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>View Profile & Reviews</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => toast.info('Chat reported to Kibabii Admin Desk for review')}
                className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Report Conversation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. CONTEXT BANNER (e.g. Product Info) */}
      {contextDetails && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {contextDetails.imageUrl ? (
              <img 
                src={contextDetails.imageUrl} 
                alt={contextDetails.title || 'Product'} 
                className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {contextDetails.type}
                </span>
                <p className="text-xs md:text-sm font-semibold text-slate-800 truncate">
                  {contextDetails.title || 'Campus Listing'}
                </p>
              </div>
              {contextDetails.price !== undefined && (
                <p className="text-xs font-black text-secondary mt-0.5">
                  KSh {Number(contextDetails.price).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {contextDetails.type === 'product' && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold border-secondary/30 text-secondary hover:bg-secondary/10 cursor-pointer"
                onClick={() => {
                  setOfferAmount(contextDetails.price ? String(contextDetails.price) : '');
                  setIsOfferModalOpen(true);
                }}
              >
                <Tag className="w-3 h-3 mr-1" /> Make Offer
              </Button>
            )}

            {contextDetails.id && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer px-2"
                onClick={() => navigate(`/products/${contextDetails.id}`)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. MESSAGES SCROLL CONTAINER */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 overscroll-contain"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* Safety / Escrow Advisory Banner */}
        <div className="max-w-md mx-auto bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Campus Safety Reminder</p>
            <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
              Always inspect physical items in public campus areas (e.g. Student Centre, Gate B, or Library foyer). Use KibabiiMart Escrow for secure payment protection.
            </p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-medium">No messages yet. Send a friendly message or offer to start chatting!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === user?.id;
            const msgTime = new Date(msg.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            // Date group divider logic
            const showDateHeader = index === 0 || 
              new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
            const dateLabel = new Date(msg.created_at).toLocaleDateString([], { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });

            // System message rendering
            if (msg.message_type === 'system') {
              return (
                <React.Fragment key={msg.id}>
                  {showDateHeader && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full uppercase tracking-wider">
                        {dateLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center my-2">
                    <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200/90 shadow-2xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      {msg.body}
                    </span>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full uppercase tracking-wider">
                      {dateLabel}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <Avatar className="h-7 w-7 mb-1 shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || otherProfile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {otherName.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-2xs leading-relaxed transition-all ${
                        msg.is_deleted
                          ? 'bg-slate-100 text-slate-400 italic border border-slate-200/80 rounded-bl-sm'
                          : isMine
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm'
                      }`}
                    >
                      {msg.is_deleted ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>This message was deleted</span>
                        </div>
                      ) : (
                        <>
                          {/* Offer Message Card */}
                          {msg.message_type === 'offer' && (
                            <div className="mb-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Official Price Offer</span>
                              </div>
                              <p className="font-extrabold text-sm text-slate-900">{msg.body}</p>
                              {!isMine && (
                                <div className="pt-2 flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 rounded-lg cursor-pointer"
                                    onClick={() => handleSendMessage(`I accept your offer of ${msg.body.replace('🏷️ Price Offer: ', '')}! Let's arrange pickup.`, 'text')}
                                  >
                                    Accept Offer
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-xs bg-white text-slate-700 font-bold px-3 rounded-lg cursor-pointer"
                                    onClick={() => {
                                      setIsOfferModalOpen(true);
                                    }}
                                  >
                                    Counter
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Image Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2 mb-2">
                              {msg.attachments.map(att => (
                                <div 
                                  key={att.id}
                                  className="relative group/img overflow-hidden rounded-xl cursor-pointer"
                                  onClick={() => setPreviewZoomImage(att.file_url)}
                                >
                                  <img 
                                    src={att.file_url} 
                                    alt="Chat attachment" 
                                    className="max-h-60 rounded-xl object-cover hover:scale-102 transition-transform duration-200"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text Body */}
                          {msg.message_type !== 'offer' && (
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          )}
                        </>
                      )}

                      {/* Message Footer: Time + Options */}
                      <div 
                        className={`flex items-center gap-1 mt-1 text-[10px] ${
                          isMine ? 'text-white/70 justify-end' : 'text-slate-400 justify-start'
                        }`}
                      >
                        <span>{msgTime}</span>
                      </div>
                    </div>

                    {/* Sender message hover controls (Soft-delete) */}
                    {isMine && !msg.is_deleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 mr-1">
                        <button
                          onClick={() => setMessageToDelete(msg)}
                          className="text-slate-400 hover:text-rose-500 text-[11px] p-1 rounded transition-colors cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. QUICK REPLIES BAR */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
          Quick:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip, 'text')}
            className="text-xs bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200/60 cursor-pointer shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 5. ATTACHMENT PREVIEW DRAWER */}
      {imagePreviewUrl && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={imagePreviewUrl} 
                alt="Upload preview" 
                className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-2xs"
              />
              <button 
                onClick={removeSelectedImage}
                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{selectedImage?.name}</p>
              <p className="text-[10px] text-slate-500">Ready to send with message</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={sending}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold h-8 px-3 rounded-lg"
          >
            Send Image
          </Button>
        </div>
      )}

      {/* 6. INPUT BAR */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden" 
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-500 hover:text-primary h-10 w-10 shrink-0 rounded-full cursor-pointer"
            title="Attach Image"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          {/* Text Input */}
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${otherName}...`}
            className="flex-1 h-10 bg-slate-100 border-none rounded-full px-4 text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-white transition-all"
            disabled={sending}
          />

          {/* Send Button */}
          <Button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || sending}
            className="bg-primary hover:bg-primary/95 text-white h-10 w-10 p-0 rounded-full shrink-0 shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* 7. MAKE OFFER DIALOG */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Tag className="w-5 h-5 text-secondary" />
              Make an Offer to {otherName}
            </DialogTitle>
            <DialogDescription>
              Propose your cash price for {contextDetails?.title || 'this listing'}. The seller can accept or counter your offer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {contextDetails?.price && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Original Listed Price</span>
                <span className="text-sm font-black text-slate-900">
                  KSh {Number(contextDetails.price).toLocaleString()}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Offer Amount (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  KSh
                </span>
                <Input 
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="pl-12 h-11 text-base font-bold"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Discount Percentages */}
            {contextDetails?.price && (
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20].map((pct) => {
                  const discounted = Math.round(Number(contextDetails.price) * (1 - pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setOfferAmount(String(discounted))}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-secondary/10 hover:text-secondary rounded-lg text-xs font-bold text-slate-600 transition-colors border border-slate-200 cursor-pointer"
                    >
                      -{pct}%
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsOfferModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendOffer}
              disabled={!offerAmount || parseFloat(offerAmount) <= 0}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold cursor-pointer"
            >
              Send Official Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. CONFIRM SOFT-DELETE MESSAGE DIALOG */}
      <Dialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Delete Message?</DialogTitle>
            <DialogDescription>
              This will replace the message content with "This message was deleted" for everyone in the conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMessageToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteMessage}>
              Delete for Everyone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. IMAGE ZOOM LIGHTBOX */}
      <Dialog open={!!previewZoomImage} onOpenChange={(open) => !open && setPreviewZoomImage(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black/90 border-none overflow-hidden text-white">
          <div className="relative flex items-center justify-center p-4">
            {previewZoomImage && (
              <img 
                src={previewZoomImage} 
                alt="Enlarged chat image" 
                className="max-h-[80vh] w-auto rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            )}
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
