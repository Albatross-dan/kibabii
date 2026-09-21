import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Sparkles, 
  MapPin, 
  Tag, 
  FileText, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storeService, Store as StoreType, slugify, shortRandomSuffix } from '@/services/storeService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface StoreCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (store: StoreType) => void;
  campuses?: Array<{ id: string; name: string }>;
}

const STORE_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Beauty & Personal Care',
  'Stationery & Books',
  'Groceries & Snacks',
  'Phone & Laptop Accessories',
  'Dorm & Home Essentials',
  'Printing & Cyber Services',
  'Footwear & Sneakers',
  'General Merchandise'
];

export default function StoreCreationModal({
  isOpen,
  onClose,
  onSuccess,
  campuses = []
}: StoreCreationModalProps) {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [campusId, setCampusId] = useState(campuses[0]?.id || '8e08c135-e6ec-4387-af3e-110b11d37c07');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const previewSlug = storeName.trim() ? `${slugify(storeName)}-XXXX` : 'your-store-XXXX';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get current user from the real Supabase session or useAuthStore populated from session
    let currentUser: { id: string; email?: string } | null = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id) {
        currentUser = authUser;
      }
    } catch (e) {
      console.warn('Supabase auth session check notice:', e);
    }

    if (!currentUser) {
      const sessionUser = useAuthStore.getState().user;
      if (sessionUser?.id) {
        currentUser = sessionUser;
      }
    }

    if (!currentUser?.id) {
      toast.error('Please log in to set up a store');
      navigate('/auth/login');
      return;
    }

    const trimmedName = storeName.trim();
    if (!trimmedName) {
      setErrorMsg('Store name is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const generatedSlug = slugify(trimmedName) + '-' + Math.random().toString(36).slice(2, 8);
      let storeRecord: any = null;

      // Insert into live Supabase stores table with real authenticated user.id
      const { data, error } = await supabase.from('stores').insert({
        owner_id: currentUser.id,
        name: trimmedName,
        store_name: trimmedName,
        slug: generatedSlug,
        description: description.trim() || null,
        category: category.trim() || null,
        location: location.trim() || null,
        campus_id: campusId || null,
      }).select().single();

      if (error) {
        console.error('Store creation failed:', error);
        setErrorMsg(error.message || 'Store creation failed. Please check your permissions.');
        setLoading(false);
        return;
      }

      storeRecord = data;

      // Update user profile role in Supabase profiles table
      try {
        await supabase.from('profiles').update({
          role: 'shop_owner',
          account_type: 'store',
          is_store: true,
          store_name: storeRecord.name
        }).eq('id', currentUser.id);
      } catch (profileErr) {
        console.warn('Profile role sync notice:', profileErr);
      }

      // Update authStore state so UI reflects shop_owner role
      const updatedProfile = {
        ...(profile || ({} as any)),
        id: currentUser.id,
        role: 'shop_owner' as const,
        account_type: 'store' as const,
        is_store: true,
        store_name: storeRecord.name,
        store_location: storeRecord.location || profile?.store_location,
        business_category: storeRecord.category || profile?.business_category,
        store_description: storeRecord.description || profile?.store_description,
        store_verification_status: storeRecord.is_verified ? ('approved' as const) : ('unverified' as const)
      };

      if (setProfile) {
        setProfile(updatedProfile);
      }

      // Also persist to accounts list in localStorage
      try {
        const accounts = JSON.parse(localStorage.getItem('kibabui_marketplace_accounts') || '[]');
        const idx = accounts.findIndex((a: any) => a.id === currentUser!.id);
        if (idx !== -1) {
          accounts[idx] = { ...accounts[idx], ...updatedProfile };
        } else {
          accounts.push(updatedProfile);
        }
        localStorage.setItem('kibabui_marketplace_accounts', JSON.stringify(accounts));
      } catch (accErr) {
        console.warn('Failed to update accounts list in localStorage:', accErr);
      }

      toast.success(`🎉 Congratulations! "${storeRecord.name}" is now live!`);
      onSuccess(storeRecord);
      onClose();
    } catch (err: any) {
      console.error('Store creation failed:', err);
      const msg = err?.message || 'Something went wrong creating your store';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-150 relative my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5 pr-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight flex items-center gap-2">
              Create Your Campus Store
              <span className="text-[10px] uppercase font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full tracking-wider">
                Shop Owner
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Set up your official store to post products with the Store badge, get verified, and build student brand trust.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Name */}
          <div className="space-y-1.5">
            <Label htmlFor="storeName" className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span>Store Name <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-gray-400 font-normal">e.g. Kibu Tech Corner</span>
            </Label>
            <Input
              id="storeName"
              placeholder="e.g. Campus Vogue, Alpha Gadgets..."
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="h-10 text-sm font-semibold rounded-xl border-gray-200 focus-visible:ring-indigo-500"
              required
              maxLength={60}
            />
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-0.5">
              <span className="text-gray-400">Store URL preview:</span>
              <span className="font-mono text-indigo-600 font-semibold truncate">
                /store/{previewSlug}
              </span>
            </div>
          </div>

          {/* Category & Campus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="storeCategory" className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-500" />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="storeCategory" className="h-10 text-xs rounded-xl border-gray-200">
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {STORE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeLocation" className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-500" />
                Location / Stall
              </Label>
              <Input
                id="storeLocation"
                placeholder="e.g. Student Center Stall #5"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 text-xs rounded-xl border-gray-200"
                maxLength={80}
              />
            </div>
          </div>

          {/* Campus Selection if campuses provided */}
          {campuses && campuses.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="storeCampus" className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500" />
                Campus Base
              </Label>
              <Select value={campusId} onValueChange={setCampusId}>
                <SelectTrigger id="storeCampus" className="h-10 text-xs rounded-xl border-gray-200">
                  <SelectValue placeholder="Select Campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="storeDesc" className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-500" />
              Store Bio / Tagline
            </Label>
            <Textarea
              id="storeDesc"
              placeholder="What do you specialize in? Special discounts for students, repair services, original gear..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[72px] rounded-xl border-gray-200 resize-none"
              maxLength={250}
            />
          </div>

          {/* Perks Notice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
            <h4 className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Shop Owner Privileges
            </h4>
            <ul className="text-[10px] text-indigo-700/90 space-y-1 pl-4 list-disc">
              <li>Automatic Shop Owner role assigned upon store creation</li>
              <li>Products display your verified Store badge on search and listings</li>
              <li>Dedicated store showcase page with all your products</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-xl border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !storeName.trim()}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Store...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Launch Store
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
