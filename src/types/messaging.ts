export type ConversationContextType = 'general' | 'product' | 'service' | 'accommodation' | 'store';

export type MessageType = 'text' | 'image' | 'offer' | 'system';

export interface Conversation {
  id: string;
  context_type: ConversationContextType;
  context_id: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  unread_count: number;
  last_read_at: string;
  is_muted: boolean;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    phone?: string | null;
    role: string | null;
    is_verified?: boolean;
    student_id?: string | null;
  };
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  message_type: MessageType;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  attachments?: MessageAttachment[];
  sender?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface ConversationContextDetails {
  type: ConversationContextType;
  id: string | null;
  title?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  location?: string;
  ownerId?: string;
}

export interface EnrichedConversation {
  conversation: Conversation;
  currentParticipant: ConversationParticipant;
  otherParticipant?: ConversationParticipant;
  lastMessage?: Message;
  contextDetails?: ConversationContextDetails;
}
