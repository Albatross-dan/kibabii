import * as React from 'react';
import { CheckCircle2, Star, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type BadgeType = 'email_verified' | 'verified_student' | 'verified_store' | 'top_seller';

interface ProfileBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIconOnly?: boolean;
}

export function ProfileBadge({ type, size = 'sm', className = '', showIconOnly = false }: ProfileBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  
  const config = {
    email_verified: {
      label: 'Email Verified',
      icon: <Mail className={`${iconSize} text-sky-500 fill-sky-50`} />,
      bgColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900',
      description: 'Passed secure student email verification',
    },
    verified_student: {
      label: 'Verified Student',
      icon: <CheckCircle2 className={`${iconSize} text-emerald-600 fill-emerald-50`} />,
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
      description: 'Officially verified student at Kibabii University',
    },
    verified_store: {
      label: 'Verified Store',
      icon: <ShieldCheck className={`${iconSize} text-indigo-600 fill-indigo-50`} />,
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900',
      description: 'Certified store business on Kibabii Market',
    },
    top_seller: {
      label: 'Top Seller',
      icon: <Star className={`${iconSize} text-amber-500 fill-amber-100`} />,
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
      description: 'Highly rated seller with excellent positive feedback',
    },
  }[type];

  if (!config) return null;

  const content = (
    <Badge
      id={`badge-${type}`}
      variant="outline"
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${config.bgColor} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${className}`}
    >
      {config.icon}
      {!showIconOnly && <span>{config.label}</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer inline-block">{content}</span>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-none text-xs rounded-xl p-3 max-w-xs shadow-xl space-y-1">
          <p className="font-extrabold">{config.label}</p>
          <p className="text-slate-300 font-medium leading-normal">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
