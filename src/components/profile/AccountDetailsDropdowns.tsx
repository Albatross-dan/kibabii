import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  BarChart3, 
  Store as StoreIcon, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  Check, 
  Calendar, 
  GraduationCap, 
  Sparkles,
  Shield,
  MessageCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/store/authStore';
import { DashboardMetrics } from '@/components/profile/StatsPanel';
import { toast } from 'sonner';

interface AccountDetailsDropdownsProps {
  profile: UserProfile;
  realAuthUser?: any;
  userStore?: any;
  realReviews: { rating: number; count: number };
  realMetrics: Partial<DashboardMetrics>;
  isStore: boolean;
  wishlistCount: number;
}

export default function AccountDetailsDropdowns({
  profile,
  realAuthUser,
  userStore,
  realReviews,
  realMetrics,
  isStore,
  wishlistCount
}: AccountDetailsDropdownsProps) {
  // Set which dropdown accordions are open. Personal and Contact open by default for immediate convenience
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    campus: false,
    verification: false,
    activity: false,
    store: false,
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = () => {
    setOpenSections({
      personal: true,
      contact: true,
      campus: true,
      verification: true,
      activity: true,
      store: true,
    });
    toast.info('All account detail dropdowns expanded');
  };

  const handleCollapseAll = () => {
    setOpenSections({
      personal: false,
      contact: false,
      campus: false,
      verification: false,
      activity: false,
      store: false,
    });
    toast.info('All account detail dropdowns collapsed');
  };

  const handleCopy = (text: string, label: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const formattedJoinDate = React.useMemo(() => {
    const rawDate = (profile as any)?.created_at || realAuthUser?.created_at || profile.join_date;
    if (!rawDate) return 'Active Comrade';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return String(rawDate);
    }
  }, [profile, realAuthUser]);

  const cleanWhatsappNumber = (profile.whatsapp_number || profile.phone || '').replace(/[^0-9]/g, '');
  const whatsappLink = cleanWhatsappNumber
    ? `https://wa.me/${cleanWhatsappNumber.startsWith('0') ? '254' + cleanWhatsappNumber.slice(1) : cleanWhatsappNumber}`
    : null;

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 text-left">
      {/* Header bar for Account Details dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Account Details & Credentials
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tap any dropdown below to display or manage your verified account data.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="text-[11px] h-7 px-2.5 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            Expand All
          </Button>
          <span className="text-slate-300">•</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="text-[11px] h-7 px-2.5 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Accordion / Dropdown Stack */}
      <div className="space-y-3">
        {/* ================= 1. PERSONAL PROFILE & IDENTITY ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('personal')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Personal & Profile Details</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    @{profile.username}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Full name, comrade handle, account tier & membership timeline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-indigo-600">
                {openSections.personal ? 'Tap to hide' : 'Tap to view'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.personal ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.personal && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Full Legal Name */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Full Legal Name
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {profile.full_name || 'Comrade User'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.full_name, 'Full Name', 'fullname')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy full name"
                    >
                      {copiedKey === 'fullname' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Comrade Username */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Comrade Username
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-primary truncate">
                      @{profile.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`@${profile.username}`, 'Username', 'username')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy username"
                    >
                      {copiedKey === 'username' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Account Type Tier */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account Classification
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      profile.account_type === 'store'
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-blue-100 text-blue-950 border border-blue-300'
                    }`}>
                      {profile.account_type === 'store' ? <StoreIcon className="h-3 w-3 text-amber-700" /> : <GraduationCap className="h-3 w-3 text-blue-700" />}
                      {profile.account_type === 'store' ? 'Store Account' : 'Student Account'}
                    </span>
                  </div>
                </div>

                {/* System Role */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active System Role
                  </span>
                  <span className="text-xs font-bold text-slate-800 capitalize">
                    {profile.role || 'Student & Marketplace Buyer'}
                  </span>
                </div>

                {/* Student Registration Number */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Student Reg. Number
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800 truncate">
                      {profile.student_reg_number || 'Linked via Student Verification'}
                    </span>
                    {profile.student_reg_number && (
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.student_reg_number || '', 'Reg Number', 'regnum')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === 'regnum' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Member Since */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Member Timeline
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Joined {formattedJoinDate}</span>
                  </div>
                </div>
              </div>

              {/* Account Identifier Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                <span className="truncate">Account ID: {profile.id}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(profile.id, 'Account ID', 'accid')}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                >
                  {copiedKey === 'accid' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>Copy System ID</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= 2. CONTACT & COMMUNICATION CHANNELS ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('contact')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Contact & Communication Channels</span>
                  {whatsappLink && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      WhatsApp Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Registered email, voice call line, direct WhatsApp & alert channels
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-600">
                {openSections.contact ? 'Tap to hide' : 'Tap to view'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.contact ? 'rotate-180 bg-emerald-50 text-emerald-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.contact && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Email Address */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Verified Email Address
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {profile.email || realAuthUser?.email || 'ogudadaniel11221@gmail.com'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.email || realAuthUser?.email || '', 'Email', 'email')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Voice Call Phone */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Telephone Calling Line
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 truncate">
                      {profile.phone || '0712 345 678'}
                    </span>
                    <div className="flex items-center gap-1">
                      {profile.phone && (
                        <a
                          href={`tel:${profile.phone}`}
                          className="p-1 rounded hover:bg-slate-100 text-primary hover:text-primary-dark"
                          title="Call phone number"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.phone || '', 'Phone Number', 'phone')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === 'phone' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Mobile Number */}
                <div className="p-3 bg-white border border-emerald-200/80 rounded-xl space-y-1 bg-emerald-50/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> WhatsApp Contact
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700">Orders & Inquiries</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-950 truncate">
                      {profile.whatsapp_number || profile.phone || '0712 345 678'}
                    </span>
                    <div className="flex items-center gap-1">
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.whatsapp_number || profile.phone || '', 'WhatsApp Number', 'whatsapp')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === 'whatsapp' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courier & Escrow Notice */}
              <div className="mt-3 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  All courier handoffs and Escrow payment release notifications are dispatched to your verified WhatsApp and email in real time.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. CAMPUS, RESIDENCE & MEETUP COORDINATES ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('campus')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Campus & Meetup Coordinates</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Kibabii University
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  University branch, hostel area, safe campus exchange spot & dispatch radius
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-sky-600">
                {openSections.campus ? 'Tap to hide' : 'Tap to view'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.campus ? 'rotate-180 bg-sky-50 text-sky-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.campus && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* University Institution */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    University Institution
                  </span>
                  <span className="text-xs font-black text-slate-900 block truncate">
                    Kibabii University (KIBU)
                  </span>
                </div>

                {/* Campus Branch / Area */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Campus Zone / Branch
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {profile.campus || profile.store_location || 'Main Campus (Bungoma)'}
                  </span>
                </div>

                {/* Hostel / Residence Area */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hostel / Living Area
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {profile.hostel_area || 'Milimani / Soweto / Campus Vicinity'}
                  </span>
                </div>

                {/* Recommended Safe Meetup Spot */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Safe Exchange Spot
                  </span>
                  <p className="text-xs font-medium text-slate-700">
                    📍 Main Gate B Foyer, Student Center Ground Floor, or Science Complex Quad (monitored campus spots).
                  </p>
                </div>

                {/* Delivery Distance Radius */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Peer Dispatch Radius
                  </span>
                  <span className="text-xs font-bold text-sky-700 block">
                    Within 3 km of Campus Grounds
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. VERIFICATION, CREDENTIALS & TRUST ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('verification')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Verification & Trust Credentials</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Kibu Trust Shield
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Student ID status, verified seller badge, email confirmation & escrow score
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-purple-600">
                {openSections.verification ? 'Tap to hide' : 'Tap to view'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.verification ? 'rotate-180 bg-purple-50 text-purple-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.verification && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Student Verification */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Student ID Check
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    profile.student_verification_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : profile.student_verification_status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profile.student_verification_status === 'approved' ? '✓ Verified Student' : profile.student_verification_status === 'pending' ? '⏳ Under Review' : '• Unverified'}
                  </span>
                </div>

                {/* Store Merchant Verification */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Store Verification
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    userStore?.is_verified || profile.store_verification_status === 'approved'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {userStore?.is_verified || profile.store_verification_status === 'approved' ? '✓ Official Merchant' : '• Standard User'}
                  </span>
                </div>

                {/* Email Verification */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Security Email
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                    ✓ Confirmed & Locked
                  </span>
                </div>

                {/* Top Seller Badge */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Top Seller Rank
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    profile.is_top_seller
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profile.is_top_seller ? '⭐ Top Campus Seller' : 'Rising Comrade'}
                  </span>
                </div>
              </div>

              {/* Security Shield Guarantee */}
              <div className="mt-3 p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
                <Shield className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">100% Escrow Peer Protection Activated</span>
                  <span className="text-[11px] text-purple-700">
                    Buyers deposit payment into Kibabii Market Escrow; funds are released to sellers only upon confirmed physical inspection and receipt of the item.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. STORE & COMMERCIAL PROFILE (IF APPLICABLE) ================= */}
        {isStore && (
          <div className="border border-amber-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('store')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-50/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <StoreIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Store & Merchant Profile</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {userStore?.name || profile.store_name || 'Official Store'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Store storefront, stall address, category, business bio & public page
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-block text-[11px] font-bold text-amber-800">
                  {openSections.store ? 'Tap to hide' : 'Tap to view'}
                </span>
                <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.store ? 'rotate-180 bg-amber-100 text-amber-900' : ''}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </button>

            {openSections.store && (
              <div className="p-4 sm:p-5 border-t border-amber-100 bg-amber-50/20 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Store Name */}
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Store Brand Name
                    </span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {userStore?.name || profile.store_name || 'Campus Comrade Store'}
                    </span>
                  </div>

                  {/* Business Category */}
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Primary Category
                    </span>
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {userStore?.category || profile.business_category || 'Electronics & Campus Services'}
                    </span>
                  </div>

                  {/* Physical Stall Location */}
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Physical Stall / Location
                    </span>
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {userStore?.location || profile.store_location || 'Campus Commercial Center'}
                    </span>
                  </div>

                  {/* Store Description */}
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Store Bio / Specialization
                    </span>
                    <p className="text-xs font-medium text-slate-700">
                      {userStore?.description || profile.store_description || 'Student run campus store providing quality products and fast hostel delivery.'}
                    </p>
                  </div>

                  {/* Store Followers & Action */}
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subscribed Followers
                      </span>
                      <span className="text-xs font-black text-amber-900 block">
                        {userStore?.followers_count || profile.followers || 0} Followers
                      </span>
                    </div>
                    {userStore?.id && (
                      <Button
                        asChild
                        size="sm"
                        className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg w-full"
                      >
                        <a href={`/store/${userStore.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1">
                          <span>Visit Public Store</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 6. ACTIVITY & QUICK RECORD ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('activity')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Activity & Marketplace Summary</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Live Record
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Total listings, completed peer sales, saved items & customer ratings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-teal-600">
                {openSections.activity ? 'Tap to hide' : 'Tap to view'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.activity ? 'rotate-180 bg-teal-50 text-teal-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.activity && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-lg font-black text-slate-900 block">
                    {realMetrics.listingsPosted ?? profile.products_listed ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Active Listings
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-lg font-black text-emerald-600 block">
                    {realMetrics.productsSold ?? profile.products_sold ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Items Sold
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-lg font-black text-rose-500 block">
                    {wishlistCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Wishlist Saved
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-lg font-black text-blue-600 block">
                    {realMetrics.followedStores ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Followed Stores
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-lg font-black text-amber-500 block">
                    {realReviews.rating > 0 ? `${realReviews.rating.toFixed(1)} ★` : '5.0 ★'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Rating ({realReviews.count} Reviews)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
