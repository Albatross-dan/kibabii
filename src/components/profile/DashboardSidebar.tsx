import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
  User, 
  BarChart3, 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  Store, 
  Home, 
  Wrench, 
  Calendar, 
  Settings, 
  HelpCircle, 
  Lock, 
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Menu,
  ChevronDown,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DashboardSidebarProps {
  isStore: boolean;
  isAdmin: boolean;
  showAccommodation: boolean;
  showServices: boolean;
  showEvents: boolean;
  onLogoutClick: () => void;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
}

export interface DashboardSectionConfig {
  id: string;
  label: string;
  title: string;
  num: string;
  desc: string;
  show: boolean;
}

export function getDashboardSections(options: {
  isStore: boolean;
  isAdmin: boolean;
  showAccommodation?: boolean;
  showServices?: boolean;
  showEvents?: boolean;
}): DashboardSectionConfig[] {
  const {
    isStore,
    isAdmin,
    showAccommodation = true,
    showServices = true,
    showEvents = true,
  } = options;

  return [
    { id: 'profile-header', label: '1. Profile Header', title: 'Profile Header', num: '01', show: true, desc: 'Personal info, banner & contact details' },
    { id: 'account-stats', label: '2. Account Stats', title: 'Account Stats', num: '02', show: true, desc: 'Spending, listings & performance analytics' },
    { id: 'my-marketplace', label: '3. My Marketplace', title: 'My Marketplace', num: '03', show: true, desc: 'Active listings, drafts & sold items' },
    { id: 'followed-stores', label: '4. Followed Stores', title: 'Followed Stores', num: '04', show: true, desc: 'Favorite campus vendors & shops' },
    { id: 'verification-badges', label: '5. Verification & Badges', title: 'Verification & Badges', num: '05', show: true, desc: 'Student ID, seller badge & trust score' },
    { id: 'seller-center', label: '6. Seller Center', title: 'Seller Center', num: '06', show: true, desc: 'Escrow orders, payouts & inquiries' },
    { id: 'store-management', label: '7. Store Management', title: 'Store Management', num: '07', show: isStore, desc: 'Store profile, inventory & shop settings' },
    { id: 'accommodation-management', label: '8. Accommodation', title: 'Accommodation', num: '08', show: showAccommodation, desc: 'Hostels, rentals & student bookings' },
    { id: 'services-management', label: '9. Services Management', title: 'Services Management', num: '09', show: showServices, desc: 'Skills, freelance gigs & service requests' },
    { id: 'events-management', label: '10. Events Management', title: 'Events Management', num: '10', show: showEvents, desc: 'Campus events, tickets & schedules' },
    { id: 'settings', label: '11. Dashboard Settings', title: 'Dashboard Settings', num: '11', show: true, desc: 'Security, notifications & preferences' },
    { id: 'help-support', label: '12. Help & Support', title: 'Help & Support', num: '12', show: true, desc: 'FAQ, safety guidelines & customer service' },
    { id: 'administration', label: '13. Administration Control', title: 'Administration Control', num: '13', show: isAdmin, desc: 'Moderation, user management & logs' },
    { id: 'logout', label: '14. End Session', title: 'End Session', num: '14', show: true, desc: 'Safely sign out of KibabuiMart' },
  ];
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'profile-header': <User className="h-4 w-4" />,
  'account-stats': <BarChart3 className="h-4 w-4" />,
  'my-marketplace': <ShoppingBag className="h-4 w-4" />,
  'followed-stores': <Heart className="h-4 w-4" />,
  'verification-badges': <ShieldCheck className="h-4 w-4" />,
  'seller-center': <TrendingUp className="h-4 w-4" />,
  'store-management': <Store className="h-4 w-4" />,
  'accommodation-management': <Home className="h-4 w-4" />,
  'services-management': <Wrench className="h-4 w-4" />,
  'events-management': <Calendar className="h-4 w-4" />,
  'settings': <Settings className="h-4 w-4" />,
  'help-support': <HelpCircle className="h-4 w-4" />,
  'administration': <Lock className="h-4 w-4" />,
  'logout': <LogOut className="h-4 w-4" />,
};

export function AccountMenuButton({
  onClick,
  activeLabel,
  className
}: {
  onClick: () => void;
  activeLabel?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="default"
      size="xs"
      onClick={onClick}
      className={cn(
        "bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-black h-8 px-3 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95",
        className
      )}
      id="account-menu-trigger-btn"
    >
      <Menu className="h-3.5 w-3.5 text-primary" />
      <span>Account Menu</span>
      {activeLabel && (
        <span className="hidden sm:inline-block text-[10px] text-slate-300 font-normal max-w-[120px] truncate border-l border-slate-700 pl-1.5 ml-0.5">
          {activeLabel}
        </span>
      )}
      <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
    </Button>
  );
}

