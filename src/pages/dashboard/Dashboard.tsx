import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Star, 
  Settings, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Store,
  DollarSign,
  Package,
  Eye,
  Heart,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { messagingService } from '@/services/messagingService';
import { listingService } from '@/services/listingService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const isStore = profile?.account_type === 'store' || profile?.role === 'store' || profile?.role === 'shop_owner' || profile?.is_store === true;
  const displayName = profile?.store_name || profile?.full_name || user?.user_metadata?.full_name || 'Comrade';
  const avatarUrl = profile?.avatar_url || '';

  // Real database states
  const [activeItemsCount, setActiveItemsCount] = useState<number>(0);
  const [totalCatalogValue, setTotalCatalogValue] = useState<number>(0);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{ name: string; sales: number }[]>([
    { name: 'Mon', sales: 0 },
    { name: 'Tue', sales: 0 },
    { name: 'Wed', sales: 0 },
    { name: 'Thu', sales: 0 },
    { name: 'Fri', sales: 0 },
    { name: 'Sat', sales: 0 },
    { name: 'Sun', sales: 0 },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!user?.id) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);

        // 1. Fetch user's active listings and calculate actual catalog value
        const myListings = await listingService.getMyListings(null, null);
        const activeListings = (myListings || []).filter((l: any) => l.status === 'active');
        const totalVal = activeListings.reduce((sum: number, item: any) => {
          const p = item.price || item.product_details?.price || item.product_price || 0;
          return sum + Number(p);
        }, 0);

        if (isMounted) {
          setActiveItemsCount(activeListings.length);
          setTotalCatalogValue(totalVal);
        }

        // 2. Fetch real conversations for inquiries
        const convs = await messagingService.fetchConversations(user.id);
        if (isMounted) {
          setInquiries(convs.slice(0, 5));
          setInquiriesCount(convs.length);
        }

        // 3. Fetch real orders
        const { data: orderRows } = await supabase
          .from('orders')
          .select('*, buyer:public_profiles(*)')
          .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (isMounted && orderRows) {
          setOrders(orderRows);
        }

        // 4. Calculate day velocity from real listings created
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        (myListings || []).forEach((item: any) => {
          if (item.created_at) {
            const d = new Date(item.created_at);
            const dayName = days[d.getDay()];
            if (counts[dayName] !== undefined) {
              const val = item.price || item.product_details?.price || 1;
              counts[dayName] += Number(val);
            }
          }
        });

        if (isMounted) {
          const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({
            name,
            sales: counts[name] || 0
          }));
          setWeeklyData(chartDays);
        }
      } catch (err) {
        console.warn('Could not load real dashboard metrics:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const quickActions = [
    { title: 'New Post', icon: Plus, path: '/dashboard/listings/new', color: 'bg-primary text-white shadow-primary/20 shadow-md', primary: true },
    { title: 'My Listings', icon: ShoppingBag, path: '/dashboard/listings', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
    { title: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { title: 'Messages', icon: MessageSquare, path: '/messages', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { title: 'Billing', icon: DollarSign, path: '/dashboard/settings', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 text-left antialiased max-w-full overflow-hidden">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:scale-100 rounded-2xl border-2 border-primary/40 shrink-0 shadow">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary font-black text-lg">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                  {displayName}
                </h1>
                <Badge className={`${isStore ? 'bg-amber-500' : 'bg-primary'} text-white font-mono text-[9px] uppercase tracking-wider py-0.5 px-2`}>
                  {isStore ? 'Store Pro' : 'Student Seller'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                Kibabii University Marketplace Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm h-10 sm:h-11 px-5 rounded-xl shadow-md shadow-primary/25 shrink-0">
              <Link to="/dashboard/listings/new">
                <Plus className="mr-1.5 h-4 w-4 stroke-[3]" /> Add New Listing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons (Optimized for Mobile Touch) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.path}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all text-center group active:scale-95 border border-transparent ${
                action.primary 
                  ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center mb-1 sm:mb-1.5 transition-transform group-hover:scale-110 ${
                action.primary ? 'bg-white/20 text-white' : action.color
              }`}>
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <span className={`text-[10px] sm:text-xs font-extrabold tracking-tight truncate max-w-full ${
                action.primary ? 'text-white' : 'text-slate-700'
              }`}>
                {action.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* KPI Stats Cards - Real Supabase Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { 
            label: 'Total Volume', 
            value: formatPrice(totalCatalogValue), 
            change: activeItemsCount > 0 ? 'Catalog Value' : 'No Active Items', 
            sub: 'active listings', 
            icon: DollarSign, 
            color: 'text-primary' 
          },
          { 
            label: 'Active Items', 
            value: String(activeItemsCount), 
            change: activeItemsCount > 0 ? 'Live in catalog' : 'Start listing', 
            sub: 'on campus', 
            icon: Package, 
            color: 'text-indigo-600' 
          },
          { 
            label: 'Inquiries', 
            value: String(inquiriesCount), 
            change: inquiriesCount > 0 ? 'Comrade leads' : '0 leads', 
            sub: 'conversations', 
            icon: MessageSquare, 
            color: 'text-emerald-600' 
          },
          { 
            label: 'Store Rating', 
            value: profile?.seller_rating ? `${Number(profile.seller_rating).toFixed(1)} ★` : 'New ★', 
            change: profile?.total_reviews ? `${profile.total_reviews} reviews` : 'Verified', 
            sub: 'student trust', 
            icon: Star, 
            color: 'text-amber-500' 
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden text-left p-3.5 sm:p-5 space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <stat.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className={`text-base sm:text-2xl font-black ${stat.color} font-mono leading-tight truncate`}>
              {stat.value}
            </h3>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium">
              <span className="text-emerald-600 font-bold">{stat.change}</span>
              <span className="text-slate-400 truncate hidden xs:inline">{stat.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Trends Chart */}
      <Card className="rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-black text-slate-900">
                Listing Velocity & Value
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Weekly distribution of your listings across Kibabii marketplace
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700">
              Live Database
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-2">
          <div className="h-[190px] sm:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} stroke="#94A3B8" axisLine={false} tickLine={false} tickFormatter={(val) => `K${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 700
                  }} 
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Listing Value']}
                />
                <Area type="monotone" dataKey="sales" stroke="#E63946" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dual Column Content on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders Card */}
        <Card className="rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden text-left">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Incoming Orders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary text-xs font-extrabold h-8 px-2 hover:bg-primary/10">
              <Link to="/dashboard/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-2">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors rounded-xl gap-2 min-w-0 border border-slate-100/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-xs">
                      #{order.id.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">{order.title || 'Order Item'}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        Buyer: {order.buyer?.full_name || 'Comrade'} &bull; <span className="font-mono text-slate-700 font-bold">KES {Number(order.total_amount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {order.status || 'Pending'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No incoming orders yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  When students place orders on your campus listings, they will appear here in real time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Inquiries / Messages Card */}
        <Card className="rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden text-left">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Active Inquiries
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary text-xs font-extrabold h-8 px-2 hover:bg-primary/10">
              <Link to="/messages">Open Chat</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-2">
            {inquiries.length > 0 ? (
              inquiries.map((item, i) => {
                const other = item.otherParticipant?.profile;
                const otherName = other?.full_name || other?.username || 'Kibabii Comrade';
                const lastMsg = item.lastMessage?.content || 'Started conversation';
                return (
                  <Link 
                    key={item.conversation.id || i} 
                    to={`/messages/${item.conversation.id}`} 
                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors min-w-0"
                  >
                    <Avatar className="h-9 w-9 shrink-0 border border-slate-200">
                      <AvatarImage src={other?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                        {otherName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{otherName}</p>
                        {item.currentParticipant?.unread_count > 0 && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{lastMsg}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })
            ) : (
              <div className="py-8 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No active inquiries</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  Direct questions and chat messages from interested buyers will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

