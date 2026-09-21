import * as React from 'react';
import { ShieldCheck, CheckCircle2, Star, BadgeAlert, MailCheck, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AccountBadgeProps {
  emailVerified?: boolean;
  studentVerificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  storeVerificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  isTopSeller?: boolean;
  role?: 'student' | 'store' | 'admin' | 'both' | 'shop_owner';
  size?: 'sm' | 'md' | 'lg';
  showAll?: boolean;
}

export default function AccountBadge({
  emailVerified = false,
  studentVerificationStatus = 'unverified',
  storeVerificationStatus = 'unverified',
  isTopSeller = false,
  role = 'student',
  size = 'sm',
  showAll = false
}: AccountBadgeProps) {
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  const badgeTextClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : size === 'md' ? 'text-[11px] px-2 py-1' : 'text-xs px-2.5 py-1.5';

  const isStudent = role === 'student' || role === 'both';
  const isStore = role === 'store' || role === 'shop_owner';

  const badgesToRender = [];

  // 1. Shop Owner badge (when role is shop_owner or store)
  if (role === 'shop_owner' || role === 'store') {
    badgesToRender.push({
      id: 'shop_owner',
      label: 'Shop Owner',
      color: 'bg-indigo-600 text-white hover:bg-indigo-700 border-none font-black',
      icon: <Store className={`${iconSize} fill-indigo-100`} />,
      description: 'Campus Shop Owner & Merchant'
    });
  }

  // 2. Top Seller badge
  if (isTopSeller) {
    badgesToRender.push({
      id: 'top_seller',
      label: 'Top Seller',
      color: 'bg-amber-500 text-white hover:bg-amber-600 border-none font-black',
      icon: <Star className={`${iconSize} fill-white`} />,
      description: 'Top rated marketplace trader with excellent customer reviews'
    });
  }

  // 3. Verified Student / Store badge
  if (studentVerificationStatus === 'approved') {
    badgesToRender.push({
      id: 'verified_student',
      label: 'Verified Student',
      color: 'bg-emerald-600 text-white hover:bg-emerald-700 border-none font-black',
      icon: <CheckCircle2 className={`${iconSize} fill-emerald-100`} />,
      description: 'Officially verified Kibabii University Comrade'
    });
  } else if (storeVerificationStatus === 'approved') {
    badgesToRender.push({
      id: 'verified_store',
      label: 'Verified Store',
      color: 'bg-emerald-600 text-white hover:bg-emerald-700 border-none font-black',
      icon: <ShieldCheck className={`${iconSize} fill-emerald-100`} />,
      description: 'Officially verified Kibabii University Store'
    });
  }

  // 3. Email Verified badge (render if email verified, but don't clutter unless asked or specifically showing stats)
  if (emailVerified && (showAll || badgesToRender.length === 0)) {
    badgesToRender.push({
      id: 'email_verified',
      label: 'Email Verified',
      color: 'bg-sky-500 text-white hover:bg-sky-600 border-none font-black',
      icon: <MailCheck className={iconSize} />,
      description: 'Passed secure student/marketplace email verification'
    });
  }

  // 4. Unverified badge if absolutely nothing is validated
  if (!emailVerified && studentVerificationStatus !== 'approved' && storeVerificationStatus !== 'approved' && badgesToRender.length === 0) {
    badgesToRender.push({
      id: 'unverified',
      label: 'Unverified User',
      color: 'bg-slate-300 text-slate-700 border-none hover:bg-slate-400 font-bold',
      icon: <BadgeAlert className={`${iconSize} text-slate-500`} />,
      description: 'Unverified profile. Use caution when dealing.'
    });
  }

  // If we just want the primary single badge representation for density
  const activeBadges = showAll ? badgesToRender : [badgesToRender[0]].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {activeBadges.map((b) => (
        <div key={b.id} className="inline-block">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`flex items-center gap-1 rounded-xl cursor-help select-none ${b.color} ${badgeTextClass}`}>
                {b.icon}
                <span className="font-extrabold uppercase tracking-wider">{b.label}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 border-none text-white font-sans text-xs max-w-xs font-semibold rounded-lg p-2 shadow-lg">
              <p className="font-bold mb-0.5">{b.label}</p>
              <p className="text-slate-300 font-medium text-[10px] leading-tight">{b.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
