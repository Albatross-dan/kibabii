import * as React from 'react';
import { Mail, Lock, User, Phone, Tag, Loader2, Eye, EyeOff, MapPin, Upload, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { compressAndResizeBannerImage } from '@/lib/bannerUploadUtils';
import { isValidImageFile, isHeicImage, prepareImageForUpload } from '@/lib/imageUtils';

interface RegistrationFormProps {
  type: 'student' | 'store';
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

const KIBABII_CAMPUS_ID = '8e08c135-e6ec-4387-af3e-110b11d37c07';
const KIBABII_CAMPUS_NAME = 'Kibabii University';

const BUSINESS_CATEGORIES = [
  'Food & Cafeteria',
  'Electronics & Repairs',
  'Stationery & Printing',
  'Fashion & Apparel',
  'Salon & Barber Services',
  'Hostel Essentials',
  'Groceries & Fresh Food',
  'Other Services'
];

export function RegistrationForm({ type, onSubmit, isLoading }: RegistrationFormProps) {
  // Common states
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Store specific states
  const [storeName, setStoreName] = React.useState('');
  const [businessCategory, setBusinessCategory] = React.useState('');
  const [storeLocation, setStoreLocation] = React.useState('');
  const [storeDescription, setStoreDescription] = React.useState('');
  const [bannerFile, setBannerFile] = React.useState<Blob | File | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [isCompressingBanner, setIsCompressingBanner] = React.useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, HEIC)');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    setIsCompressingBanner(true);
    try {
      if (isHeicImage(file)) {
        file = await prepareImageForUpload(file);
      }

      const compressed = await compressAndResizeBannerImage(file, 1600, 0.8);
      setBannerFile(compressed.blob);
      const previewUrl = URL.createObjectURL(compressed.blob);
      setBannerPreview(previewUrl);
      toast.success('📸 Store banner selected!');
    } catch (err) {
      console.warn('Banner compression notice:', err);
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    } finally {
      setIsCompressingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
    toast.info('Store banner removed');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const payload: any = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    };

    if (type === 'student') {
      // Hardcode Kibabii University campus_id, sending automatically without any user selector
      payload.campus_id = KIBABII_CAMPUS_ID;
      payload.campus = KIBABII_CAMPUS_NAME;
      payload.whatsapp_number = phone.trim();
      // Username is auto-generated server-side from full_name
    } else {
      // Username is auto-generated server-side from Owner Full Name
      if (!businessCategory) {
        toast.error('Please select a Business Category.');
        return;
      }
      if (!storeLocation.trim()) {
        toast.error('Please enter store location.');
        return;
      }
      if (!storeDescription.trim()) {
        toast.error('Please enter a store description.');
        return;
      }
      payload.store_name = storeName.trim();
      payload.business_category = businessCategory;
      payload.store_location = storeLocation.trim();
      payload.store_description = storeDescription.trim();
      if (bannerFile) {
        payload.banner_file = bannerFile;
      }
      if (bannerPreview) {
        payload.store_banner_image = bannerPreview;
      }
    }

    try {
      await onSubmit(payload);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* 1. Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="font-bold text-foreground">
          {type === 'student' ? 'Full Name' : 'Business Owner Full Name'} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            required
            className="pl-11 h-12 rounded-xl"
            placeholder={type === 'student' ? 'E.g. Daniel Kamau' : 'E.g. Mercy Aoko'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Store Name (Store only) */}
      {type === 'store' && (
        <div className="space-y-2">
          <Label htmlFor="storeName" className="font-bold text-foreground">Store Name <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="storeName"
              type="text"
              required
              className="pl-11 h-12 rounded-xl"
              placeholder="E.g. Kibabii Ultimate Print Hub"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 3. Email (Renamed from Business Email) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="font-bold text-foreground">
          Email <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            className="pl-11 h-12 rounded-xl"
            placeholder={type === 'student' ? 'E.g. student@kibu.ac.ke or personal@gmail.com' : 'E.g. businessowner@gmail.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* 4. WhatsApp Number */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="font-bold text-foreground">WhatsApp Number <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            required
            className="pl-11 h-12 rounded-xl"
            placeholder="E.g. 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      {/* 5. Store Specific Details (Store only) */}
      {type === 'store' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-foreground">Business Category <span className="text-red-500">*</span></Label>
              <Select value={businessCategory} onValueChange={setBusinessCategory}>
                <SelectTrigger className="h-12 rounded-xl bg-white border">
                  <SelectValue placeholder="Select Business Category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeLocation" className="font-bold text-foreground">Store Location <span className="text-red-500">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="storeLocation"
                  type="text"
                  required
                  className="pl-11 h-12 rounded-xl"
                  placeholder="E.g. Near Main Gate, Gate B, or Hostel Block C"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription" className="font-bold text-foreground">Store Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="storeDescription"
              required
              rows={3}
              className="rounded-xl p-3"
              placeholder="Describe your store products, services, operating hours and offers..."
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
            />
          </div>

          {/* Store Banner Image Upload Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="storeBanner" className="font-bold text-foreground">
                Store Banner Image <span className="text-xs text-muted-foreground font-semibold">(Optional)</span>
              </Label>
              {bannerPreview && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Banner Selected
                </span>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              ref={bannerInputRef}
              id="storeBanner"
              type="file"
              accept="image/*, .heic, .heif"
              className="hidden"
              onChange={handleBannerChange}
            />

            {bannerPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm bg-slate-900 group">
                <div className="aspect-[16/6] w-full">
                  <img
                    src={bannerPreview}
                    alt="Store Banner Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-9 px-3 text-xs font-bold rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow cursor-pointer"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" /> Change Banner
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-9 px-3 text-xs font-bold rounded-xl shadow cursor-pointer"
                    onClick={handleRemoveBanner}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Storefront Header Banner
                </div>
              </div>
            ) : (
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-primary/80 rounded-2xl p-5 sm:p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-primary/5 transition-all group shadow-2xs hover:shadow-xs active:scale-[0.99]"
              >
                <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition border border-slate-200">
                  {isCompressingBanner ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 stroke-[2.2]" />
                  )}
                </div>
                <div className="mt-2.5 space-y-1">
                  <p className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">
                    {isCompressingBanner ? 'Optimizing banner...' : 'Upload Store Banner'}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Tap to browse image • High-quality photo recommended
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 6. Passwords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-foreground">Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="pl-11 pr-11 h-12 rounded-xl"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground focus:outline-none p-1.5 rounded-md transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-bold text-foreground">Confirm Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="pl-11 pr-11 h-12 rounded-xl"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground focus:outline-none p-1.5 rounded-md transition-colors cursor-pointer"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-black text-base rounded-xl transition-all shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Setting Up Account...
          </>
        ) : (
          type === 'student' ? 'Create Student Account' : 'Create Business Owner Account'
        )}
      </Button>
    </form>
  );
}
