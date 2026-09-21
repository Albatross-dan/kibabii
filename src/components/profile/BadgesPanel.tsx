import * as React from 'react';
import { ShieldCheck, Award, Star, Mail, CheckCircle2, Clock, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/store/authStore';

interface BadgesPanelProps {
  profile: UserProfile;
}

export default function BadgesPanel({ profile }: BadgesPanelProps) {
  const isStudent = profile.role === 'student' || profile.role === 'both';
  const isStore = profile.role === 'store';

  const badges = [
    {
      id: 'email_verified',
      name: 'Email Verified',
      icon: <Mail className="h-4 w-4" />,
      tag: '✅ Email Verified',
      earned: profile.email_verified,
      description: 'Your regular university account email is secured.',
      progressText: 'Verify email inside settings.',
      progressPercent: profile.email_verified ? 100 : 0
    },
    {
      id: 'student_verified',
      name: 'Verified Student',
      icon: <BookOpen className="h-4 w-4" />,
      tag: '🎓 Verified Student',
      earned: isStudent && profile.student_verification_status === 'approved',
      description: 'Access exclusive peer-to-peer student marketplace deals.',
      progressText: 'Student verification status: ' + (profile.student_verification_status || 'unverified'),
      progressPercent: profile.student_verification_status === 'approved' ? 100 : profile.student_verification_status === 'pending' ? 50 : 0
    },
    {
      id: 'store_verified',
      name: 'Verified Store',
      icon: <Award className="h-4 w-4" />,
      tag: '🏪 Verified Store',
      earned: isStore && profile.store_verification_status === 'approved',
      description: 'Enables official bulk merchant listing slots.',
      progressText: 'Store verification status: ' + (profile.store_verification_status || 'unverified'),
      progressPercent: profile.store_verification_status === 'approved' ? 100 : profile.store_verification_status === 'pending' ? 50 : 0
    },
    {
      id: 'top_seller',
      name: 'Top Seller',
      icon: <Star className="h-4 w-4" />,
      tag: '⭐ Top Seller',
      earned: !!profile.is_top_seller,
      description: 'Maintained top ratings across recent comrade transactions.',
      progressText: 'Toggle Seller Status in simulated controls.',
      progressPercent: profile.is_top_seller ? 100 : 60
    },
    {
      id: 'fast_responder',
      name: 'Fast Responder',
      icon: <Zap className="h-4 w-4" />,
      tag: '🔥 Fast Responder',
      earned: false,
      description: 'Dispatches quick replies (avg under 10 minutes) to student chats.',
      progressText: 'Reply within 10 minutes to 4/5 student chats.',
      progressPercent: 80
    },
    {
      id: 'trusted_seller',
      name: 'Trusted Seller',
      icon: <ShieldCheck className="h-4 w-4" />,
      tag: '💎 Trusted Seller',
      earned: false,
      description: 'Successfully complete 10 marketplace transaction swaps.',
      progressText: 'Complete 8/10 safe swaps. Progress: 80%.',
      progressPercent: 80
    },
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      icon: <Clock className="h-4 w-4" />,
      tag: '🏅 Early Adopter',
      earned: true,
      description: 'Joined Kibu Market during early launch alpha phase.',
      progressText: 'Completed!',
      progressPercent: 100
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Verification Status list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-2xl border bg-white flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${profile.email_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-none">Email Address</span>
            <span className="text-xs font-black block mt-1">
              {profile.email_verified ? '✓ Verified Safe' : '✗ Unverified'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border bg-white flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${profile.student_verification_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : profile.student_verification_status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-none">Student Status</span>
            <span className="text-xs font-black block mt-1 capitalize">
              {profile.student_verification_status === 'approved' ? '✓ APPROVED student' : profile.student_verification_status}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border bg-white flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${profile.store_verification_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : profile.store_verification_status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block leading-none">Store Verification</span>
            <span className="text-xs font-black block mt-1 capitalize">
              {profile.store_verification_status === 'approved' ? '✓ Verified Merchant' : profile.store_verification_status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-extrabold text-slate-900 text-sm">Dashboard Honor Badges ({badges.filter(b => b.earned).length}/7)</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map(b => (
            <div 
              key={b.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                b.earned 
                  ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200' 
                  : 'bg-stone-50/50 border-slate-100 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${
                  b.earned ? 'bg-indigo-50 border-indigo-150 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {b.icon}
                </div>
                <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  b.earned ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-500'
                }`}>
                  {b.earned ? 'Earned' : 'In Progress'}
                </span>
              </div>

              <div className="space-y-1">
                <h5 className="text-xs font-black text-slate-900">{b.name}</h5>
                <p className="text-[10.5px] font-semibold text-slate-400 leading-snug">{b.description}</p>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-50 text-[10.5px]">
                <div className="flex justify-between items-baseline font-bold">
                  <span className="text-slate-500 truncate">{b.progressText}</span>
                  <span className="text-slate-800 shrink-0">{b.progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${b.earned ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                    style={{ width: `${b.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
