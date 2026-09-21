import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Store, HelpCircle } from 'lucide-react';

interface VerificationStatusBadgeProps {
  role: 'student' | 'store' | 'admin' | 'both';
  status: 'unverified' | 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationStatusBadge({
  role,
  status,
  size = 'sm',
  className = ''
}: VerificationStatusBadgeProps) {
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const badgeTextClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : size === 'md' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';

  if (role === 'store') {
    if (isApproved) {
      return (
        <Badge 
          id="badge-store-verified"
          variant="outline" 
          className={`font-extrabold uppercase bg-indigo-50 text-indigo-700 border-indigo-200 gap-1.5 rounded-full dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900 ${badgeTextClass} ${className}`}
        >
          <Store className={`${iconSize} text-indigo-600 fill-indigo-150`} />
          Verified Store
        </Badge>
      );
    } else if (isPending) {
      return (
        <Badge 
          id="badge-store-pending"
          variant="outline" 
          className={`font-semibold uppercase bg-amber-50 text-amber-700 border-amber-200 gap-1.5 rounded-full ${badgeTextClass} ${className}`}
        >
          <HelpCircle className={`${iconSize} text-amber-500 animate-pulse`} />
          Store Verification Pending
        </Badge>
      );
    } else {
      return (
        <Badge 
          id="badge-store-unverified"
          variant="outline" 
          className={`font-medium uppercase bg-slate-50 text-slate-500 border-slate-200 gap-1.5 rounded-full ${badgeTextClass} ${className}`}
        >
          <span className="inline-block w-2 hang-2 rounded-full bg-slate-400"></span>
          Unverified Store
        </Badge>
      );
    }
  }

  // Student accounts (and others)
  if (isApproved) {
    return (
      <Badge 
        id="badge-student-verified"
        variant="outline" 
        className={`font-extrabold uppercase bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 ${badgeTextClass} ${className}`}
      >
        <CheckCircle2 className={`${iconSize} text-emerald-600 fill-emerald-100`} />
        Verified Student
      </Badge>
    );
  } else if (isPending) {
    return (
      <Badge 
        id="badge-student-pending"
        variant="outline" 
        className={`font-semibold uppercase bg-amber-50 text-amber-700 border-amber-200 gap-1.5 rounded-full ${badgeTextClass} ${className}`}
      >
        <HelpCircle className={`${iconSize} text-amber-500 animate-pulse`} />
        Student Verification Pending
      </Badge>
    );
  } else {
    return (
      <Badge 
        id="badge-student-unverified"
        variant="outline" 
        className={`font-medium uppercase bg-slate-50 text-slate-500 border-slate-200 gap-1.5 rounded-full ${badgeTextClass} ${className}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
        Unverified Student
      </Badge>
    );
  }
}
