import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Home, 
  Wrench, 
  Search, 
  Calendar, 
  DollarSign, 
  Check, 
  X, 
  ChevronRight, 
  Trash2, 
  Star, 
  Crown, 
  ArrowRight, 
  Tag, 
  Sparkles, 
  Clock, 
  Heart, 
  Info, 
  Lock, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Link as LinkIcon,
  HelpCircle,
  Eye,
  TrendingUp,
  Share2,
  MousePointer,
  Camera,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { Listing, Draft, SubscriptionPlan } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// 1. LISTING TYPE SELECTOR
interface TypeSelectorProps {
  onSelect: (type: 'product' | 'accommodation' | 'service' | 'lost_found' | 'event') => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ListingTypeSelector({ onSelect, isOpen, onClose }: TypeSelectorProps) {
  const options = [
    {
      id: 'product' as const,
      title: '📦 Product',
      desc: 'Sell textbooks, electronics, clothing, dorm chairs, laptops or food.',
      color: 'border-blue-100 hover:border-blue-400 bg-blue-50/20 text-blue-600',
      badge: 'Best Rates'
    },
    {
      id: 'accommodation' as const,
      title: '🏠 Accommodation',
      desc: 'Rent out hostels, bedsitters, shared rooms or rental apartments.',
      color: 'border-emerald-100 hover:border-emerald-400 bg-emerald-50/20 text-emerald-600',
      badge: 'Highly Searched'
    },
    {
      id: 'service' as const,
      title: '🛠 Service',
      desc: 'Promote printing, haircut, graphic design, tutoring or repairs.',
      color: 'border-purple-100 hover:border-purple-400 bg-purple-50/20 text-purple-600',
      badge: 'Zero Commissions'
    },
    {
      id: 'lost_found' as const,
      title: '🔍 Lost & Found',
      desc: 'Post lost belongings or items found around campus blocks.',
      color: 'border-amber-100 hover:border-amber-400 bg-amber-50/20 text-amber-600',
      badge: '100% Free'
    },
    {
      id: 'event' as const,
      title: '🎉 Event',
      desc: 'Organize sports, parties, meetings, concerts or academic seminars.',
      color: 'border-rose-100 hover:border-rose-400 bg-rose-50/20 text-rose-600',
      badge: 'High Reach'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl bg-white p-6 overflow-hidden">
        <DialogHeader className="text-left pb-4 border-b">
          <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">What would you like to post?</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Select listing category to launch smart creator
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
              style={{ contentVisibility: 'auto' }}
              className={`flex items-start justify-between p-4 border-2 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all text-left group active:scale-[0.98] ${opt.color}`}
            >
              <div className="space-y-1 pr-4">
                <h4 className="font-extrabold text-slate-800 text-base">{opt.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{opt.desc}</p>
              </div>
              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                <Badge variant="outline" className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border-slate-200">
                  {opt.badge}
                </Badge>
                <ChevronRight className="h-5 w-5 text-slate-350 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 2. CATEGORY SELECTOR
interface CategorySelectorProps {
  categories: { id: string; name: string; icon: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}

export function CategorySelector({ categories, selectedId, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id, cat.name)}
            style={{ contentVisibility: 'auto' }}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-[24px] cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all text-center gap-3 relative group active:scale-95 ${
              isSelected 
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                : 'border-slate-100 bg-white'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            )}
            <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-tight">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// 3. SUBCATEGORY SELECTOR
interface SubcategoryProps {
  subcategories: string[];
  selected: string;
  onSelect: (sub: string) => void;
}

export function SubcategorySelector({ subcategories, selected, onSelect }: SubcategoryProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {subcategories.map((sub) => {
        const isSelected = selected === sub;
        return (
          <button
            key={sub}
            type="button"
            onClick={() => onSelect(sub)}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isSelected
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
            }`}
          >
            {sub}
          </button>
        );
      })}
    </div>
  );
}

// 4. IMAGE UPLOADER (Supports 1 image with compact preview & small picker)
interface UploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ images, onChange, maxFiles = 1 }: UploaderProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    setProgress(30);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          onChange([result]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 200);
      } else {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const simulateUpload = (url: string) => {
    if (!url) return;
    setUploading(true);
    setProgress(35);
    
    setTimeout(() => {
      setUploading(false);
      onChange([url]);
      setInputUrl('');
    }, 200);
  };

  const deletePhoto = (idx: number = 0) => {
    onChange([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {uploading && (
        <div className="max-w-xs sm:max-w-sm mx-auto p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 animate-spin" /> Uploading image...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-150 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="max-w-xs sm:max-w-sm mx-auto border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-5 text-center cursor-pointer bg-slate-50/70 hover:bg-primary/5 transition-all group shadow-2xs hover:shadow-xs active:scale-[0.99]"
        >
          <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center mx-auto shadow-xs group-hover:scale-110 transition shrink-0 border border-slate-150">
            <Camera className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="mt-2.5 space-y-0.5">
            <p className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">
              Choose Photo
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Gallery or camera snapshot
            </p>
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            1 image only (JPG, PNG, WEBP)
          </div>
        </div>
      ) : (
        <div className="max-w-xs mx-auto text-center space-y-3">
          <div className="relative aspect-square w-48 sm:w-52 mx-auto rounded-2xl overflow-hidden border-2 border-primary/40 shadow-md bg-slate-900 group">
            <img src={images[0]} className="w-full h-full object-cover" alt="Item preview" />
            
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> Photo Ready
            </div>

            <button
              type="button"
              onClick={() => deletePhoto(0)}
              className="absolute top-2 right-2 h-7 w-7 text-white bg-red-500/95 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-transform active:scale-95"
              title="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-3 shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5 text-primary" /> Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => deletePhoto(0)}
              className="h-8 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 px-2.5"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          </div>
        </div>
      )}

      {/* URL fallback option */}
      <div className="max-w-xs sm:max-w-sm mx-auto pt-1">
        <details className="text-center group">
          <summary className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center gap-1 list-none select-none">
            <LinkIcon className="h-3 w-3" /> Or paste image web address
          </summary>
          <div className="flex gap-2 mt-2">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://... photo link"
              className="h-8 text-xs rounded-xl border-slate-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  simulateUpload(inputUrl);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={!inputUrl}
              onClick={() => simulateUpload(inputUrl)}
              className="h-8 px-3 rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0"
            >
              Set
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}

// 5. PROMOTION SELECTOR (Select plans & Flash Sale input)
interface PromotionSelectorProps {
  selectedType: string;
  onSelect: (type: string) => void;
  flashConfig: { enabled: boolean; orig: number; disc: number; expires: string };
  onFlashConfig: (cfg: any) => void;
  isStore: boolean;
}

export function PromotionSelector({ selectedType, onSelect, flashConfig, onFlashConfig, isStore }: PromotionSelectorProps) {
  const promos = [
    {
      id: 'free',
      title: 'Free Standard Post',
      badge: 'Student Default',
      price: 'KSh 0.00',
      desc: 'Visible under standard browse search catalog. Standard placement.',
      color: 'border-slate-100 hover:border-slate-300'
    },
    {
      id: 'featured',
      title: 'Featured (7 Days)',
      badge: 'Best-Seller',
      price: 'KSh 250.00',
      desc: 'Featured card style, homepage presence, prioritized listing in search.',
      color: 'border-amber-100 hover:border-amber-300 bg-amber-50/10'
    },
    {
      id: 'premium',
      title: 'Premium (14 Days)',
      badge: 'Top Visibility',
      price: 'KSh 490.00',
      desc: 'Top category positions, active flashing tag, eligibility in trending recommendations.',
      color: 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/10'
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map((p) => {
          const isSel = selectedType === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`p-5 rounded-2xl border-2 transition-all text-left active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                isSel ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : p.color
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900">{p.title}</h4>
                  <Badge variant="outline" className="text-[8px] font-black tracking-wider uppercase bg-white border-slate-200">
                    {p.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{p.desc}</p>
              </div>
              <p className="font-mono text-base font-black text-secondary mt-4">{p.price}</p>
            </button>
          );
        })}
      </div>

      {isStore && (
        <Card className="border border-dashed border-red-200 bg-red-50/10 rounded-[28px] overflow-hidden p-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="space-y-1">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-red-700 animate-pulse flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> High-conversion Flash Sale Hub
              </span>
              <h4 className="text-base font-black text-slate-900">Configure Store Flash Discount Campaign</h4>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                Qualify item into official homepage Flash Sales strip with real-time countdown timer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="flash-toggle" className="text-xs font-bold text-slate-700">Participate</Label>
              <Checkbox
                id="flash-toggle"
                checked={flashConfig.enabled}
                onCheckedChange={(val) => onFlashConfig({ ...flashConfig, enabled: !!val })}
                className="w-5.5 h-5.5 rounded-lg data-[state=checked]:bg-red-500"
              />
            </div>
          </div>

          {flashConfig.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Price (KES)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={flashConfig.orig || ''}
                    onChange={(e) => onFlashConfig({ ...flashConfig, orig: parseInt(e.target.value) })}
                    placeholder="e.g. 2000"
                    className="pl-14 h-11 rounded-xl"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-450 text-[11px] font-mono">KSh</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Price (KES)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={flashConfig.disc || ''}
                    onChange={(e) => onFlashConfig({ ...flashConfig, disc: parseInt(e.target.value) })}
                    placeholder="e.g. 1200"
                    className="pl-14 h-11 rounded-xl border-red-200 bg-red-50/10 focus-visible:ring-red-300"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-red-650 text-[11px] font-mono">KSh</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign End Date</Label>
                <Input
                  type="datetime-local"
                  value={flashConfig.expires}
                  onChange={(e) => onFlashConfig({ ...flashConfig, expires: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </motion.div>
          )}
        </Card>
      )}
    </div>
  );
}

// 6. TYPE-SPECIFIC EXPANSIBLE FORMS
export function PropertyForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Accomodation Type</Label>
        <RadioGroup
          value={data.accommodation_type || 'bedsitter'}
          onValueChange={(val) => onChange({ ...data, accommodation_type: val })}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {['hostel', 'bedsitter', 'apartment', 'shared_room'].map((type) => (
            <div key={type}>
              <RadioGroupItem value={type} id={type} className="peer sr-only" />
              <Label
                htmlFor={type}
                className="flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 text-center truncate font-bold text-xs uppercase"
              >
                {type.replace('_', ' ')}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Rent (KES)</Label>
        <Input
          type="number"
          placeholder="e.g. 4500"
          value={data.accommodation_rent || ''}
          onChange={(e) => onChange({ ...data, accommodation_rent: parseInt(e.target.value) })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Deposit (KES)</Label>
        <Input
          type="number"
          placeholder="e.g. 4500"
          value={data.accommodation_deposit || ''}
          onChange={(e) => onChange({ ...data, accommodation_deposit: parseInt(e.target.value) })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campus Distance walk</Label>
        <Input
          placeholder="e.g. 5 mins walk, 1km"
          value={data.accommodation_distance || ''}
          onChange={(e) => onChange({ ...data, accommodation_distance: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Rooms</Label>
        <Input
          type="number"
          placeholder="e.g. 2"
          value={data.accommodation_rooms || ''}
          onChange={(e) => onChange({ ...data, accommodation_rooms: parseInt(e.target.value) })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Landlord/House Rep Contact</Label>
        <Input
          placeholder="Inquiries phone number (WhatsApp or Call)"
          value={data.accommodation_contact || ''}
          onChange={(e) => onChange({ ...data, accommodation_contact: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}

export function ServiceForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const serviceCategories = ['Cyber Services', 'Photography', 'Graphic Design', 'Video Editing', 'Repairs', 'Haircuts', 'Printing Services', 'Tutor'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Service Class Category</Label>
        <Select
          value={data.service_category || ''}
          onValueChange={(val) => onChange({ ...data, service_category: val })}
        >
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            {serviceCategories.map(cat => (
              <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Starting Price (KES)</Label>
        <Input
          type="number"
          placeholder="e.g. KSh 50"
          value={data.service_starting_price || ''}
          onChange={(e) => onChange({ ...data, service_starting_price: parseInt(e.target.value) })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Working Hours</Label>
        <Input
          placeholder="e.g. 8:00 AM - 9:00 PM"
          value={data.service_working_hours || ''}
          onChange={(e) => onChange({ ...data, service_working_hours: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Direct WhatsApp Link Mobile</Label>
        <Input
          placeholder="WhatsApp contact with country code e.g. 254712345678"
          value={data.service_whatsapp || ''}
          onChange={(e) => onChange({ ...data, service_whatsapp: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provider Bio / Accomplishments</Label>
        <textarea
          placeholder="Detailed portfolio summary. Why should students and agencies book your services?"
          value={data.service_bio || ''}
          onChange={(e) => onChange({ ...data, service_bio: e.target.value })}
          rows={3}
          className="w-full border rounded-xl p-3 text-xs resize-none bg-slate-50/10 focus-visible:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

export function LostFoundForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Listing mode</Label>
        <RadioGroup
          value={data.lost_found_mode || 'lost'}
          onValueChange={(val) => onChange({ ...data, lost_found_mode: val })}
          className="grid grid-cols-2 gap-4"
        >
          {['lost', 'found'].map((mode) => (
            <div key={mode}>
              <RadioGroupItem value={mode} id={mode} className="peer sr-only" />
              <Label
                htmlFor={mode}
                className="flex items-center justify-center p-4 border rounded-2xl cursor-pointer peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/5 text-center font-extrabold text-sm uppercase text-slate-700"
              >
                {mode === 'lost' ? '🔴 i Lost something' : '🟢 i Found something'}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exact Spot Location</Label>
        <Input
          placeholder="e.g. Near Science Lab or LH-4 bench"
          value={data.lost_found_exact_location || ''}
          onChange={(e) => onChange({ ...data, lost_found_exact_location: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident Date</Label>
        <Input
          type="date"
          value={data.lost_found_date || ''}
          onChange={(e) => onChange({ ...data, lost_found_date: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact details</Label>
        <Input
          placeholder="Owner or finder name and phone"
          value={data.lost_found_contact || ''}
          onChange={(e) => onChange({ ...data, lost_found_contact: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}

export function EventForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const eventTypes = ['Tournament', 'Party', 'Meeting', 'Concert', 'Seminar', 'Workshop'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Style Category</Label>
        <Select
          value={data.event_type || ''}
          onValueChange={(val) => onChange({ ...data, event_type: val })}
        >
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="Select Style" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {eventTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Venue on Campus</Label>
        <Input
          placeholder="e.g. Main Auditorium"
          value={data.event_venue || ''}
          onChange={(e) => onChange({ ...data, event_venue: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Date</Label>
        <Input
          type="date"
          value={data.event_date || ''}
          onChange={(e) => onChange({ ...data, event_date: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Starting Time</Label>
        <Input
          type="time"
          value={data.event_time || ''}
          onChange={(e) => onChange({ ...data, event_time: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizer Name</Label>
        <Input
          placeholder="e.g. Student Association"
          value={data.event_organizer || ''}
          onChange={(e) => onChange({ ...data, event_organizer: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rsvp / Registration Link</Label>
        <Input
          placeholder="e.g. Google Form or Ticket link"
          value={data.event_registration_link || ''}
          onChange={(e) => onChange({ ...data, event_registration_link: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capacity Max Attendees</Label>
        <Input
          type="number"
          placeholder="Leave blank if unlimited"
          value={data.event_max_attendees || ''}
          onChange={(e) => onChange({ ...data, event_max_attendees: parseInt(e.target.value) })}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center h-full pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-free"
              checked={data.event_is_free || false}
              onCheckedChange={(checked) => onChange({ ...data, event_is_free: !!checked })}
              className="w-5.5 h-5.5 rounded-lg"
            />
            <Label htmlFor="is-free" className="text-xs font-black text-slate-700 cursor-pointer">This Event is Free</Label>
          </div>
          {!data.event_is_free && (
            <Input
              type="number"
              placeholder="Price e.g. 100"
              value={data.event_ticket_price || ''}
              onChange={(e) => onChange({ ...data, event_ticket_price: parseInt(e.target.value) })}
              className="w-32 h-10 rounded-lg text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 7. LISTING REVIEW CARD (Printable receipt feel summary)
export function ListingReviewCard({ values }: { values: Partial<Listing> }) {
  const isProd = values.listing_type === 'product';
  const isAcc = values.listing_type === 'accommodation';
  const isSvc = values.listing_type === 'service';
  const isLost = values.listing_type === 'lost_found';
  const isEvt = values.listing_type === 'event';

  return (
    <Card className="border border-slate-100 rounded-[32px] overflow-hidden bg-white shadow-xl text-left">
      <CardHeader className="bg-slate-50/50 p-6 sm:p-8 border-b pb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-primary border-primary/20">
                {values.listing_type} Listing Receipt
              </Badge>
              {values.promotion_type && values.promotion_type !== 'free' && (
                <Badge className="text-[9px] font-black tracking-wider uppercase bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" /> {values.promotion_type} campaign
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-905 mt-2 line-clamp-1">{values.title || 'Untitled Listing'}</CardTitle>
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Area: {values.location || 'Main Campus'}
            </CardDescription>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-widest">Rate</p>
            <p className="text-2xl font-black font-mono text-secondary">
              {isProd ? formatPrice(values.product_price || 0) :
               isAcc ? `${formatPrice(values.accommodation_rent || 0)} /mo` :
               isSvc ? `From ${formatPrice(values.service_starting_price || 0)}` :
               isEvt ? (values.event_is_free ? 'KSh 0.00' : formatPrice(values.event_ticket_price || 0)) :
               'FREE POST'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-8 space-y-6">
        {values.images && values.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {values.images.slice(0, 4).map((url, i) => (
              <div key={i} className="aspect-video rounded-xl bg-slate-100 overflow-hidden relative">
                <img src={url} className="w-full h-full object-cover" alt="" />
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 text-[8.5px] uppercase bg-black/60 px-2 py-0.5 text-white font-black rounded font-mono">Cover</span>}
              </div>
            ))}
          </div>
        )}

        <div className="p-5 bg-slate-50/60 rounded-2xl text-xs space-y-2">
          <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9.5px]">Listing Description</p>
          <p className="text-slate-600 font-semibold leading-relaxed line-clamp-3">{values.description || 'No description supplied yet.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-t pt-5">
          {isProd && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Condition Quality</span>
                <span className="font-bold text-slate-800">{values.product_condition}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Category Section</span>
                <span className="font-bold text-slate-800">{values.product_category} &bull; {values.product_subcategory}</span>
              </div>
            </>
          )}

          {isAcc && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Accomodation Type</span>
                <span className="font-bold text-slate-800 uppercase">{values.accommodation_type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Campus Proximity</span>
                <span className="font-bold text-slate-800">{values.accommodation_distance}</span>
              </div>
            </>
          )}

          {isSvc && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Working Hours</span>
                <span className="font-bold text-slate-800">{values.service_working_hours}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Direct WA Contact</span>
                <span className="font-bold text-slate-800 font-mono">+{values.service_whatsapp}</span>
              </div>
            </>
          )}

          {isLost && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Listing Category Mode</span>
                <span className={values.lost_found_mode === 'lost' ? 'font-bold text-red-500 uppercase' : 'font-bold text-emerald-500 uppercase'}>
                  {values.lost_found_mode} Item
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Incident Spot</span>
                <span className="font-bold text-slate-800">{values.lost_found_exact_location}</span>
              </div>
            </>
          )}

          {isEvt && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Campus Venue</span>
                <span className="font-bold text-slate-800">{values.event_venue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-extrabold uppercase text-[9.5px]">Date & Time Slot</span>
                <span className="font-bold text-slate-800 font-mono">{values.event_date} @ {values.event_time}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 8. DRAFT MANAGER ALERT BAR / COMPACT POPUP
interface DraftManagerProps {
  drafts: Draft[];
  onResume: (draft: Draft) => void;
  onDelete: (id: string) => void;
}

export function DraftManager({ drafts, onResume, onDelete }: DraftManagerProps) {
  if (drafts.length === 0) return null;

  return (
    <Card className="border border-dashed border-indigo-200 bg-indigo-50/15 rounded-[28px] overflow-hidden p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
      <div className="flex gap-3.5 items-start">
        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
            You have unfinished listings drafts <Badge className="bg-indigo-650 hover:bg-indigo-700 text-white text-[9px] font-black rounded-full h-4.5 px-2">{drafts.length}</Badge>
          </h4>
          <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-xl">
            Auto-save preserves your progress every 30 seconds. Tap a resume block below to continue immediately.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 self-stretch sm:self-auto justify-end w-full sm:w-auto">
        {drafts.slice(0, 2).map((d) => (
          <div key={d.id} className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <span className="font-extrabold text-slate-800 max-w-[120px] truncate">{d.title || `Untitled ${d.listing_type}`}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResume(d)}
              className="text-indigo-600 hover:text-indigo-500 font-extrabold h-7 text-[11px] rounded px-1.5"
            >
              Resume
            </Button>
            <button
              onClick={() => onDelete(d.id)}
              className="text-red-500 hover:text-red-400 p-1 rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 9. CLIENT-SIDE COMPACT ANALYTICS DISPLAY CARD
export function ListingAnalyticsCard({ views, favorites, type = 'short' }: { views: number; favorites: number; type?: 'short' | 'full' }) {
  const messages = Math.ceil(views * 0.12);
  const clicks = Math.ceil(views * 0.45);
  const shares = Math.ceil(favorites * 0.25);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-1 text-left">
      {[
        { label: 'Views', value: views, icon: Eye, color: 'text-blue-500 bg-blue-50/50' },
        { label: 'Favorites', value: favorites, icon: Heart, color: 'text-red-500 bg-red-50/50' },
        ...(type === 'full' ? [
          { label: 'CTAs Clicks', value: clicks, icon: MousePointer, color: 'text-amber-500 bg-amber-50/50' },
          { label: 'Conversations', value: messages, icon: ChatIcon, color: 'text-purple-500 bg-purple-50/50' },
          { label: 'Shares', value: shares, icon: Share2, color: 'text-emerald-500 bg-emerald-50/50' }
        ] : [])
      ].map((item) => (
        <div key={item.label} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{item.label}</span>
            <span className="font-mono font-black text-sm text-slate-800">{item.value}</span>
          </div>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
            <item.icon className="h-4.5 w-4.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// 10. STORE PROMOTION LIMITS PROGRESS
export function StorePromotionCard({ count, planName, limit }: { count: number; planName: string; limit: number }) {
  const percent = Math.min(100, (count / limit) * 100);
  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white p-5 text-left space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <Crown className="w-4.5 h-4.5 text-amber-500" /> Promotion slots
        </span>
        <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/5 border-amber-500/20 px-2 py-0.5 rounded">
          {planName}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-500 font-mono">
          <span>Used Campaign Slots</span>
          <span>{count} / {limit} Used</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    </Card>
  );
}

// 11. SUBSCRIPTION PRICING CARDS
export function SubscriptionCard({
  plan,
  isActive,
  onChoose
}: {
  plan: SubscriptionPlan;
  isActive: boolean;
  onChoose: (id: string) => void;
}) {
  const benefits = [
    { text: `Max Products: ${plan.product_limit === 999 ? 'Unlimited' : plan.product_limit} items`, enabled: true },
    { text: `${plan.promotion_limit} Free Featured slots`, enabled: plan.promotion_limit > 0 },
    { text: `Detailed Sales Analytics`, enabled: plan.analytics_access },
    { text: `Flash Sale Campaign Access`, enabled: plan.flash_sale_access },
    { text: `Homepage Banner exposure`, enabled: plan.homepage_feature_access }
  ];

  return (
    <Card className={`rounded-[32px] overflow-hidden border-2 transition-all p-6 text-left flex flex-col justify-between group h-full hover:shadow-xl ${
      isActive 
        ? 'border-primary bg-primary/5 ring-4 ring-primary/5 shadow-lg' 
        : 'border-slate-100 bg-white hover:border-slate-300'
    }`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h4 className="text-lg font-black text-slate-900">{plan.display_name}</h4>
            <span className="text-[9.5px] text-slate-400 uppercase font-black tracking-widest">{plan.id} Tier</span>
          </div>
          {isActive && (
            <Badge className="bg-primary text-white font-extrabold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-full">
              active plan
            </Badge>
          )}
        </div>

        <div className="flex items-baseline gap-1 py-2">
          <span className="font-mono text-3xl font-black text-secondary">KES {plan.price_monthly.toLocaleString()}</span>
          <span className="text-xs text-slate-400 font-bold lowercase">/month</span>
        </div>

        <div className="space-y-3 pt-3 border-t">
          {benefits.map((b, i) => (
            <div key={i} className={`flex items-start gap-2.5 text-xs ${b.enabled ? 'text-slate-600' : 'text-slate-300 line-through'}`}>
              <Check className={`h-4 w-4 shrink-0 mt-0.5 ${b.enabled ? 'text-green-500' : 'text-slate-200'}`} />
              <span className="font-medium lead-snug">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onChoose(plan.id)}
        disabled={isActive}
        className={`w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider mt-8 ${
          isActive 
            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none pointer-events-none' 
            : 'bg-secondary hover:bg-secondary/95 text-white shadow-md shadow-secondary/10'
        }`}
      >
        {isActive ? '✓ Current Active Plan' : `Upgrade to ${plan.display_name}`}
      </Button>
    </Card>
  );
}
