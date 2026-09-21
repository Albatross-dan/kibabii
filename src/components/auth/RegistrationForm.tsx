import * as React from 'react';
import { useState } from 'react';
import { Mail, Lock, User, Phone, MapPin, Tag, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface RegistrationFormProps {
  type: 'student' | 'store';
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

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

const STORE_LOCATIONS = [
  'Kibabii Main Gate',
  'Gate A Campus Environs',
  'Gate B Shopping Center',
  'Hostel Hub Sector',
  'Bungoma Town Outpost',
  'Opposite Administration Block',
  'Within Campus Student Centre',
  'Other Location'
];

export function RegistrationForm({ type, onSubmit, isLoading }: RegistrationFormProps) {
  // Common states
  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  // Student specific states
  const [campus, setCampus] = React.useState('Kibabii University');
  const [hostelArea, setHostelArea] = React.useState('');
  const [studentRegNumber, setStudentRegNumber] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  // Store specific states
  const [storeName, setStoreName] = React.useState('');
  const [businessCategory, setBusinessCategory] = React.useState('');
  const [storeLocation, setStoreLocation] = React.useState('');
  const [storeDescription, setStoreDescription] = React.useState('');
  const [storeBannerImage, setStoreBannerImage] = React.useState('');

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
      full_name: fullName,
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    };

    if (type === 'student') {
      payload.campus = campus;
      payload.hostel_area = hostelArea;
      payload.student_reg_number = studentRegNumber;
      if (avatarUrl) {
        payload.avatar_url = avatarUrl;
      }
    } else {
      if (!businessCategory) {
        toast.error('Please select a Business Category.');
        return;
      }
      if (!storeLocation) {
        toast.error('Please select store location.');
        return;
      }
      payload.store_name = storeName;
      payload.business_category = businessCategory;
      payload.store_location = storeLocation;
      payload.store_description = storeDescription;
      payload.store_banner_image = storeBannerImage || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80';
    }

    try {
      await onSubmit(payload);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* 1. Common Name Section */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="font-bold text-foreground">
          {type === 'student' ? 'Full Name' : 'Owner Full Name'} <span className="text-red-500">*</span>
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

      {/* 2. Brand Section for Store */}
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

      {/* Grid: Username & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="font-bold text-foreground">Username <span className="text-red-500">*</span></Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              required
              className="pl-11 h-12 rounded-xl"
              placeholder="E.g. comrad_dan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-foreground">
            {type === 'student' ? 'Email Address' : 'Business Email'} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              className="pl-11 h-12 rounded-xl"
              placeholder={type === 'student' ? 'E.g. student@kibu.ac.ke' : 'E.g. shop@gmail.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Phone Number */}
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

      {/* 3. Student Specific Fields */}
      {type === 'student' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="campus" className="font-bold text-foreground">Campus <span className="text-red-500">*</span></Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="campus"
                type="text"
                required
                className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostelArea" className="font-bold text-foreground">Hostel / Area <span className="text-xs text-muted-foreground font-semibold">(Optional)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="hostelArea"
                  type="text"
                  className="pl-11 h-12 rounded-xl"
                  placeholder="E.g. Soweto Block B"
                  value={hostelArea}
                  onChange={(e) => setHostelArea(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regNumber" className="font-bold text-foreground">Student Registration Number <span className="text-xs text-muted-foreground font-semibold">(Optional)</span></Label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="regNumber"
                  type="text"
                  className="pl-11 h-12 rounded-xl"
                  placeholder="E.g. COM/04/2022"
                  value={studentRegNumber}
                  onChange={(e) => setStudentRegNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl" className="font-bold text-foreground">Profile Picture URL <span className="text-xs text-muted-foreground font-semibold">(Optional)</span></Label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="avatarUrl"
                type="url"
                className="pl-11 h-12 rounded-xl"
                placeholder="E.g. https://images.unsplash.com/your-photo"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* 4. Store Specific Fields */}
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
              <Label className="font-bold text-foreground">Store Location <span className="text-red-500">*</span></Label>
              <Select value={storeLocation} onValueChange={setStoreLocation}>
                <SelectTrigger className="h-12 rounded-xl bg-white border">
                  <SelectValue placeholder="Select Store Location" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="storeBannerImage" className="font-bold text-foreground">Store Banner Image URL <span className="text-xs text-muted-foreground font-semibold">(Optional)</span></Label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="storeBannerImage"
                type="url"
                className="pl-11 h-12 rounded-xl"
                placeholder="E.g. https://images.unsplash.com/photo-store"
                value={storeBannerImage}
                onChange={(e) => setStoreBannerImage(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Provide an image URL for the shop header. Do NOT supply a store logo; we only support high quality banners.
            </p>
          </div>
        </>
      )}

      {/* Passwords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-foreground">Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              className="pl-11 h-12 rounded-xl"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-bold text-foreground">Confirm Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              required
              className="pl-11 h-12 rounded-xl"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
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
          type === 'student' ? 'Create Student Account' : 'Create Store Account'
        )}
      </Button>
    </form>
  );
}
