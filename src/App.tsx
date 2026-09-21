import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Layout from '@/components/layout/Layout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import LoginModal from '@/components/auth/LoginModal';

// Pages (to be created)
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Wishlist from '@/pages/Wishlist';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import Search from '@/pages/Search';
import CategoryProducts from '@/pages/CategoryProducts';
import Categories from '@/pages/Categories';
import StoreDetail from '@/pages/StoreDetail';

// Dashboard Pages
import Dashboard from '@/pages/dashboard/Dashboard';
import { 
  Listings, 
  NewListing, 
  EditListing, 
  SellerOrders, 
  Analytics, 
  SellerReviews, 
  DashboardSettings as Settings 
} from '@/pages/dashboard/index';

// Auth Pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword, { 
  ResetPassword, 
  VerifyEmail 
} from '@/pages/auth/index';

// Admin Pages
import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ProductVerification from '@/pages/admin/ProductVerification';

export default function App() {
  useEffect(() => {
    // Initialize singleton auth, cart, and wishlist once
    useAuthStore.getState().initAuth();
    useCartStore.getState().fetchCart();
    useWishlistStore.getState().fetchWishlist();
  }, []);

  return (
    <TooltipProvider>
      <LoginModal />
      <BrowserRouter>
        <Routes>
          {/* Public/Main Routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/listing/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:slug" element={<CategoryProducts />} />
            <Route path="/store/:storeId" element={<StoreDetail />} />
            <Route path="/stores/:storeId" element={<StoreDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            
            {/* Protected Store Routes */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Chat />} />
          </Route>

          {/* Dashboard Routes (Seller) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/messages" element={<Messages />} />
            <Route path="/dashboard/listings" element={<Listings />} />
            <Route path="/dashboard/listings/new" element={<NewListing />} />
            <Route path="/dashboard/listings/:id/edit" element={<EditListing />} />
            <Route path="/dashboard/orders" element={<SellerOrders />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/reviews" element={<SellerReviews />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/verifications/:id" 
            element={
              <AdminLayout>
                <ProductVerification />
              </AdminLayout>
            } 
          />

          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </TooltipProvider>
  );
}
