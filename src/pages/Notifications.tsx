import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ArrowLeft, 
  Tag, 
  MessageSquare, 
  Info, 
  AlertCircle,
  Clock,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface CampusNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'message' | 'promo' | 'system' | 'order';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'n-1',
    title: '✅ Listing Approved Successfully',
    message: 'Your study table listing draft has been verified by the Student Administration Desk. It is now live in the Furniture category!',
    type: 'system',
    timestamp: '2 hours ago',
    isRead: false,
    link: '/products'
  },
  {
    id: 'n-2',
    title: '🔥 Hot Deal Price Drop!',
    message: 'HP EliteBook 840 G5 Laptop you saved in your wishlist dropped price to KSh 30,500 for the mid-semester sale.',
    type: 'promo',
    timestamp: '5 hours ago',
    isRead: false,
    link: '/wishlist'
  },
  {
    id: 'n-3',
    title: '💬 New Message from Josphat',
    message: '"Is the study desk still available for pick up near Gate B? I am very interested."',
    type: 'message',
    timestamp: '1 day ago',
    isRead: true,
    link: '/messages'
  },
  {
    id: 'n-4',
    title: '📦 Order Confirmation',
    message: 'Your Escrow Payment of KSh 6,800 has been securely logged. The funds are held safely until you confirm delivery.',
    type: 'order',
    timestamp: '2 days ago',
    isRead: true,
    link: '/orders'
  }
];

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CampusNotification[]>(() => {
    const local = localStorage.getItem('kb-notifications');
    if (local) {
      try { return JSON.parse(local); } catch { return INITIAL_NOTIFICATIONS; }
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('kb-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Fetch live notifications from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchUserNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: CampusNotification[] = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.body || n.message || '',
            type: n.type === 'new_message' ? 'message' : (n.type || 'system'),
            timestamp: new Date(n.created_at).toLocaleDateString([], { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isRead: !!n.is_read,
            link: n.link_url || n.link || undefined
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch notifications:', err);
      }
    };
    fetchUserNotifications();
  }, [user]);

  // Realtime channel subscriptions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const raw = payload.new;
          const translated: CampusNotification = {
            id: raw.id,
            title: raw.title || '🔔 Notice update',
            message: raw.body || raw.message || '',
            type: raw.type === 'new_message' ? 'message' : (raw.type || 'system'),
            timestamp: 'Just now',
            isRead: false,
            link: raw.link_url || raw.link || undefined
          };
          setNotifications(prev => [translated, ...prev]);
          toast.info(`🔔 ${raw.title || 'New notification'}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read!');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.info('Notifications cleared.');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.info('Notification deleted.');
  };

  const getNotificationIcon = (type: CampusNotification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-sky-500" />;
      case 'promo':
        return <Tag className="h-5 w-5 text-amber-500" />;
      case 'order':
        return <ShoppingBag className="h-5 w-5 text-emerald-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-indigo-500" />;
    }
  };

  const getUnreadCount = () => notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900">Notifications</h1>
              {getUnreadCount() > 0 && (
                <Badge variant="secondary" className="bg-primary text-white font-extrabold px-3 py-0.5 rounded-full text-xs">
                  {getUnreadCount()} New
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Stay updated with transactions, wishlist price drops, and seller direct messages.</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 self-stretch sm:self-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-slate-700 h-9 rounded-xl flex items-center gap-1.5 font-bold flex-1 sm:flex-initial"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllNotifications}
              className="text-xs text-slate-500 h-9 rounded-xl flex items-center gap-1.5 hover:text-red-600 hover:bg-red-50 font-bold flex-1 sm:flex-initial"
            >
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-dashed">
          <div className="p-6 bg-slate-50 rounded-full text-slate-400">
            <Bell className="h-12 w-12 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">No Notifications Yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              We'll message you here when someone buys your product, contacts you, or triggers a seller event.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 rounded-full text-xs">
            <Link to="/products">Explore Listings</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`border transition-all rounded-2xl overflow-hidden cursor-pointer ${
                notification.isRead 
                  ? 'bg-white border-slate-100 hover:bg-slate-50/50' 
                  : 'bg-indigo-50/15 border-indigo-100/70 hover:bg-indigo-50/20 shadow-sm'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex gap-4 sm:gap-5 items-start">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  notification.isRead ? 'bg-slate-50 text-slate-500' : 'bg-white text-primary shadow-sm border border-slate-100'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className={`text-sm tracking-tight ${notification.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold shrink-0">
                      <Clock className="h-3 w-3" /> {notification.timestamp}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {notification.message}
                  </p>
                  
                  {notification.link && (
                    <div className="pt-1.5">
                      <Button asChild size="sm" variant="link" className="p-0 h-auto text-xs text-primary font-black flex items-center gap-1 hover:no-underline">
                        <Link to={notification.link}>
                          View Details &rarr;
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-center self-stretch">
                  {!notification.isRead && (
                    <span className="h-2 w-2 bg-indigo-650 rounded-full animate-ping"></span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg self-end mt-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
