import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Bell, 
  LogOut,
  ChevronDown,
  Store,
  ShieldCheck,
  X,
  ChevronRight,
  User,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessageStore } from '@/store/messageStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import StoreCreationModal from '@/components/store/StoreCreationModal';
import { toast } from 'sonner';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  const isStore = profile?.account_type === 'store' || profile?.role === 'store' || profile?.role === 'shop_owner' || profile?.is_store === true;
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.length;
  const unreadCount = useMessageStore((state) => state.unreadCount);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0 transition-transform active:scale-98" aria-label="KibuMall Marketplace Home">
            <img 
              src="/logo-horizontal.svg" 
              alt="KibuMall Marketplace" 
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
              referrerPolicy="no-referrer"
            />
          </Link>

          {/* Search Bar - Desktop Only */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative mx-4 lg:mx-8 hidden md:block">
            <div className="w-full h-11 rounded-full bg-[#F0F1F2] hover:bg-[#EAEBED] focus-within:bg-[#EAEBED] transition-colors flex items-center px-4">
              <button
                type="submit"
                className="text-[#282828] hover:opacity-80 transition-opacity p-0.5 cursor-pointer shrink-0"
                title="Search"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-[#282828] stroke-[2.2]" />
              </button>
              <input
                type="search"
                placeholder="Search on Kibu Mall"
                className="w-full bg-transparent pl-3 pr-2 text-sm font-normal text-[#282828] placeholder:text-[#282828]/85 focus:outline-none border-none ring-0 focus:ring-0 shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3 text-secondary shrink-0">
            <Link to="/wishlist" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex" title="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            
            <Link to="/cart" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors" title="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 min-w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 bg-primary text-white border-2 border-white rounded-full text-[9px] sm:text-[10px] font-bold"
                >
                  {cartCount}
                </Badge>
              )}
            </Link>

            <Link to="/notifications" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors" title="Notifications">
              <Bell className="h-5 w-5 text-secondary" />
              <Badge className="absolute top-1 right-1 h-2 w-2 p-0 bg-primary rounded-full border border-white" />
            </Link>

            {/* Messages - hidden on mobile as it is easily accessible on the bottom navigation */}
            <Link to="/messages" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex" title="Messages & Chat">
              <MessageSquare className="h-5 w-5 text-secondary" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 bg-primary text-white border-2 border-white rounded-full text-[10px] font-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>

            {/* Create Listing (➕ Sell) Button */}
            <Button
              onClick={() => setIsSellOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white font-bold h-8 sm:h-10 px-3 sm:px-5 rounded-full shadow-md shadow-primary/25 flex items-center gap-1 sm:gap-1.5 transition-all transform hover:scale-[1.03] active:scale-95 text-xs sm:text-base cursor-pointer shrink-0"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Sell</span>
            </Button>

            {/* Admin Panel Access Button for logged-in admin users */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="hidden lg:flex items-center gap-1.5 px-4 h-10 bg-slate-900 border border-slate-800 text-slate-100 hover:text-white hover:bg-slate-800 font-extrabold text-sm rounded-full transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Desktop User Account Controls Dropdown */}
            <div className="hidden md:flex items-center ml-1">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer outline-none">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-secondary overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 bg-white rounded-xl shadow-lg border border-gray-100">
                    <DropdownMenuLabel className="font-bold text-xs text-secondary truncate">
                      {user.user_metadata?.full_name || profile?.full_name || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer text-xs font-semibold">Seller Center / Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/listings" className="cursor-pointer text-xs font-semibold">My Listings</Link>
                    </DropdownMenuItem>
                    {isStore ? (
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5" /> Store Dashboard
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => setIsStoreModalOpen(true)}
                        className="cursor-pointer text-xs font-bold text-indigo-600 flex items-center gap-1.5"
                      >
                        <Store className="h-3.5 w-3.5" /> Become a Shop Owner
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings" className="cursor-pointer text-xs font-semibold">Account Settings</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-xs font-bold text-emerald-600">Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs font-bold text-red-600">
                      <LogOut className="h-3.5 w-3.5 mr-2" /> Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button asChild variant="ghost" size="sm" className="font-bold text-xs h-8 px-2.5">
                    <Link to="/auth/login">Log In</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary text-white font-bold text-xs rounded-full h-8 px-3">
                    <Link to="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Strip */}
      <div className="bg-white border-t border-gray-100 hidden md:block group">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex h-12 items-center gap-8 text-sm font-semibold text-gray-500">
            {[
              { label: 'Books & Notes', icon: '📚', slug: 'books-notes' },
              { label: 'Electronics', icon: '⚡', slug: 'electronics' },
              { label: 'Food', icon: '🍔', slug: 'food-snacks' },
              { label: 'Phones', icon: '📱', slug: 'phones' },
              { label: 'Computing', icon: '💻', slug: 'computing' },
              { label: 'TVs & Audio', icon: '📺', slug: 'tvs-audio' },
              { label: 'Appliances', icon: '🔌', slug: 'appliances' },
              { label: 'Fashion', icon: '👗', slug: 'fashion' },
              { label: 'Furniture', icon: '🛋️', slug: 'furniture' },
              { label: 'Services', icon: '🔧', slug: 'services' },
            ].map((cat) => (
              <Link 
                key={cat.slug}
                to={`/categories?slug=${cat.slug}`}
                className="flex items-center gap-2 h-full border-b-2 border-transparent transition-all hover:text-primary hover:border-primary whitespace-nowrap"
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      </nav>

      {/* Slide-up Bottom Sheet for Create Listing */}
      <AnimatePresence>
        {isSellOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSellOpen(false)}
              className="fixed inset-0 bg-black z-[100] cursor-pointer"
            />
            
            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl z-[101] overflow-hidden border-t border-gray-100 flex flex-col pb-6 text-slate-800"
            >
              {/* Drag Handle representation */}
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Title Section */}
              <div className="px-6 pb-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-secondary">Create Listing</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-bold">Choose what you would like to post.</p>
                </div>
                <button 
                  onClick={() => setIsSellOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Options Grid */}
              <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh]">
                {[
                  {
                    id: 'product',
                    title: '📦 Product',
                    description: 'Sell products to students and campus buyers.',
                    color: 'hover:border-blue-500 hover:bg-blue-50/30'
                  },
                  {
                    id: 'accommodation',
                    title: '🏠 Accommodation',
                    description: 'Post hostels, bedsitters, apartments, and vacancies.',
                    color: 'hover:border-emerald-500 hover:bg-emerald-50/30'
                  },
                  {
                    id: 'service',
                    title: '🛠 Service',
                    description: 'Offer services such as graphic design, cyber services, photography, repairs, and more.',
                    color: 'hover:border-purple-500 hover:bg-purple-50/30'
                  },
                  {
                    id: 'lost_found',
                    title: '🔍 Lost & Found',
                    description: 'Help students recover lost items.',
                    color: 'hover:border-amber-500 hover:bg-amber-50/30'
                  },
                  {
                    id: 'event',
                    title: '🎉 Event',
                    description: 'Promote tournaments, parties, seminars, workshops, and campus events.',
                    color: 'hover:border-rose-500 hover:bg-rose-50/30'
                  }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setIsSellOpen(false);
                      if (!user) {
                        toast.error('Please log in first to create listings');
                        navigate('/auth/login');
                        return;
                      }
                      navigate(`/dashboard/listings/new?type=${option.id}`);
                    }}
                    className={`w-full p-4 flex flex-col text-left border border-gray-100 rounded-2xl transition-all duration-200 shadow-sm ${option.color} group relative overflow-hidden cursor-pointer`}
                  >
                    <div className="font-bold text-base text-secondary flex items-center justify-between">
                      <span className="font-black text-secondary">{option.title}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 pr-6 leading-relaxed">{option.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <StoreCreationModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSuccess={(newStore) => {
          setIsStoreModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </>
  );
}
