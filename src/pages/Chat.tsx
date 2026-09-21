import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChatThread } from '@/components/chat/ChatThread';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationContextDetails } from '@/types/messaging';

export default function Chat() {
  const { userId, conversationId, id } = useParams<{ 
    userId?: string; 
    conversationId?: string; 
    id?: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    contextDetails?: ConversationContextDetails;
    otherParticipant?: any;
  } | undefined;

  const { user, isLoading } = useAuth();

  const targetId = id || conversationId || userId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
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
        <h2 className="text-xl font-black text-slate-900">Sign in to Chat</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          You must be logged in to KibabiiMart to view or reply to messages.
        </p>
        <Button 
          onClick={() => navigate('/login')}
          className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-xl shadow-md cursor-pointer"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (!targetId) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Invalid Chat Link</h2>
        <p className="text-sm text-slate-500">No conversation or recipient ID was specified.</p>
        <Button onClick={() => navigate('/messages')} className="cursor-pointer">
          Go to Messages Inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden h-full flex flex-col shrink-0">
        <ChatThread
          conversationIdOrUserId={targetId}
          onBack={() => navigate('/messages')}
          initialContextDetails={locationState?.contextDetails}
          initialOtherParticipant={locationState?.otherParticipant}
        />
      </div>
    </div>
  );
}