export default function DashboardSidebar({
  isStore,
  isAdmin,
  showAccommodation,
  showServices,
  showEvents,
  onLogoutClick,
  isMenuOpen,
  setIsMenuOpen
}: DashboardSidebarProps) {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string>('profile-header');

  const menuOpen = isMenuOpen !== undefined ? isMenuOpen : internalMenuOpen;
  const setMenuOpen = setIsMenuOpen || setInternalMenuOpen;

  const rawSections = getDashboardSections({
    isStore,
    isAdmin,
    showAccommodation,
    showServices,
    showEvents,
  });

  const navItems = rawSections.map(sec => ({
    ...sec,
    icon: SECTION_ICONS[sec.id] || <User className="h-4 w-4" />
  }));

  const visibleItems = navItems.filter(item => item.show);
  const activeItem = visibleItems.find(item => item.id === activeAnchor) || visibleItems[0];

  const handleSmoothScroll = (id: string) => {
    setActiveAnchor(id);
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Setup intersection scrollspy observer inside the dashboard page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      const found = navItems
        .filter(item => item.show)
        .reverse()
        .find(item => {
          const el = document.getElementById(item.id);
          if (el) {
            return el.offsetTop <= scrollPosition;
          }
          return false;
        });

      if (found) {
        setActiveAnchor(found.id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isStore, isAdmin, showAccommodation, showServices, showEvents]);

  return (
    <>
      {/* 1. SLIDE-OUT DRAWER / MENU SHEET (Contains all Control Center Options) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent 
          side="right" 
          className="w-[320px] sm:w-[380px] max-w-[92vw] p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl z-[100]"
        >
          {/* Header */}
          <SheetHeader className="p-4 sm:p-5 bg-slate-900 text-white text-left border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-primary border border-slate-700/60 shadow-xs">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-black text-white tracking-tight leading-tight">
                  Account Menu
                </SheetTitle>
                <p className="text-[11px] text-slate-400 font-medium">
                  Control center sections & quick actions
                </p>
              </div>
            </div>

            {/* Current Active Section Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[10px] text-slate-300 font-semibold w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[240px]">Viewing: {activeItem?.label || '1. Profile Header'}</span>
            </div>
          </SheetHeader>

          {/* Option list container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100">
            <div className="space-y-1 pb-2">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Sections ({visibleItems.length})</span>
                <span className="text-primary font-bold">Tap to Jump</span>
              </div>

              {visibleItems.map((item) => {
                const isActive = activeAnchor === item.id;
                const isLogout = item.id === 'logout';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={
                      isLogout 
                        ? () => {
                            setMenuOpen(false);
                            onLogoutClick();
                          }
                        : () => handleSmoothScroll(item.id)
                    }
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-slate-900 text-white font-black shadow-sm shadow-slate-900/10' 
                        : isLogout
                          ? 'text-rose-600 hover:bg-rose-50 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-bold hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-slate-800 text-primary' 
                          : isLogout
                            ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      }`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <span className={`text-xs block truncate ${isActive ? 'text-white' : ''}`}>
                          {item.label}
                        </span>
                        {item.desc && (
                          <span className={`text-[10px] block truncate font-normal ${
                            isActive ? 'text-slate-300' : 'text-slate-400'
                          }`}>
                            {item.desc}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5 opacity-60'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Kibabii University Marketplace • Student Verified
            </span>
          </div>
        </SheetContent>
      </Sheet>

      {/* DESKTOP STICKY SIDEBAR (Rendered in desktop grid column) */}
      <div className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-2 sticky top-[80px]">
          <div className="flex items-center justify-between px-3 py-2 border-b mb-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Control Center
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer"
              title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isDesktopCollapsed ? (
                <>
                  <span>Expand</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span>Compact</span>
                  <ChevronLeft className="h-3 w-3" />
                </>
              )}
            </button>
          </div>

          {/* Quick Menu Drawer Trigger for Desktop as well */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 mb-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Menu className="h-3.5 w-3.5 text-primary" />
            <span>Open Menu Drawer</span>
          </button>

          {/* Scroll link list */}
          {!isDesktopCollapsed && (
            <nav className="space-y-1 block max-h-[60vh] overflow-y-auto pr-0.5">
              {visibleItems.map((item) => {
                const isActive = activeAnchor === item.id;
                const isLogout = item.id === 'logout';

                return (
                  <button
                    key={item.id}
                    onClick={
                      isLogout 
                        ? onLogoutClick 
                        : () => handleSmoothScroll(item.id)
                    }
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white font-black shadow shadow-slate-900/10' 
                        : isLogout
                          ? 'text-rose-600 hover:bg-rose-50 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 font-bold hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1 rounded-lg shrink-0 ${
                        isActive 
                          ? 'bg-slate-800 text-white' 
                          : isLogout
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-50 text-slate-500'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 opacity-40 shrink-0 ${isActive ? 'translate-x-0.5 text-white' : ''}`} />
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
