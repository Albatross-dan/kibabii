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
  MessageCircle,
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
  campusName?: string | null;
  subscriptionPlanName?: string | null;
  storeFollowersCount?: number;
  realReviews: { rating: number; count: number };
  realMetrics: Partial<DashboardMetrics>;
  isStore: boolean;
  hasStoreRow: boolean;
  wishlistCount: number;
  onOpenStoreModal?: () => void;
}

export default function AccountDetailsDropdowns({
  profile,
  realAuthUser,
  userStore,
  campusName,
  subscriptionPlanName,
  storeFollowersCount,
  realReviews,
  realMetrics,
  isStore,
  hasStoreRow,
  wishlistCount,
  onOpenStoreModal
}: AccountDetailsDropdownsProps) {
  // Set which dropdown accordions are open. Personal and Contact open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    campus: false,
    verification: false,
    activity: false,
    store: isStore,
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
      store: isStore,
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
    const rawDate = (profile as any)?.created_at || realAuthUser?.created_at;
    if (!rawDate) return 'Recently';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  }, [profile, realAuthUser]);

  const cleanWhatsappNumber = (profile.whatsapp_number || '').replace(/[^0-9]/g, '');
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
            Real data pulled live from your account record. Tap any section to view or verify.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="text-[11px] h-7 px-2.5 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Expand All
          </Button>
          <span className="text-slate-300">•</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="text-[11px] h-7 px-2.5 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
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
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Personal & Profile Details</span>
                  {profile.username && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      @{profile.username}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Full name, @handle, account classification & join date
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-indigo-600">
                {openSections.personal ? 'Hide' : 'View'}
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
                    Display Name
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {profile.full_name ? (
                      <>
                        <span className="text-xs font-black text-slate-900 truncate">
                          {profile.full_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.full_name, 'Name', 'fullname')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy name"
                        >
                          {copiedKey === 'fullname' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs italic text-slate-400">Not added yet</span>
                        <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Add Name</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Username @Handle
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {profile.username ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-xs italic text-slate-400">Not set</span>
                    )}
                  </div>
                </div>

                {/* Account Type Classification */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account Classification
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isStore ? (
                      hasStoreRow ? (
                        <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-amber-100 text-amber-950 border border-amber-300">
                          <StoreIcon className="h-3 w-3 text-amber-700" />
                          <span>Store Account</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <span>Store Setup Pending</span>
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 bg-blue-100 text-blue-950 border border-blue-300">
                        <GraduationCap className="h-3 w-3 text-blue-700" />
                        <span>Student Account</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* System Role */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Account Role
                  </span>
                  <span className="text-xs font-bold text-slate-800 capitalize block truncate">
                    {profile.role || 'Student'}
                  </span>
                </div>

                {/* Student Reg. Number */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Student Reg. Number
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {profile.student_reg_number ? (
                      <>
                        <span className="text-xs font-mono font-bold text-slate-800 truncate">
                          {profile.student_reg_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.student_reg_number || '', 'Reg Number', 'regnum')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >
                          {copiedKey === 'regnum' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs italic text-slate-400">Not added yet</span>
                        <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Add Number</a>
                      </div>
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
              {profile.id && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                  <span className="truncate">Account ID: {profile.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.id, 'Account ID', 'accid')}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold cursor-pointer"
                  >
                    {copiedKey === 'accid' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>Copy Account ID</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 2. CONTACT & COMMUNICATION CHANNELS ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('contact')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Contact & Communication Channels</span>
                  {profile.whatsapp_number && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      WhatsApp Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Verified email, telephone calling line & direct WhatsApp contact
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-600">
                {openSections.contact ? 'Hide' : 'View'}
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
                    {realAuthUser?.email_confirmed_at && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Confirmed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {(profile.email || realAuthUser?.email) ? (
                      <>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {profile.email || realAuthUser?.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(profile.email || realAuthUser?.email || '', 'Email', 'email')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >
                          {copiedKey === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs italic text-slate-400">Not added yet</span>
                    )}
                  </div>
                </div>

                {/* Primary Voice Call Phone */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Telephone Calling Line
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {profile.phone ? (
                      <>
                        <span className="text-xs font-mono font-bold text-slate-900 truncate">
                          {profile.phone}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${profile.phone}`}
                            className="p-1 rounded hover:bg-slate-100 text-primary hover:text-primary-dark"
                            title="Call phone number"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(profile.phone || '', 'Phone Number', 'phone')}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          >
                            {copiedKey === 'phone' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs italic text-slate-400">Not added yet</span>
                        <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Add Phone</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct WhatsApp Mobile Number */}
                <div className="p-3 bg-white border border-emerald-200/80 rounded-xl space-y-1 bg-emerald-50/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> WhatsApp Contact
                    </span>
                    {whatsappLink && (
                      <span className="text-[10px] font-extrabold text-emerald-700">Orders & Inquiries</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {profile.whatsapp_number ? (
                      <>
                        <span className="text-xs font-mono font-bold text-emerald-950 truncate">
                          {profile.whatsapp_number}
                        </span>
                        <div className="flex items-center gap-1">
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <span>Chat</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(profile.whatsapp_number || '', 'WhatsApp Number', 'whatsapp')}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          >
                            {copiedKey === 'whatsapp' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs italic text-slate-400">Not added yet</span>
                        <a href="#settings" className="text-[11px] font-bold text-emerald-700 hover:underline">Add WhatsApp</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. CAMPUS & RESIDENCE COORDINATES ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('campus')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Campus & Residence Coordinates</span>
                  {campusName ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {campusName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      No Campus Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  University campus, living area & safe physical meetup spots
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-sky-600">
                {openSections.campus ? 'Hide' : 'View'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.campus ? 'rotate-180 bg-sky-50 text-sky-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.campus && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* University Campus */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Campus Institution
                  </span>
                  {campusName ? (
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {campusName}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs italic text-slate-400">Not selected</span>
                      <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Select Campus</a>
                    </div>
                  )}
                </div>

                {/* Campus Zone / Branch */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Campus Zone / Area
                  </span>
                  {(profile.campus || campusName) ? (
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {profile.campus || campusName}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs italic text-slate-400">Not added yet</span>
                      <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Add Zone</a>
                    </div>
                  )}
                </div>

                {/* Hostel / Residence Area */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hostel / Living Area
                  </span>
                  {profile.hostel_area ? (
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {profile.hostel_area}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs italic text-slate-400">Not added yet</span>
                      <a href="#settings" className="text-[11px] font-bold text-primary hover:underline">Add Area</a>
                    </div>
                  )}
                </div>

                {/* Recommended Safe Meetup Spot */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 sm:col-span-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Safe Physical Exchange Advice
                  </span>
                  <p className="text-xs font-medium text-slate-700">
                    Always arrange exchanges at well-lit, public campus locations during daylight hours (e.g. Student Center, Library Foyer, or Main Gate entrance).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. VERIFICATION & TRUST CREDENTIALS ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('verification')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Verification & Trust Credentials</span>
                  {profile.is_verified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Verified Account
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Standard Profile
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Account verification status, student credentials & seller rank
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-purple-600">
                {openSections.verification ? 'Hide' : 'View'}
              </span>
              <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.verification ? 'rotate-180 bg-purple-50 text-purple-600' : ''}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </button>

          {openSections.verification && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Account Profile Verification — Strictly gated on profiles.is_verified = true */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Profile Verification
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    profile.is_verified
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profile.is_verified ? '✓ Verified Account' : '• Unverified Account'}
                  </span>
                </div>

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
                    {profile.student_verification_status === 'approved' ? '✓ Verified Student' : profile.student_verification_status === 'pending' ? '⏳ Under Review' : '• Not Submitted'}
                  </span>
                </div>

                {/* Store Merchant Verification (only relevant if has store) */}
                {hasStoreRow && (
                  <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Store Verification
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                      userStore?.is_verified || userStore?.verification_status === 'approved'
                        ? 'bg-indigo-100 text-indigo-800'
                        : userStore?.verification_status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {userStore?.is_verified || userStore?.verification_status === 'approved' ? '✓ Verified Merchant' : userStore?.verification_status === 'pending' ? '⏳ Pending Review' : '• Unverified Store'}
                    </span>
                  </div>
                )}

                {/* Email Verification */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Security
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                    {realAuthUser?.email_confirmed_at ? '✓ Email Confirmed' : '✓ Account Active'}
                  </span>
                </div>

                {/* Top Seller Badge */}
                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Seller Rank
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    profile.is_top_seller
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profile.is_top_seller ? '⭐ Top Campus Seller' : 'Standard Trader'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. STORE & COMMERCIAL PROFILE ================= */}
        {isStore && (
          <div className="border border-amber-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('store')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-50/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <StoreIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Store & Merchant Profile</span>
                    {hasStoreRow ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {userStore.name || userStore.store_name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Setup Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {hasStoreRow ? 'Store name, physical location, category & subscription plan' : 'Complete store registration to activate merchant tools'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-block text-[11px] font-bold text-amber-800">
                  {openSections.store ? 'Hide' : 'View'}
                </span>
                <div className={`p-1 rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.store ? 'rotate-180 bg-amber-100 text-amber-900' : ''}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </button>

            {openSections.store && (
              <div className="p-4 sm:p-5 border-t border-amber-100 bg-amber-50/20 animate-fadeIn">
                {hasStoreRow ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Store Name */}
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Store Name
                      </span>
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {userStore.name || userStore.store_name || 'Not set'}
                      </span>
                    </div>

                    {/* Business Category */}
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Business Category
                      </span>
                      {userStore.category ? (
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {userStore.category}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Not specified</span>
                      )}
                    </div>

                    {/* Physical Stall Location */}
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Physical Spot / Location
                      </span>
                      {userStore.location ? (
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {userStore.location}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Not added yet</span>
                      )}
                    </div>

                    {/* Store Description */}
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Store Description
                      </span>
                      {userStore.description ? (
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                          {userStore.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400">
                          Not added yet.
                        </p>
                      )}
                    </div>

                    {/* Store Followers & Plan & Action */}
                    <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Subscribed Followers
                          </span>
                          <span className="text-xs font-black text-amber-900 block">
                            {storeFollowersCount ?? userStore.follower_count ?? 0} Followers
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Active Plan
                          </span>
                          <span className="text-xs font-black text-indigo-700 block">
                            {subscriptionPlanName || userStore.subscription_plan || 'Free'}
                          </span>
                        </div>
                      </div>
                      {userStore.id && (
                        <Button
                          asChild
                          size="sm"
                          className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg w-full"
                        >
                          <a href={`/store/${userStore.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1">
                            <span>Visit Public Store Page</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Store Profile Not Created Yet</h4>
                        <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                          Your account type is set to Business Owner, but your store details have not been submitted to the marketplace registry. Register your store name, stall spot, and category to unlock merchant tools.
                        </p>
                      </div>
                    </div>
                    {onOpenStoreModal && (
                      <Button
                        type="button"
                        onClick={onOpenStoreModal}
                        className="h-9 px-4 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
                      >
                        Complete Store Setup Now
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= 6. ACTIVITY & QUICK RECORD ================= */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSection('activity')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
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
                  Active listings, sold items, saved wishlist items & reputation reviews
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-bold text-teal-600">
                {openSections.activity ? 'Hide' : 'View'}
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
                    {realMetrics.listingsPosted ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Active Listings
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
                  <span className="text-lg font-black text-emerald-600 block">
                    {realMetrics.productsSold ?? 0}
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
                    {realReviews.count > 0 ? `${realReviews.rating.toFixed(1)} ★` : '0 ★'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {realReviews.count > 0 ? `${realReviews.count} Reviews` : 'No reviews'}
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
