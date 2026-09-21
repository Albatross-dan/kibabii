import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, MessageSquare, Heart, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useMessageStore } from '@/store/messageStore';
import { useAuth } from '@/hooks/useAuth';

export default function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, profile, isAdmin } = useAuth();
  
  // Connect to Zustand stores for dynamic badges
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const unreadMessages = useMessageStore((state) => state.unreadCount);

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      badge: 0,
    },
    {
      label: 'Categories',
      icon: LayoutGrid,
      path: '/categories',
      badge: 0,
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages',
      badge: unreadMessages,
    },
    {
      label: 'Wishlist',
      icon: Heart,
      path: '/wishlist',
      badge: wishlistCount,
    },
    {
      label: 'Account',
      icon: User,
      path: '/profile',
      badge: 0,
    },
  ];

  return (
    <>
      <div id="app-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-2 sm:px-4 pb-[env(safe-area-inset-bottom,16px)] pt-2 rounded-t-[24px] w-full max-w-full">
        <div className="w-full max-w-md mx-auto flex items-center justify-between relative h-14">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            // Regular item style
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 py-1 h-12 transition-all active:scale-95 group"
              >
                <div className="relative p-1">
                  <Icon 
                    className={`h-5.5 w-5.5 transition-all duration-300 group-hover:scale-110 ${
                      active 
                        ? 'text-primary' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Badge */}
                  <AnimatePresence>
                    {item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1.5 bg-primary text-white font-bold rounded-full h-4.5 min-w-[18px] flex items-center justify-center px-1 text-[9px] border border-white"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <span className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors duration-200 ${
                  active ? 'text-primary font-extrabold' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {item.label}
                </span>

                {/* Dot active indicator */}
                {active && (
                  <motion.div 
                    layoutId="bottomNavActiveDot"
                    className="absolute bottom-[-4px] w-1.5 h-1.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Floating Circular Mobile Admin Trigger */}
      {isAdmin && (
        <div className="md:hidden fixed bottom-22 right-4 z-50">
          <Link
            to="/admin"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-950 text-white border border-slate-800 hover:bg-slate-900 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)] cursor-pointer transition-all active:scale-95 group animate-pulse"
          >
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] uppercase tracking-wider font-black pr-0.5">Admin Panel</span>
          </Link>
        </div>
      )}
    </>
  );
}
