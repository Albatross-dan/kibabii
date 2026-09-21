import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Star, 
  Settings, 
  Plus,
  TrendingUp,
  Clock,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Store,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isStore = profile?.account_type === 'store' || profile?.role === 'store' || profile?.is_store === true;
  const sellerName = profile?.store_name || profile?.full_name || user?.user_metadata?.full_name || 'Comrade Seller';
  const sellerId = profile?.id || user?.id || '';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Listings', icon: ShoppingBag, path: '/dashboard/listings' },
    { label: 'Incoming Orders', icon: Clock, path: '/dashboard/orders' },
    { label: 'Messages', icon: MessageSquare, path: '/dashboard/messages' },
    { label: 'Reviews', icon: Star, path: '/dashboard/reviews' },
    { label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
    { label: 'Billing & Plans', icon: CreditCard, path: '/dashboard/settings' },
    ...(isAdmin ? [{ label: 'Admin Panel', icon: ShieldCheck, path: '/admin' }] : []),
  ];

  const mobileBottomTabs = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Listings', icon: ShoppingBag, path: '/dashboard/listings' },
    { label: 'Add Post', icon: Plus, path: '/dashboard/listings/new', isAction: true },
    { label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
    { label: 'Plans', icon: CreditCard, path: '/dashboard/settings' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <Link 
          to="/" 
          onClick={() => setSheetOpen(false)}
          className="flex items-center gap-2.5 font-black text-xl text-white tracking-tight group"
        >
          <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-white">Kibabii</span><span className="text-primary">Mart</span>
            <span className="text-[9px] text-slate-400 font-extrabold tracking-widest block font-mono">
              {isStore ? 'OFFICIAL STORE CENTER' : 'STUDENT TRADE HUB'}
            </span>
          </div>
        </Link>
      </div>

      {/* User profile card in sidebar */}
      <div className="p-4 mx-4 mt-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/40 shrink-0">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
            {sellerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-white truncate leading-tight">{sellerName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {isStore ? 'Verified Store' : 'Active Seller'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation list */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label}
              to={item.path}
              onClick={() => setSheetOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20 font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          Marketplace
        </div>
        <Link
          to="/"
          onClick={() => setSheetOpen(false)}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all"
        >
          <Store className="h-4.5 w-4.5 text-slate-400" />
          Visit Marketplace
          <ExternalLink className="h-3.5 w-3.5 ml-auto text-slate-400" />
        </Link>
      </nav>

      {/* Footer / CTA & Logout */}
      <div className="p-4 border-t border-slate-800/80 mt-auto space-y-2">
        <Button 
          asChild 
          className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs h-10 rounded-xl shadow-md shadow-primary/20"
        >
          <Link to="/dashboard/listings/new" onClick={() => setSheetOpen(false)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Listing
          </Link>
        </Button>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold h-9 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50/70 text-slate-900 antialiased selection:bg-primary selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="lg:hidden w-full bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2 font-black text-base text-white tracking-tight">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <span>Kibabii<span className="text-primary">Mart</span></span>
          </Link>
          <Badge className="bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700">
            Seller
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-black text-xs h-8 px-2.5 rounded-lg shadow-sm">
            <Link to="/dashboard/listings/new">
              <Plus className="h-3.5 w-3.5 mr-1" /> Post
            </Link>
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 rounded-lg"
                aria-label="Open seller menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-slate-900 text-white w-[290px] border-r border-slate-800">
              <SheetHeader className="sr-only">
                <SheetTitle>Seller Menu</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col border-r border-slate-800/80 h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Main content pane */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-28 md:pb-8 min-w-0">
        <Outlet />
      </main>

      {/* Mobile Seller Bottom Navigation Bar (Phone Screens) */}
      <nav 
        aria-label="Seller Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {mobileBottomTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/35 active:scale-95 transition-transform">
                    <Plus className="h-6 w-6 stroke-[3]" />
                  </div>
                  <span className="text-[10px] font-black text-primary mt-1">Post</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.label}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] transition-colors active:scale-95 ${
                  isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-bold ${isActive ? 'font-black text-primary' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

