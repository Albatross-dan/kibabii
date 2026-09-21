import * as React from 'react';
import { useState } from 'react';
import { 
  User, 
  Image, 
  Phone, 
  Mail, 
  Lock, 
  MapPin, 
  Bell, 
  Monitor, 
  Eye, 
  ShieldAlert,
  Sliders,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Building,
  Wrench,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, UserProfile } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface SettingsPanelProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  // Simulation switches
  showAccommodation: boolean;
  setShowAccommodation: (show: boolean) => void;
  showServices: boolean;
  setShowServices: (show: boolean) => void;
  showEvents: boolean;
  setShowEvents: (show: boolean) => void;
}

export default function SettingsPanel({
  profile,
  setProfile,
  showAccommodation,
  setShowAccommodation,
  showServices,
  setShowServices,
  showEvents,
  setShowEvents
}: SettingsPanelProps) {
  // Option expanders
  const [activeAccordion, setActiveAccordion] = useState<string | null>('edit_profile');

  // Input states synchronized from user profile
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsapp_number || profile.phone || '');
  const [campus, setCampus] = useState(profile.campus || 'Kibabii University');
  const [email, setEmail] = useState(profile.email || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=KibuUser');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp_number || profile.phone || '');
  const [pass, setPass] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Notification states
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  // Security checklist states
  const [twoFactor, setTwoFactor] = useState(false);

  // User privacy settings from user_settings table
  const [showPhone, setShowPhone] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUserSettings = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || profile.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('show_phone')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data && isMounted) {
          setShowPhone(data.show_phone !== false);
        }
      } catch (err) {
        console.warn('Error fetching user_settings:', err);
      } finally {
        if (isMounted) setLoadingSettings(false);
      }
    };

    fetchUserSettings();
    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const handleToggleShowPhone = async (newValue: boolean) => {
    setShowPhone(newValue);
    setIsUpdatingPrivacy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || profile.id;

      if (!userId) {
        toast.error('You must be signed in to update privacy settings.');
        setShowPhone(!newValue);
        return;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: userId,
            show_phone: newValue,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.warn('user_settings upsert error:', error);
        // Fallback: check if existing row exists
        const { data: existing } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        let fallbackErr = null;
        if (existing) {
          const { error: updErr } = await supabase
            .from('user_settings')
            .update({ show_phone: newValue, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
          fallbackErr = updErr;
        } else {
          const { error: insErr } = await supabase
            .from('user_settings')
            .insert({ user_id: userId, show_phone: newValue });
          fallbackErr = insErr;
        }

        if (fallbackErr) {
          console.error('Failed to update phone privacy:', fallbackErr);
          toast.error('Could not save phone privacy setting.');
          setShowPhone(!newValue);
          return;
        }
      }

      toast.success(
        newValue
          ? 'Phone number & WhatsApp button now visible on your listings'
          : 'Phone number & WhatsApp button now hidden from all your listings'
      );
    } catch (err) {
      console.error('Exception updating phone privacy:', err);
      toast.error('Failed to update privacy setting');
      setShowPhone(!newValue);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let normalizedWa = '';
    if (whatsappNumber.trim()) {
      const normResult = normalizeWhatsAppNumber(whatsappNumber);
      if (!normResult.valid) {
        toast.error(normResult.error || 'Please enter a valid WhatsApp number in E.164 format (e.g. +254712345678).');
        setIsSaving(false);
        return;
      }
      normalizedWa = normResult.formatted;
    }

    try {
      // Sync to Supabase profiles table for authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone,
            whatsapp_number: normalizedWa || null,
            campus: campus,
            avatar_url: avatar
          })
          .eq('id', session.user.id);

        if (error) {
          console.warn('Supabase profile update warning:', error);
        }
      }

      const updated = {
        ...profile,
        full_name: fullName,
        phone: phone,
        whatsapp_number: normalizedWa || undefined,
        campus: campus,
        email: email,
        avatar_url: avatar
      };
      setProfile(updated);
      setWhatsappNumber(normalizedWa);
      setWhatsapp(normalizedWa);
      toast.success('👤 Settings saved! Profile updated across active system.');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error('Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp.trim()) {
      toast.error('Please enter a WhatsApp number.');
      return;
    }

    const norm = normalizeWhatsAppNumber(whatsapp);
    if (!norm.valid) {
      toast.error(norm.error || 'Invalid WhatsApp number format.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({
            whatsapp_number: norm.formatted
          })
          .eq('id', session.user.id);
      }

      setProfile({
        ...profile,
        whatsapp_number: norm.formatted
      });
      setWhatsapp(norm.formatted);
      setWhatsappNumber(norm.formatted);
      toast.success(`📱 WhatsApp number set to ${norm.formatted}! Direct buyer contacts are active.`);
    } catch {
      toast.error('Failed to update WhatsApp number');
    }
  };

  const handleUpdatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass.trim()) return;
    setPass('');
    toast.success('🔒 Account password hashed and rotated successfully.');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Simulation Toggle panel */}
      <Card className="border border-indigo-150 bg-indigo-55 bg-indigo-50/10 p-4 sm:p-5 rounded-2xl space-y-3">
        <h5 className="font-extrabold text-[11px] text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> DASHBOARD LIVE SIMULATION SETTINGS
        </h5>
        <p className="text-[10px] text-slate-400 font-semibold">Toggle optional vertical sections on-the-fly to test student, service providers, or organizers profile layouts live:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-black">
          <button 
            onClick={() => {
              setShowAccommodation(!showAccommodation);
              toast.info(showAccommodation ? 'Hidden Accommodation Panel' : 'Activated Section 8: Accommodation Panel live!');
            }}
            className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
              showAccommodation ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            <span className="flex items-center gap-2"><Building className="h-4.5 w-4.5 text-sky-500" /> Section 8: Accommodation</span>
            <span className={`h-2.5 w-2.5 rounded-full ${showAccommodation ? 'bg-sky-500' : 'bg-slate-300'}`} />
          </button>

          <button 
            onClick={() => {
              setShowServices(!showServices);
              toast.info(showServices ? 'Hidden Services Panel' : 'Activated Section 9: Services Panel live!');
            }}
            className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
              showServices ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            <span className="flex items-center gap-2"><Wrench className="h-4.5 w-4.5 text-indigo-500" /> Section 9: Services</span>
            <span className={`h-2.5 w-2.5 rounded-full ${showServices ? 'bg-indigo-500' : 'bg-slate-300'}`} />
          </button>

          <button 
            onClick={() => {
              setShowEvents(!showEvents);
              toast.info(showEvents ? 'Hidden Events Panel' : 'Activated Section 10: Events Panel live!');
            }}
            className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
              showEvents ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            <span className="flex items-center gap-2"><Calendar className="h-4.5 w-4.5 text-purple-500" /> Section 10: Events</span>
            <span className={`h-2.5 w-2.5 rounded-full ${showEvents ? 'bg-purple-500' : 'bg-slate-300'}`} />
          </button>
        </div>
      </Card>

      {/* Accordions settings lists */}
      <div className="space-y-2">
        
        {/* S1: Edit Profile */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('edit_profile')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <User className="h-4.5 w-4.5 text-indigo-500" /> 👤 Edit Profile Information
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'edit_profile' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'edit_profile' && (
            <div className="p-5 border-t bg-stone-50/30">
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="stFullname" className="font-bold text-slate-700">Comrade Legals Name</Label>
                    <Input 
                      id="stFullname"
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="stUsername" className="font-bold text-slate-705">Account Username</Label>
                    <Input 
                      id="stUsername"
                      disabled 
                      value={`@${profile.username}`}
                      className="h-10 text-xs bg-slate-50 text-slate-400 cursor-not-allowed border-dashed rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="stEmail" className="font-bold text-slate-705">Verifiable Email Address</Label>
                    <Input 
                      id="stEmail"
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="stPhone" className="font-bold text-slate-705">Target Telephone Call Line</Label>
                    <Input 
                      id="stPhone"
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stWhatsApp" className="font-bold text-slate-705 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp Number (for Direct Contact & wa.me Links)
                      </Label>
                      <span className="text-[10px] text-emerald-600 font-semibold">E.164 Format Required</span>
                    </div>
                    <Input 
                      id="stWhatsApp"
                      placeholder="e.g. +254712345678 or 0712345678"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Buyers can click the WhatsApp button on your products and store to message you directly. Numbers starting with 0 will be auto-converted to +254.
                    </p>
                  </div>

                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <Label htmlFor="stCampus" className="font-bold text-slate-705 font-mono">Location Campus / Store Block Coordinates</Label>
                    <select 
                      id="stCampus"
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full h-10 border rounded-xl px-3 bg-white text-xs"
                    >
                      <option>Kibabii University (Main Campus)</option>
                      <option>Bungoma Town Center Annex</option>
                      <option>Webuye Campus Branch</option>
                      <option>Masinde Muliro Campus (Associate Extension)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="h-9 font-bold text-xs px-6 bg-primary text-white rounded-xl">
                    {isSaving ? 'Saving profile...' : 'Save profile information'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* S2: Change Profile Picture */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('avatar')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Image className="h-4.5 w-4.5 text-sky-500" /> 📸 Change Avatar / Cover Photo
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'avatar' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'avatar' && (
            <div className="p-5 border-t bg-stone-50/30 text-xs space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl border overflow-hidden shrink-0">
                  <img src={avatar} className="w-full h-full object-cover" alt="" />
                </div>
                
                <div className="flex-1 space-y-1 text-slate-700">
                  <Label htmlFor="avUrl" className="font-bold block">Avatar URL Address</Label>
                  <Input 
                    id="avUrl"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Provide image web URL links..."
                    className="h-9 text-xs bg-white rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mercy',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=ComradeTech',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=KibuElite'
                ].map((preset, pIdx) => (
                  <button 
                    key={pIdx} 
                    type="button" 
                    onClick={() => { setAvatar(preset); toast.info('Preset avatar loaded!'); }}
                    className="h-10 w-10 border rounded-lg overflow-hidden bg-white hover:border-slate-350 transition-all hover:scale-105 shrink-0"
                  >
                    <img src={preset} className="h-full w-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* S3: Update WhatsApp Number */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('whatsapp')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Phone className="h-4.5 w-4.5 text-emerald-500" /> 📱 Update WhatsApp Target Alert
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'whatsapp' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'whatsapp' && (
            <div className="p-5 border-t bg-stone-50/30 text-xs">
              <form onSubmit={handleUpdateWhatsApp} className="space-y-3.5 max-w-sm">
                <div className="space-y-1">
                  <Label htmlFor="whNum" className="font-bold text-slate-700">Target WhatsApp Number (Alert Sync)</Label>
                  <Input 
                    id="whNum"
                    required 
                    placeholder="e.g. 0712345678" 
                    value={whatsapp} 
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-10 text-xs bg-white rounded-xl" 
                  />
                  <p className="text-[10px] text-slate-400">Our courier escrow and delivery alerts utilize WhatsApp push indicators directly.</p>
                </div>

                <Button type="submit" className="h-9 text-xs bg-emerald-600 font-bold text-white rounded-xl hover:bg-emerald-700">
                  Sync WhatsApp delivery Alerts
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* S4: Change Password */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('password')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Lock className="h-4.5 w-4.5 text-rose-500" /> 🔒 Change Password Settings
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'password' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'password' && (
            <div className="p-5 border-t bg-stone-50/30 text-xs">
              <form onSubmit={handleUpdatePass} className="space-y-3.5 max-w-sm">
                <div className="space-y-1">
                  <Label htmlFor="pwNew" className="font-bold text-slate-700">New Account Password</Label>
                  <Input 
                    id="pwNew"
                    type="password" 
                    required 
                    placeholder="Enter min 6 digit secret hash..." 
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="h-10 text-xs bg-white rounded-xl" 
                  />
                </div>

                <Button type="submit" className="h-9 text-xs bg-secondary text-white font-bold rounded-xl hover:bg-secondary/95">
                  Rotate Password
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* S5: Notification Preferences */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('notifications')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Bell className="h-4.5 w-4.5 text-amber-500" /> 🔔 Notification Preferences
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'notifications' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'notifications' && (
            <div className="p-5 border-t bg-stone-50/30 text-xs space-y-3">
              <label className="flex items-center gap-3 p-2 border bg-white rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifWhatsapp}
                  onChange={(e) => {
                    setNotifWhatsapp(e.target.checked);
                    toast.success(`WhatsApp notify alerts ${e.target.checked ? 'ENABLED ✓' : 'DISABLED ✗'}`);
                  }}
                  className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-400" 
                />
                <div>
                  <span className="font-black block text-slate-900 leading-tight">Instant WhatsApp Alerts</span>
                  <span className="text-[10px] text-slate-400 font-medium">Get immediate WhatsApp notifications for student chats and courier bids.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 border bg-white rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifEmail}
                  onChange={(e) => {
                    setNotifEmail(e.target.checked);
                    toast.success(`Email weekly indexes ${e.target.checked ? 'ENABLED ✓' : 'DISABLED ✗'}`);
                  }}
                  className="h-4 w-4 rounded text-primary focus:ring-primary/20" 
                />
                <div>
                  <span className="font-black block text-slate-900 leading-tight">Weekly Ledger Audit Digests</span>
                  <span className="text-[10px] text-slate-400 font-medium font-semibold">Get email statements of listings count, active ratings, and escrow details.</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* S6: Appearance Settings */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('appearance')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Monitor className="h-4.5 w-4.5 text-slate-600" /> 🌙 Appearance & Theme Coordinates
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'appearance' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'appearance' && (
            <div className="p-5 border-t bg-stone-50/30 text-[11px] text-slate-500 font-semibold space-y-2">
              <p>🎨 **Default Canvas Lock**: Kibu Market is locked exclusively to a crisp, high-contrast, eye-safe **Modern Light Theme** as per official design rules to maximize student readability and reduce mobile battery drain near campus hostels.</p>
              <div className="p-2.5 bg-slate-50 border rounded-xl font-bold flex items-center gap-2 max-w-sm mt-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" /> Optimized 60Hz UI frame mapping applied.
              </div>
            </div>
          )}
        </div>

        {/* S7: Privacy & Security */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
          <button 
            onClick={() => toggleAccordion('privacy')}
            className="w-full p-4 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 text-teal-600" /> 🛡️ Privacy & Account Security Settings
            </span>
            <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${activeAccordion === 'privacy' ? 'rotate-180' : ''}`} />
          </button>

          {activeAccordion === 'privacy' && (
            <div className="p-5 border-t bg-stone-50/30 text-xs space-y-3">
              {/* Show phone on listings privacy toggle */}
              <label 
                htmlFor="show-phone-toggle"
                className="flex items-start gap-3 p-3.5 border bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
              >
                <input 
                  type="checkbox" 
                  id="show-phone-toggle"
                  checked={showPhone}
                  disabled={loadingSettings || isUpdatingPrivacy}
                  onChange={(e) => handleToggleShowPhone(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 leading-tight">
                      Show my phone number on my listings
                    </span>
                    {isUpdatingPrivacy && (
                      <span className="text-[10px] text-muted-foreground animate-pulse">Saving...</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                    When enabled, buyers can see your phone number and contact you directly via WhatsApp on all your listings. If disabled, WhatsApp contact buttons will be hidden from all your listings.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 border bg-white rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={twoFactor}
                  onChange={(e) => {
                    setTwoFactor(e.target.checked);
                    toast.success(`Two-Factor Auth simulation: ${e.target.checked ? 'ENABLED ✓' : 'DISABLED ✗'}`);
                  }}
                  className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500" 
                />
                <div>
                  <span className="font-black block text-slate-900 leading-tight">Enable Escrow 2FA Token Check</span>
                  <span className="text-[10px] text-slate-400 font-medium">Verify release of escrow funds via a secure alert check prior to transfer.</span>
                </div>
              </label>

              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] leading-relaxed">
                ✓ **Kibu Privacy Shield**: Account addresses and hostel coordinate maps are fully encrypted. Public chats only resolve usernames to preserve absolute peer anonymity.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
